import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { requireStripe } from "@/lib/stripe";
import { handleMerchantConnectWebhook } from "@/services/merchant/merchant-webhook.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret =
    env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim() || env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let stripe: ReturnType<typeof requireStripe>;
  try {
    stripe = requireStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe connect webhook] verify failed", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleMerchantConnectWebhook(event);
  } catch (e) {
    console.error("[stripe connect webhook] handler error", e);
    return NextResponse.json({ received: true, error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
