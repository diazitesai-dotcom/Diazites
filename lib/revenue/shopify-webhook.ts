import { createHmac, timingSafeEqual } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import {
  findBusinessByShopifyDomain,
  recordRevenueFromWebhook,
} from "@/services/revenue/revenue-webhook.service";

export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(hmacHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return digest === hmacHeader;
  }
}

type ShopifyOrderPayload = {
  id?: number;
  name?: string;
  total_price?: string;
  currency?: string;
  customer?: { first_name?: string; last_name?: string; email?: string };
  created_at?: string;
  source_name?: string;
};

export async function handleShopifyOrderPaid(
  supabase: SupabaseClient,
  shopDomain: string,
  payload: ShopifyOrderPayload,
): Promise<{ handled: boolean; reason?: string }> {
  const match = await findBusinessByShopifyDomain(supabase, shopDomain);
  if (!match) return { handled: false, reason: "unknown_shop" };

  const amount = Number(payload.total_price ?? 0);
  if (!amount || amount <= 0) return { handled: false, reason: "zero_amount" };

  const customerName = payload.customer
    ? [payload.customer.first_name, payload.customer.last_name].filter(Boolean).join(" ")
    : undefined;

  await recordRevenueFromWebhook(supabase, {
    businessId: match.businessId,
    amount,
    externalId: `shopify:order:${payload.id}`,
    sourceKey: "shopify",
    closeMethod: "shopify",
    leadName: customerName || payload.customer?.email,
    campaign: payload.source_name ?? undefined,
    notes: `Shopify order ${payload.name ?? payload.id}`,
    closedAt: payload.created_at ?? new Date().toISOString(),
  });

  return { handled: true };
}

export function resolveShopifyWebhookSecret(
  businessSecret: string | undefined,
): string | null {
  const global = env.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (businessSecret?.trim()) return businessSecret.trim();
  if (global) return global;
  return null;
}
