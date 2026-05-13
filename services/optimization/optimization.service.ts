import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createAdCampaignRepository,
  type AdCampaignRow,
} from "@/repositories/ad-account.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createEngineDecisionRepository,
  createEngineEventRepository,
  createOptimizationRunRepository,
  type EngineDecisionActionKind,
} from "@/repositories/engine-telemetry.repository";

/**
 * The Optimization Loop service.
 *
 * It pulls every active business, summarizes the last N hours of engagement
 * events + ad campaign metrics, and generates 0–N decisions per business.
 *
 * Decisions are *heuristic* (no AI call) so this runs cheaply and
 * deterministically; the AI rubric layer can plug in later by replacing
 * `generateDecisionsForBusiness` with an OpenAI prompt.
 */

export type OptimizationSummary = {
  businessesAnalyzed: number;
  eventsConsidered: number;
  decisionsGenerated: number;
};

const DEFAULT_WINDOW_HOURS = 24;

export async function runOptimizationSweep(
  client: SupabaseClient,
  args?: { windowHours?: number },
): Promise<ServiceResult<OptimizationSummary>> {
  const windowHours = args?.windowHours ?? DEFAULT_WINDOW_HOURS;
  const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
  const until = new Date().toISOString();

  const businessesRepo = createBusinessRepository(client);
  const { data: allBiz, error } = await businessesRepo.listAll();
  if (error) return fail(error.message);

  let totalEvents = 0;
  let totalDecisions = 0;
  let totalBusinesses = 0;

  for (const biz of allBiz ?? []) {
    totalBusinesses += 1;
    const result = await runOptimizationForBusiness(client, biz.id, {
      sinceIso: since,
      untilIso: until,
    });
    if (result.success) {
      totalEvents += result.data.eventsConsidered;
      totalDecisions += result.data.decisionsGenerated;
    }
  }

  return ok({
    businessesAnalyzed: totalBusinesses,
    eventsConsidered: totalEvents,
    decisionsGenerated: totalDecisions,
  });
}

export async function runOptimizationForBusiness(
  client: SupabaseClient,
  businessId: string,
  window: { sinceIso: string; untilIso: string },
): Promise<ServiceResult<{ eventsConsidered: number; decisionsGenerated: number }>> {
  const eventsRepo = createEngineEventRepository(client);
  const decisionsRepo = createEngineDecisionRepository(client);
  const runsRepo = createOptimizationRunRepository(client);
  const campaignsRepo = createAdCampaignRepository(client);

  const [{ data: events }, { data: campaigns }] = await Promise.all([
    eventsRepo.countByTypeSince(businessId, window.sinceIso),
    campaignsRepo.listByBusiness(businessId, 200),
  ]);

  const eventList = (events ?? []) as Array<{ event_type: string }>;
  const eventCounts: Record<string, number> = {};
  for (const e of eventList) {
    eventCounts[e.event_type] = (eventCounts[e.event_type] ?? 0) + 1;
  }

  const decisions = generateDecisionsForBusiness({
    eventCounts,
    campaigns: (campaigns ?? []) as AdCampaignRow[],
  });

  // Persist the run row first so decisions can reference it.
  const { data: runRow, error: runErr } = await runsRepo.insert({
    businessId,
    windowStartedAt: window.sinceIso,
    windowEndedAt: window.untilIso,
    eventsConsidered: eventList.length,
    decisionsGenerated: decisions.length,
    status: "success",
  });
  if (runErr || !runRow) return fail(runErr?.message ?? "Failed to record optimization run");

  for (const d of decisions) {
    await decisionsRepo.insert({
      businessId,
      optimizationRunId: runRow.id,
      rationale: d.rationale,
      actionKind: d.actionKind,
      actionPayload: d.actionPayload,
      status: d.autoApply ? "approved" : "pending",
    });
  }

  return ok({ eventsConsidered: eventList.length, decisionsGenerated: decisions.length });
}

type HeuristicDecision = {
  rationale: string;
  actionKind: EngineDecisionActionKind;
  actionPayload: Record<string, unknown>;
  autoApply: boolean;
};

function generateDecisionsForBusiness(args: {
  eventCounts: Record<string, number>;
  campaigns: AdCampaignRow[];
}): HeuristicDecision[] {
  const out: HeuristicDecision[] = [];
  const views = args.eventCounts["page_view"] ?? 0;
  const submits = args.eventCounts["form_submit"] ?? 0;
  const clicks = args.eventCounts["cta_click"] ?? 0;

  // 1. Low conversion rate (lots of views, few submits)
  if (views >= 50 && submits / Math.max(1, views) < 0.01) {
    out.push({
      rationale: `Only ${submits} form submits across ${views} views (< 1%). Try a stronger headline variant.`,
      actionKind: "swap_headline",
      actionPayload: { reason: "low_conversion", views, submits },
      autoApply: false,
    });
  }

  // 2. High click-but-no-submit (forms might be broken or CTAs misleading)
  if (clicks >= 20 && submits === 0) {
    out.push({
      rationale: `Visitors are clicking CTAs (${clicks}) but no submissions yet — investigate form UX or trust signals.`,
      actionKind: "swap_headline",
      actionPayload: { reason: "cta_click_no_submit", clicks },
      autoApply: false,
    });
  }

  // 3. Active campaigns with high spend but no leads
  for (const c of args.campaigns) {
    if (c.status !== "active") continue;
    const spend = Number(c.spend_usd ?? 0);
    const leads = Number(c.leads ?? 0);
    if (spend >= 25 && leads === 0) {
      out.push({
        rationale: `Campaign "${c.name}" has spent $${spend.toFixed(2)} with 0 leads. Pause and re-evaluate creative.`,
        actionKind: "pause_variant",
        actionPayload: { campaignId: c.id, spend },
        autoApply: false,
      });
    }
    if (leads >= 5 && spend / leads < 15) {
      out.push({
        rationale: `Campaign "${c.name}" has a CPL of $${(spend / leads).toFixed(2)} (≤ $15) — scale daily budget by 20%.`,
        actionKind: "scale_budget",
        actionPayload: {
          campaignId: c.id,
          currentBudget: Number(c.daily_budget_usd ?? 0),
          suggestedMultiplier: 1.2,
        },
        autoApply: false,
      });
    }
  }

  if (out.length === 0) {
    out.push({
      rationale: "No issues detected in this window. Continue current strategy.",
      actionKind: "no_op",
      actionPayload: {},
      autoApply: true,
    });
  }

  return out;
}
