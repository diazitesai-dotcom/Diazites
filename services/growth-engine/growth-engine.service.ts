import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createGrowthEngineRepository } from "@/repositories/marketing-os.repository";
import { EVENT_TYPES } from "@/types/backend";
import type { GrowthEngineStage } from "@/types/marketing-os";

import { triggerEvent } from "@/services/events/event-dispatcher";

const STAGES: GrowthEngineStage[] = [
  "input",
  "ai_research",
  "campaign_creative",
  "funnel_blueprint",
  "ai_generation_suite",
  "variant_generation",
  "ai_scoring",
  "launch_system",
];

export async function startGrowthEngineRun(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  inputUrl: string,
): Promise<ServiceResult<{ runId: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createGrowthEngineRepository(client);
  const { data, error } = await repo.create(businessId, inputUrl);
  if (error || !data) return fail(error?.message ?? "Failed to start run");

  await advanceGrowthEngineStage(client, businessId, data.id, "ai_research", {
    website_analysis: analyzeWebsite(inputUrl),
    outcome_estimates: estimateOutcomes(business),
    business_name: business.name,
    industry: detectIndustry(inputUrl, business),
  });

  return ok({ runId: data.id });
}

export async function advanceGrowthEngineStage(
  client: SupabaseClient,
  businessId: string,
  runId: string,
  stage: GrowthEngineStage,
  patch: Record<string, unknown> = {},
): Promise<ServiceResult<unknown>> {
  const repo = createGrowthEngineRepository(client);
  const stageIndex = STAGES.indexOf(stage);
  const progress = Math.round(((stageIndex + 1) / STAGES.length) * 100);

  const { data, error } = await repo.updateStage(runId, businessId, {
    current_stage: stage,
    stage_progress: progress,
    ...patch,
    status: stage === "launch_system" ? "completed" : "in_progress",
  });

  if (error || !data) return fail(error?.message ?? "Stage update failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.GROWTH_ENGINE_STAGE_CHANGED,
    businessId,
    payload: { runId, stage, progress },
  });

  return ok(data);
}

export async function listGrowthEngineRuns(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
): Promise<ServiceResult<unknown[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createGrowthEngineRepository(client);
  const { data, error } = await repo.listRecent(businessId);
  if (error) return fail(error.message);
  return ok(data ?? []);
}

function analyzeWebsite(url: string) {
  const domain = url.replace(/^https?:\/\//, "").split("/")[0] ?? url;
  return {
    industryDetected: detectIndustryFromUrl(url),
    websiteScore: 72,
    ctaReview: "Primary CTA visible above fold — consider stronger urgency language.",
    trackingReview: "Ensure Meta Pixel and Google conversion tags are installed.",
    offerRecommendation: "Lead with a free inspection or estimate with 24h response guarantee.",
    campaignAngle: `Local ${domain} service authority + fast response`,
  };
}

function estimateOutcomes(business: { monthly_budget?: number | null }) {
  const budget = Number(business.monthly_budget ?? 1500);
  const estimatedReach = Math.round(budget * 45);
  const estimatedClicks = Math.round(estimatedReach * 0.035);
  const estimatedLeads = Math.round(estimatedClicks * 0.12);
  const estimatedCpl = estimatedLeads > 0 ? Math.round(budget / estimatedLeads) : 0;

  return {
    budget,
    estimatedReach,
    estimatedClicks,
    estimatedLeads,
    estimatedCpl,
  };
}

function detectIndustry(url: string, business: { services?: string | null; name?: string }) {
  if (business.services?.toLowerCase().includes("roof")) return "Roofing";
  return detectIndustryFromUrl(url);
}

function detectIndustryFromUrl(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes("roof")) return "Roofing";
  if (lower.includes("hvac")) return "HVAC";
  if (lower.includes("plumb")) return "Plumbing";
  return "Home Services";
}
