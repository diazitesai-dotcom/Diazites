import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createApprovalRepository,
  createNotificationRepository,
} from "@/repositories/cross-cutting.repository";
import {
  createEngineRepository,
  type EngineRunRow,
  type EngineStep,
} from "@/repositories/engine.repository";
import { triggerEvent } from "@/services/events/event-dispatcher";
import { EVENT_TYPES } from "@/types/backend";

import {
  isOpenAiConfigured,
} from "./ai/openai-client";
import { runResearchStep, type EngineResearch } from "./ai/research.ai";
import { runStrategyStep, type EngineStrategy } from "./ai/strategy.ai";
import { runFunnelStep, type EngineFunnel } from "./ai/funnel.ai";
import {
  runGenerationStep,
  type EngineGenerationPlan,
} from "./ai/generation.ai";
import {
  flattenVariants,
  runVariantsStep,
  type FlattenedVariant,
} from "./ai/variants.ai";
import { runScoringStep, type ScorableVariant } from "./ai/scoring.ai";
import { launchWinningLandingPage } from "./launch.service";

import {
  ENGINE_STEPS,
  ENGINE_STEP_KEYS,
  stepIndex,
} from "@/lib/engine-steps";

export { ENGINE_STEPS, ENGINE_STEP_KEYS, stepIndex };

export function nextStep(step: EngineStep): EngineStep | null {
  const idx = stepIndex(step);
  if (idx < 0 || idx >= ENGINE_STEP_KEYS.length - 1) return null;
  return ENGINE_STEP_KEYS[idx + 1];
}

export function isFinalStep(step: EngineStep): boolean {
  return step === "launch";
}

/** Stage 8 — user can launch from scoring (one click) or finalize when already on launch. */
export function isLaunchReadyStep(step: EngineStep): boolean {
  return step === "scoring" || step === "launch";
}

export type EngineInputPayload = {
  websiteUrl?: string;
  niche?: string;
  goal?: string;
  targetAudience?: string;
  location?: string;
  budget?: number;
  trafficSource?: string;
};

/**
 * Marker flag we add to payloads produced by deterministic stubs so downstream
 * steps can detect "no real AI ran for the prior step" and stub themselves.
 */
const STUB_MARKER = "_stub" as const;

function stubPayload(extra: Record<string, unknown>): Record<string, unknown> {
  return { [STUB_MARKER]: true, ...extra };
}

function isStubbed(payload: Record<string, unknown> | null | undefined): boolean {
  return Boolean(payload && (payload as Record<string, unknown>)[STUB_MARKER]);
}

/**
 * Fallback payloads used when OpenAI is not configured or upstream payloads
 * weren't produced by real AI. Keeps the UI working end-to-end without keys.
 */
const STEP_STUBS: Record<EngineStep, (run: EngineRunRow) => Record<string, unknown>> = {
  input: (run) => run.input_payload,
  research: () =>
    stubPayload({
      note: "Stubbed — set OPENAI_API_KEY to populate this step with real research.",
      audienceProfile: null,
      painPoints: [],
      offerAngles: [],
      keywords: [],
      positioningHooks: [],
      competitors: [],
      marketInsights: [],
    }),
  strategy: () =>
    stubPayload({
      note: "Stubbed — depends on a real Research step.",
      positioning: null,
      offer: null,
      cta: null,
      funnelType: null,
      trafficStrategy: [],
      successMetrics: null,
    }),
  funnel: () =>
    stubPayload({
      note: "Stubbed — depends on a real Strategy step.",
      summary: null,
      nodes: [
        { id: "ad", label: "Ad / Traffic" },
        { id: "lp", label: "Landing Page" },
        { id: "capture", label: "Lead Capture" },
        { id: "thankyou", label: "Thank You" },
        { id: "followup", label: "Follow-Up System" },
      ],
      edges: [],
      followupSequence: { emails: [], sms: [] },
    }),
  generation: () =>
    stubPayload({
      note: "Phase 3 will fill this with structured ad/email/SMS/LP asset generation.",
      plannedAssets: [
        "landing_page",
        "ad",
        "email",
        "sms",
        "headline",
        "faq",
        "lead_magnet",
        "social_proof",
      ],
    }),
  variants: () =>
    stubPayload({
      note: "Phase 3 will fill this with variant generation (A/B/C/D per asset kind).",
      plannedVariants: ["A", "B", "C", "D"],
    }),
  scoring: () =>
    stubPayload({
      note: "Phase 3 will fill this with a 6-axis scoring rubric.",
      rubric: [
        "clarity",
        "trust",
        "emotional_impact",
        "cta_strength",
        "mobile_ux",
        "conversion_potential",
      ],
      winner: null,
    }),
  launch: () =>
    stubPayload({
      note: "Phase 4 will fill this with domain + pixel + UTM + QA checklist results.",
      checklist: {
        domainSetup: false,
        trackingSetup: false,
        analyticsSetup: false,
        conversionEvents: false,
        pixelInstallation: false,
        utmBuilder: false,
        qaCheck: false,
      },
    }),
};

type StepContext = {
  supabase: SupabaseClient;
  run: EngineRunRow;
};

type StepHandler = (ctx: StepContext) => Promise<Record<string, unknown>>;

/**
 * Real (or stubbed) handlers for each step. Returning a payload here is the
 * sole way a step persists its output.
 */
const STEP_HANDLERS: Record<EngineStep, StepHandler> = {
  input: async ({ run }) => run.input_payload,

  research: async ({ supabase, run }) => {
    if (!isOpenAiConfigured()) return STEP_STUBS.research(run);

    const businesses = createBusinessRepository(supabase);
    const { data: business } = await businesses.getById(run.business_id);

    const result = await runResearchStep({
      supabase,
      businessId: run.business_id,
      runId: run.id,
      input: run.input_payload as EngineInputPayload,
      businessContext: business
        ? {
            name: business.name,
            services: business.services,
            cityState: business.city_state,
          }
        : undefined,
    });

    if (!result.success) {
      return stubPayload({
        note: `AI research failed: ${result.error}`,
        error: result.error,
      });
    }
    return result.data as unknown as Record<string, unknown>;
  },

  strategy: async ({ supabase, run }) => {
    if (!isOpenAiConfigured() || isStubbed(run.research_payload)) {
      return STEP_STUBS.strategy(run);
    }

    const result = await runStrategyStep({
      supabase,
      businessId: run.business_id,
      runId: run.id,
      input: run.input_payload as EngineInputPayload,
      research: run.research_payload as unknown as EngineResearch,
    });

    if (!result.success) {
      return stubPayload({
        note: `AI strategy failed: ${result.error}`,
        error: result.error,
      });
    }
    return result.data as unknown as Record<string, unknown>;
  },

  funnel: async ({ supabase, run }) => {
    if (
      !isOpenAiConfigured() ||
      isStubbed(run.research_payload) ||
      isStubbed(run.strategy_payload)
    ) {
      return STEP_STUBS.funnel(run);
    }

    const result = await runFunnelStep({
      supabase,
      businessId: run.business_id,
      runId: run.id,
      input: run.input_payload as EngineInputPayload,
      research: run.research_payload as unknown as EngineResearch,
      strategy: run.strategy_payload as unknown as EngineStrategy,
    });

    if (!result.success) {
      return stubPayload({
        note: `AI funnel failed: ${result.error}`,
        error: result.error,
      });
    }
    return result.data as unknown as Record<string, unknown>;
  },

  generation: async ({ supabase, run }) => {
    if (
      !isOpenAiConfigured() ||
      isStubbed(run.research_payload) ||
      isStubbed(run.strategy_payload) ||
      isStubbed(run.funnel_payload)
    ) {
      return STEP_STUBS.generation(run);
    }

    const result = await runGenerationStep({
      supabase,
      businessId: run.business_id,
      runId: run.id,
      input: run.input_payload as EngineInputPayload,
      research: run.research_payload as unknown as EngineResearch,
      strategy: run.strategy_payload as unknown as EngineStrategy,
      funnel: run.funnel_payload as unknown as EngineFunnel,
    });

    if (!result.success) {
      return stubPayload({
        note: `AI generation failed: ${result.error}`,
        error: result.error,
      });
    }
    return result.data as unknown as Record<string, unknown>;
  },

  variants: async ({ supabase, run }) => {
    if (
      !isOpenAiConfigured() ||
      isStubbed(run.research_payload) ||
      isStubbed(run.strategy_payload) ||
      isStubbed(run.funnel_payload) ||
      isStubbed(run.generation_payload)
    ) {
      return STEP_STUBS.variants(run);
    }

    const result = await runVariantsStep({
      supabase,
      businessId: run.business_id,
      runId: run.id,
      input: run.input_payload as EngineInputPayload,
      research: run.research_payload as unknown as EngineResearch,
      strategy: run.strategy_payload as unknown as EngineStrategy,
      funnel: run.funnel_payload as unknown as EngineFunnel,
      plan: run.generation_payload as unknown as EngineGenerationPlan,
    });

    if (!result.success) {
      return stubPayload({
        note: `AI variants failed: ${result.error}`,
        error: result.error,
      });
    }

    const flattened: FlattenedVariant[] = flattenVariants(result.data);
    const engine = createEngineRepository(supabase);
    const { error: bulkError } = await engine.insertAssetsBulk(
      flattened.map((v) => ({
        runId: run.id,
        businessId: run.business_id,
        kind: v.kind,
        variantLabel: v.variantLabel,
        payload: v.payload,
      })),
    );
    if (bulkError) {
      return stubPayload({
        note: `Failed to persist variants: ${bulkError.message}`,
        error: bulkError.message,
      });
    }

    return {
      assetsCreated: flattened.length,
      kinds: Array.from(new Set(flattened.map((v) => v.kind))),
      variantLabels: ["A", "B", "C", "D"],
      summary: result.data as unknown as Record<string, unknown>,
    };
  },

  scoring: async ({ supabase, run }) => {
    if (!isOpenAiConfigured() || isStubbed(run.variants_payload)) {
      return STEP_STUBS.scoring(run);
    }

    const engine = createEngineRepository(supabase);
    const { data: assetRows, error: listErr } = await engine.listAssetsForRun(run.id);
    if (listErr) {
      return stubPayload({
        note: `Failed to load assets for scoring: ${listErr.message}`,
        error: listErr.message,
      });
    }
    if (!assetRows || assetRows.length === 0) {
      return stubPayload({
        note: "No assets exist on this run to score.",
      });
    }

    const scorable: ScorableVariant[] = assetRows.map((row) => ({
      kind: row.kind as ScorableVariant["kind"],
      variantLabel: row.variant_label as ScorableVariant["variantLabel"],
      payload: row.payload,
    }));

    const result = await runScoringStep({
      supabase,
      businessId: run.business_id,
      runId: run.id,
      variants: scorable,
    });

    if (!result.success) {
      return stubPayload({
        note: `AI scoring failed: ${result.error}`,
        error: result.error,
      });
    }

    const scoresByKey = new Map<string, (typeof result.data.scores)[number]>();
    for (const s of result.data.scores) {
      scoresByKey.set(`${s.kind}::${s.variantLabel}`, s);
    }

    let winnerLandingPageAssetId: string | null = null;

    for (const row of assetRows) {
      const score = scoresByKey.get(`${row.kind}::${row.variant_label}`);
      if (!score) continue;
      const isWinner =
        result.data.winnerByKind[row.kind as keyof typeof result.data.winnerByKind] ===
        row.variant_label;
      await engine.updateAssetScore(row.id, score as unknown as Record<string, unknown>, isWinner);
      if (isWinner && row.kind === "landing_page") {
        winnerLandingPageAssetId = row.id;
      }
    }

    if (winnerLandingPageAssetId) {
      await engine.setWinnerAsset(run.id, winnerLandingPageAssetId);
    }

    return {
      rubric: [
        "clarity",
        "trust",
        "emotionalImpact",
        "ctaStrength",
        "mobileUx",
        "conversionPotential",
      ],
      winnerByKind: result.data.winnerByKind,
      scores: result.data.scores,
      winnerLandingPageAssetId,
    };
  },

  launch: async ({ supabase, run }) => {
    if (!run.winner_asset_id) {
      return STEP_STUBS.launch(run);
    }

    const result = await launchWinningLandingPage(supabase, run);
    if (!result.success) {
      return stubPayload({
        note: `Launch failed: ${result.error}`,
        error: result.error,
      });
    }
    return result.data as unknown as Record<string, unknown>;
  },
};

export async function startEngineRun(
  client: SupabaseClient,
  input: { businessId: string; input: EngineInputPayload },
): Promise<ServiceResult<EngineRunRow>> {
  const engine = createEngineRepository(client);
  const { data, error } = await engine.createRun({
    businessId: input.businessId,
    inputPayload: (input.input ?? {}) as Record<string, unknown>,
  });
  if (error || !data) return fail(error?.message ?? "Failed to start engine run");
  return ok(data as EngineRunRow);
}

/**
 * Advance a run one step forward. Calls the real AI handler for the new step
 * (Research / Strategy / Funnel currently), writes its payload, and bumps
 * `current_step`. Falls back to stub payloads when AI is unavailable.
 */
export async function advanceEngineRun(
  client: SupabaseClient,
  runId: string,
): Promise<ServiceResult<EngineRunRow>> {
  const engine = createEngineRepository(client);
  const { data: runData, error } = await engine.getRunById(runId);
  if (error) return fail(error.message);
  if (!runData) return fail("Run not found", "not_found");

  const current = runData as EngineRunRow;

  if (current.status !== "running" && current.status !== "needs_approval") {
    return fail(`Run is ${current.status}; cannot advance`, "invalid_state");
  }

  const target = nextStep(current.current_step);

  if (!target) {
    if (current.current_step !== "launch") {
      return fail("Run is already complete", "invalid_state");
    }
    const existing = current.launch_payload;
    if (existing && typeof existing === "object") {
      return finalizeEngineLaunch(client, current, existing as Record<string, unknown>);
    }
    const launchPayload = await STEP_HANDLERS.launch({ supabase: client, run: current });
    await engine.updateStepPayload(runId, "launch", launchPayload);
    const { data: refreshed, error: refreshErr } = await engine.getRunById(runId);
    if (refreshErr || !refreshed) {
      return fail(refreshErr?.message ?? "Failed to refresh run after launch");
    }
    return finalizeEngineLaunch(client, refreshed as EngineRunRow, launchPayload);
  }

  const handler = STEP_HANDLERS[target];
  let payload: Record<string, unknown>;
  try {
    payload = await handler({ supabase: client, run: current });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Step handler threw";
    await engine.updateStatus(runId, "failed", { failedReason: message });
    return fail(message, "step_failed");
  }

  const { error: payloadErr } = await engine.updateStepPayload(runId, target, payload);
  if (payloadErr) return fail(payloadErr.message);

  const { data: advanced, error: stepErr } = await engine.updateStep(runId, target);
  if (stepErr || !advanced) {
    return fail(stepErr?.message ?? "Failed to advance step");
  }

  if (target === "launch") {
    return finalizeEngineLaunch(client, advanced as EngineRunRow, payload);
  }

  return ok(advanced as EngineRunRow);
}

/**
 * Run every remaining stage until launch completes (max 9 advances).
 */
export async function runFullEnginePipeline(
  client: SupabaseClient,
  runId: string,
): Promise<ServiceResult<EngineRunRow>> {
  const maxPasses = 9;
  let last: EngineRunRow | null = null;

  for (let i = 0; i < maxPasses; i++) {
    const engine = createEngineRepository(client);
    const { data: runData, error } = await engine.getRunById(runId);
    if (error || !runData) return fail(error?.message ?? "Run not found", "not_found");

    const run = runData as EngineRunRow;
    if (run.status === "launched" || run.status === "needs_approval" || run.status === "failed") {
      return ok(run);
    }
    if (run.status !== "running") {
      return fail(`Run is ${run.status}; cannot continue`, "invalid_state");
    }

    const result = await advanceEngineRun(client, runId);
    if (!result.success) return result;
    last = result.data;

    if (
      last.status === "launched" ||
      last.status === "needs_approval" ||
      last.status === "failed"
    ) {
      return ok(last);
    }
  }

  return fail("Engine did not finish within step limit", "step_failed");
}

async function finalizeEngineLaunch(
  client: SupabaseClient,
  run: EngineRunRow,
  launchPayload: Record<string, unknown>,
): Promise<ServiceResult<EngineRunRow>> {
  const engine = createEngineRepository(client);
  const launchStatus = (launchPayload as { status?: string }).status;
  const qaFailed = launchStatus === "qa_failed";

  const { data: updated, error: updateErr } = await engine.updateStatus(
    run.id,
    qaFailed ? "needs_approval" : "launched",
    qaFailed
      ? { failedReason: "Launch QA checks did not pass" }
      : { launchedAt: new Date().toISOString() },
  );
  if (updateErr || !updated) {
    return fail(updateErr?.message ?? "Failed to finalize launch");
  }

  try {
    await emitLaunchSideEffects(client, run, qaFailed, launchPayload);
  } catch {
    // swallow
  }

  return ok(updated as EngineRunRow);
}

export async function getEngineRun(
  client: SupabaseClient,
  runId: string,
): Promise<ServiceResult<EngineRunRow | null>> {
  const engine = createEngineRepository(client);
  const { data, error } = await engine.getRunById(runId);
  if (error) return fail(error.message);
  return ok((data as EngineRunRow | null) ?? null);
}

export async function getActiveEngineRun(
  client: SupabaseClient,
  businessId: string,
): Promise<ServiceResult<EngineRunRow | null>> {
  const engine = createEngineRepository(client);
  const { data, error } = await engine.getActiveRunForBusiness(businessId);
  if (error) return fail(error.message);
  return ok((data as EngineRunRow | null) ?? null);
}

export async function listEngineRuns(
  client: SupabaseClient,
  businessId: string,
  limit = 25,
): Promise<ServiceResult<EngineRunRow[]>> {
  const engine = createEngineRepository(client);
  const { data, error } = await engine.listRunsForBusiness(businessId, limit);
  if (error) return fail(error.message);
  return ok((data as EngineRunRow[]) ?? []);
}

/**
 * After a launch completes, push side-effects into the cross-cutting tables.
 *
 *  - On QA failure: open an approval ticket so an operator can review and
 *    notify the business owner that the launch is paused.
 *  - On success: notify the owner that their landing page is live.
 */
async function emitLaunchSideEffects(
  client: SupabaseClient,
  run: EngineRunRow,
  qaFailed: boolean,
  launchPayload: Record<string, unknown>,
): Promise<void> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(run.business_id);
  if (!business) return;

  const ownerUserId = (business as { user_id?: string | null }).user_id ?? null;
  const notifications = createNotificationRepository(client);

  if (qaFailed) {
    const approvals = createApprovalRepository(client);
    await approvals.request({
      businessId: run.business_id,
      subjectKind: "engine_launch",
      subjectId: run.id,
      requestedBy: ownerUserId,
      note: "Launch QA checks did not pass; manual review required.",
    });
    if (ownerUserId) {
      await notifications.create({
        userId: ownerUserId,
        businessId: run.business_id,
        kind: "approval_requested",
        title: "Engine launch needs your approval",
        body: "Quality checks flagged issues. Review and approve to push it live.",
        link: "/dashboard/approvals",
      });
    }
    await triggerEvent(client, {
      type: EVENT_TYPES.ENGINE_QA_FAILED,
      businessId: run.business_id,
      payload: {
        runId: run.id,
        currentStep: run.current_step,
      },
    });
    return;
  }

  if (ownerUserId) {
    await notifications.create({
      userId: ownerUserId,
      businessId: run.business_id,
      kind: "engine_launched",
      title: "Your engine run is live",
      body: "Landing page is published and capturing leads.",
      link: "/dashboard/engine",
    });
  }

  await triggerEvent(client, {
    type: EVENT_TYPES.ENGINE_LAUNCHED,
    businessId: run.business_id,
    payload: {
      runId: run.id,
      slug: launchPayload.slug,
      publicUrl: launchPayload.publicUrl,
      utm: launchPayload.utm,
      pixels: launchPayload.pixels,
      qa: launchPayload.qa,
    },
  });
}
