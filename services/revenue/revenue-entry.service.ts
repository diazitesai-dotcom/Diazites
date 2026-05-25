"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { AttributionModel, RevenueCloseMethod } from "@/types/revenue-attribution";

export type CreateRevenueEntryInput = {
  businessId: string;
  leadName?: string;
  leadId?: string;
  sourceKey: string;
  campaign?: string;
  amount: number;
  closeMethod: RevenueCloseMethod;
  closedAt?: string;
  attributionType: AttributionModel;
  notes?: string;
  agentKey?: string;
};

export async function createRevenueEntry(
  client: SupabaseClient,
  ownerUserId: string,
  input: CreateRevenueEntryInput,
): Promise<ServiceResult<{ id: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(input.businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const { data, error } = await client
    .from("revenue_entries")
    .insert({
      business_id: input.businessId,
      lead_id: input.leadId ?? null,
      lead_name: input.leadName ?? null,
      source_key: input.sourceKey,
      campaign: input.campaign ?? null,
      amount: input.amount,
      close_method: input.closeMethod,
      closed_at: input.closedAt ?? new Date().toISOString(),
      attribution_type: input.attributionType,
      notes: input.notes ?? null,
      agent_key: input.agentKey ?? null,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  return ok({ id: String(data.id) });
}
