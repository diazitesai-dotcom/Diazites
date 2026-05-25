import type { SupabaseClient } from "@supabase/supabase-js";

import type { AttributionModel, RevenueCloseMethod } from "@/types/revenue-attribution";
import type { BusinessProfile } from "@/types/platform-growth";

export type WebhookRevenueInput = {
  businessId: string;
  amount: number;
  externalId: string;
  sourceKey: string;
  closeMethod: RevenueCloseMethod;
  leadName?: string;
  campaign?: string;
  notes?: string;
  closedAt?: string;
  attributionType?: AttributionModel;
};

export async function recordRevenueFromWebhook(
  client: SupabaseClient,
  input: WebhookRevenueInput,
): Promise<{ created: boolean; id?: string; skipped?: string }> {
  if (input.amount <= 0) {
    return { created: false, skipped: "zero_amount" };
  }

  const { data: existing } = await client
    .from("revenue_entries")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("external_id", input.externalId)
    .maybeSingle();

  if (existing?.id) {
    return { created: false, id: String(existing.id), skipped: "duplicate" };
  }

  const { data: business } = await client
    .from("businesses")
    .select("profile")
    .eq("id", input.businessId)
    .maybeSingle();

  const profile = (business?.profile ?? {}) as BusinessProfile & {
    attributionModel?: AttributionModel;
  };
  const attributionType = input.attributionType ?? profile.attributionModel ?? "last_touch";

  const { data, error } = await client
    .from("revenue_entries")
    .insert({
      business_id: input.businessId,
      lead_name: input.leadName ?? null,
      source_key: input.sourceKey,
      campaign: input.campaign ?? null,
      amount: input.amount,
      close_method: input.closeMethod,
      closed_at: input.closedAt ?? new Date().toISOString(),
      attribution_type: attributionType,
      notes: input.notes ?? null,
      external_id: input.externalId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { created: false, skipped: "duplicate" };
    }
    throw new Error(error.message);
  }

  return { created: true, id: String(data.id) };
}

export async function findBusinessByShopifyDomain(
  client: SupabaseClient,
  shopDomain: string,
): Promise<{ businessId: string; webhookSecret?: string } | null> {
  const normalized = shopDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

  const { data: rows } = await client.from("businesses").select("id, profile");

  for (const row of rows ?? []) {
    const profile = (row.profile ?? {}) as BusinessProfile & {
      shopifyShopDomain?: string;
      shopifyWebhookSecret?: string;
    };
    const stored = (profile.shopifyShopDomain ?? "").toLowerCase().replace(/\/$/, "");
    if (stored && stored === normalized) {
      return {
        businessId: String(row.id),
        webhookSecret: profile.shopifyWebhookSecret,
      };
    }
  }

  return null;
}

export function stripeMetadataBusinessId(
  metadata: Record<string, string> | null | undefined,
): string | null {
  if (!metadata) return null;
  const id = metadata.business_id ?? metadata.businessId;
  if (!id || typeof id !== "string") return null;
  if (metadata.track_revenue === "false") return null;
  return id;
}

export function shouldTrackStripeRevenue(
  metadata: Record<string, string> | null | undefined,
  eventType?: string,
): boolean {
  if (!metadata) return false;
  const businessId = metadata.business_id ?? metadata.businessId;
  if (!businessId) return false;
  if (metadata.track_revenue === "false") return false;
  if (metadata.track_revenue === "true" || metadata.revenue_entry === "true") return true;
  if (
    eventType === "checkout.session.completed" ||
    eventType === "payment_intent.succeeded"
  ) {
    return true;
  }
  return false;
}
