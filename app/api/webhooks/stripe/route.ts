import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { handleStripeRevenueEvent } from "@/lib/revenue/stripe-revenue-events";
import { requireStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  markSubscriptionCanceled,
  syncSubscriptionToBilling,
} from "@/services/stripe/stripe-subscription-sync.service";
import { handleStripePaymentAutomation } from "@/services/stripe/payment-automation.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
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
    console.error("[stripe webhook] verify failed", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          const subId = session.subscription;
          if (typeof subId === "string") {
            const subscription = await stripe.subscriptions.retrieve(subId);
            await syncSubscriptionToBilling(supabase, subscription, session.metadata);
            const businessId = session.metadata?.business_id as string | undefined;
            if (businessId) {
              await handleStripePaymentAutomation(
                supabase,
                businessId,
                "subscription_started",
                subscription,
              );
            }
          }
        } else {
          await handleStripeRevenueEvent(supabase, event);
        }
        break;
      }
      case "payment_intent.succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as import("stripe").Stripe.Invoice;
        await handleStripeRevenueEvent(supabase, event);
        const businessId = invoice.metadata?.business_id as string | undefined;
        if (businessId) {
          await handleStripePaymentAutomation(supabase, businessId, "invoice_paid", invoice);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as import("stripe").Stripe.Subscription;
        await syncSubscriptionToBilling(supabase, subscription, subscription.metadata);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as import("stripe").Stripe.Subscription;
        await markSubscriptionCanceled(supabase, subscription);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe webhook] handler error", e);
    return NextResponse.json({ received: true, error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
