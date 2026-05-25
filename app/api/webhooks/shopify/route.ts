import { NextResponse } from "next/server";

import {
  handleShopifyOrderPaid,
  resolveShopifyWebhookSecret,
  verifyShopifyHmac,
} from "@/lib/revenue/shopify-webhook";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { findBusinessByShopifyDomain } from "@/services/revenue/revenue-webhook.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");
  const shopDomain = request.headers.get("x-shopify-shop-domain");

  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const match = await findBusinessByShopifyDomain(supabase, shopDomain);
  const secret = resolveShopifyWebhookSecret(match?.webhookSecret);

  if (!secret) {
    console.error("[shopify webhook] No webhook secret configured for shop", shopDomain);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifyShopifyHmac(rawBody, hmac, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (topic === "orders/paid") {
      const result = await handleShopifyOrderPaid(supabase, shopDomain, payload);
      return NextResponse.json({ received: true, ...result });
    }
    return NextResponse.json({ received: true, handled: false, reason: "ignored_topic" });
  } catch (e) {
    console.error("[shopify webhook] handler error", e);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }
}
