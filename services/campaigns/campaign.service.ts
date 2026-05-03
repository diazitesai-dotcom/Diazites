import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createCampaignRepository } from "@/repositories/campaign.repository";
import type { CampaignCreateInput } from "@/types/backend";
import { EVENT_TYPES } from "@/types/backend";

import { triggerEvent } from "@/services/events/event-dispatcher";

export async function createCampaign(
  client: SupabaseClient,
  ownerUserId: string,
  input: CampaignCreateInput,
): Promise<ServiceResult<{ id: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(input.businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const campaigns = createCampaignRepository(client);
  const { data, error } = await campaigns.create(input);
  if (error || !data) return fail(error?.message ?? "Campaign create failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.CAMPAIGN_CREATED,
    businessId: input.businessId,
    payload: { campaignId: data.id, platform: input.platform },
  });

  return ok({ id: data.id });
}

export async function updateCampaign(
  client: SupabaseClient,
  ownerUserId: string,
  campaignId: string,
  patch: Partial<{
    budget: number;
    goal: string | null;
    location: string | null;
    status: string;
    spend: number;
    leads_count: number;
    cpl: number;
    conversion_rate: number;
  }>,
): Promise<ServiceResult<unknown>> {
  const campaigns = createCampaignRepository(client);
  const { data: campaign } = await campaigns.getById(campaignId);
  if (!campaign) return fail("Not found", "NOT_FOUND");

  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(campaign.business_id);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const { data, error } = await campaigns.update(campaignId, patch);
  if (error || !data) return fail(error?.message ?? "Update failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.CAMPAIGN_UPDATED,
    businessId: campaign.business_id,
    payload: { campaignId, patch },
  });

  return ok(data);
}

export async function getCampaignsByBusiness(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
): Promise<ServiceResult<unknown[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const campaigns = createCampaignRepository(client);
  const { data, error } = await campaigns.listByBusiness(businessId);
  if (error) return fail(error.message);
  return ok(data ?? []);
}

export async function calculateCampaignMetrics(
  client: SupabaseClient,
  businessId: string,
  campaignId: string,
): Promise<
  ServiceResult<{
    leadsCount: number;
    spend: number;
    cpl: number | null;
    conversionRate: number | null;
  }>
> {
  const campaigns = createCampaignRepository(client);

  const { data: campaign } = await campaigns.getById(campaignId);
  if (!campaign || campaign.business_id !== businessId) {
    return fail("Campaign not found", "NOT_FOUND");
  }

  const { data: leadRows } = await client
    .from("leads")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("campaign_id", campaignId);

  const list = leadRows ?? [];
  const leadsCount = list.length;
  const spend = Number(campaign.spend ?? 0);
  const cpl = leadsCount > 0 ? spend / leadsCount : null;
  const bookedOrWon = list.filter((l) => l.status === "booked" || l.status === "won").length;
  const conversionRate = leadsCount > 0 ? (bookedOrWon / leadsCount) * 100 : null;

  await campaigns.update(campaignId, {
    leads_count: leadsCount,
    spend,
    cpl: cpl ?? 0,
    conversion_rate: conversionRate ?? 0,
  });

  return ok({
    leadsCount,
    spend,
    cpl,
    conversionRate,
  });
}
