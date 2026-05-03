import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBillingRepository } from "@/repositories/billing.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createUsageRepository } from "@/repositories/usage.repository";
import type { BillingPlanName } from "@/types/backend";
import { EVENT_TYPES } from "@/types/backend";

import { triggerEvent } from "@/services/events/event-dispatcher";

const PLAN_AMOUNTS: Record<BillingPlanName, number> = {
  Starter: 497,
  Growth: 997,
  Domination: 1997,
};

export async function getUserPlan(client: SupabaseClient, userId: string) {
  const businesses = createBusinessRepository(client);
  const billing = createBillingRepository(client);

  const { data: business } = await businesses.getByOwnerUserId(userId);
  if (!business) return ok(null);

  const { data: row } = await billing.getByBusinessId(business.id);
  return ok(row);
}

export async function updatePlan(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  planName: BillingPlanName,
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.owner_user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const billing = createBillingRepository(client);
  const amount = PLAN_AMOUNTS[planName];
  const { data, error } = await billing.upsertPlan({
    businessId,
    planName,
    amount,
    paymentStatus: "active",
  });

  if (error || !data) return fail(error?.message ?? "Billing update failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.BILLING_PLAN_CHANGED,
    businessId,
    payload: { planName, amount },
  });

  return ok(data);
}

export async function trackUsage(
  client: SupabaseClient,
  businessId: string,
  ownerUserId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<ServiceResult<{ recorded: boolean }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.owner_user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const usage = createUsageRepository(client);
  const { count: leadCount } = await client
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString());

  const { count: aiCount } = await client
    .from("ai_messages")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("sent_at", periodStart.toISOString())
    .lte("sent_at", periodEnd.toISOString());

  const { count: activeCampaigns } = await client
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "active");

  await usage.upsertPeriod({
    businessId,
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    leadsCount: leadCount ?? 0,
    aiMessagesCount: aiCount ?? 0,
    campaignsActive: activeCampaigns ?? 0,
    meta: {},
  });

  return ok({ recorded: true });
}
