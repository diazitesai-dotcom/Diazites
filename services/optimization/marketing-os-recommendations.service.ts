import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createOptimizationRepository } from "@/repositories/marketing-os.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { EVENT_TYPES } from "@/types/backend";
import type { OptimizationType, RecommendationStatus } from "@/types/marketing-os";

import { requestApprovalIfNeeded } from "@/services/approvals/approval.service";
import { writeAuditLog } from "@/services/audit/audit.service";
import { triggerEvent } from "@/services/events/event-dispatcher";

export async function createOptimizationRecommendation(
  client: SupabaseClient,
  businessId: string,
  input: {
    campaignId?: string | null;
    landingPageId?: string | null;
    recommendationType: OptimizationType;
    title: string;
    confidenceScore: number;
    riskScore: number;
    expectedImpact?: string;
    explanation?: Record<string, unknown>;
    suggestedAction?: Record<string, unknown>;
  },
): Promise<ServiceResult<{ id: string; needsApproval: boolean }>> {
  const repo = createOptimizationRepository(client);
  const { data, error } = await repo.create({
    businessId,
    ...input,
  });

  if (error || !data) return fail(error?.message ?? "Failed to create recommendation");

  const approval = await requestApprovalIfNeeded(client, {
    businessId,
    approvalType: "optimization_action",
    title: input.title,
    riskScore: input.riskScore,
    confidenceScore: input.confidenceScore,
    expectedImpact: input.expectedImpact,
    explanation: input.explanation,
    payload: { recommendationId: data.id, suggestedAction: input.suggestedAction },
    entityType: "optimization_recommendation",
    entityId: data.id,
  });

  await triggerEvent(client, {
    type: EVENT_TYPES.OPTIMIZATION_RECOMMENDED,
    businessId,
    payload: { recommendationId: data.id, type: input.recommendationType },
  });

  return ok({
    id: data.id,
    needsApproval: approval.success && !approval.data.autoApproved,
  });
}

export async function listOptimizationRecommendations(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  status?: RecommendationStatus,
): Promise<ServiceResult<unknown[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createOptimizationRepository(client);
  const { data, error } = await repo.listByBusiness(businessId, status);
  if (error) return fail(error.message);
  return ok(data ?? []);
}

export async function decideRecommendation(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  recommendationId: string,
  decision: "approved" | "rejected" | "applied",
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createOptimizationRepository(client);
  const { data, error } = await repo.updateStatus(recommendationId, businessId, decision);
  if (error || !data) return fail(error?.message ?? "Update failed");

  await writeAuditLog(client, {
    businessId,
    actorUserId: ownerUserId,
    action: `optimization.${decision}`,
    entityType: "optimization_recommendation",
    entityId: recommendationId,
  });

  if (decision === "applied") {
    await triggerEvent(client, {
      type: EVENT_TYPES.OPTIMIZATION_APPLIED,
      businessId,
      payload: { recommendationId },
    });
  }

  return ok(data);
}

export async function computeCampaignHealthScore(
  client: SupabaseClient,
  businessId: string,
): Promise<ServiceResult<{ score: number; factors: Record<string, number> }>> {
  const { data: campaigns } = await client
    .from("campaigns")
    .select("cpl, roas, conversion_rate, status, lifecycle_status")
    .eq("business_id", businessId);

  const rows = campaigns ?? [];
  if (rows.length === 0) {
    return ok({ score: 50, factors: { coverage: 0 } });
  }

  const avgCpl =
    rows.reduce((sum, c) => sum + Number(c.cpl ?? 0), 0) / Math.max(rows.length, 1);
  const avgRoas =
    rows.reduce((sum, c) => sum + Number(c.roas ?? 0), 0) / Math.max(rows.length, 1);
  const liveCount = rows.filter(
    (c) => c.lifecycle_status === "live" || c.status === "live",
  ).length;

  const cplScore = avgCpl > 0 ? Math.min(100, Math.max(20, 120 - avgCpl)) : 60;
  const roasScore = avgRoas > 0 ? Math.min(100, avgRoas * 20) : 50;
  const liveScore = (liveCount / rows.length) * 100;
  const score = Math.round((cplScore + roasScore + liveScore) / 3);

  return ok({
    score,
    factors: { cplScore, roasScore, liveScore },
  });
}

export async function ensureDemoRecommendations(
  client: SupabaseClient,
  businessId: string,
): Promise<void> {
  const repo = createOptimizationRepository(client);
  const { data } = await repo.listByBusiness(businessId);
  if ((data ?? []).length > 0) return;

  const demos = [
    {
      recommendationType: "budget_shift" as OptimizationType,
      title: "Shift 15% budget to top-performing Meta campaign",
      confidenceScore: 82,
      riskScore: 35,
      expectedImpact: "+12% leads at same CPL",
    },
    {
      recommendationType: "creative_fatigue" as OptimizationType,
      title: "Creative fatigue detected on Search campaign",
      confidenceScore: 76,
      riskScore: 25,
      expectedImpact: "Refresh creatives to recover CTR",
    },
    {
      recommendationType: "cpl_spike" as OptimizationType,
      title: "CPL spike on weekend traffic",
      confidenceScore: 88,
      riskScore: 55,
      expectedImpact: "Reduce weekend bids by 10%",
    },
  ];

  for (const demo of demos) {
    await createOptimizationRecommendation(client, businessId, {
      ...demo,
      explanation: { reason: "AI detected pattern in recent performance data" },
      suggestedAction: { action: demo.recommendationType },
    });
  }
}
