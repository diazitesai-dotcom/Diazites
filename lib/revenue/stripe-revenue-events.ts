import type Stripe from "stripe";

import {
  recordRevenueFromWebhook,
  shouldTrackStripeRevenue,
  stripeMetadataBusinessId,
} from "@/services/revenue/revenue-webhook.service";
import type { SupabaseClient } from "@supabase/supabase-js";

function centsToDollars(cents: number) {
  return Math.round(cents) / 100;
}

export async function handleStripeRevenueEvent(
  supabase: SupabaseClient,
  event: Stripe.Event,
): Promise<{ handled: boolean; reason?: string }> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription") {
        return { handled: false, reason: "subscription_checkout" };
      }
      const meta = session.metadata ?? undefined;
      if (!shouldTrackStripeRevenue(meta, event.type)) {
        return { handled: false, reason: "no_revenue_metadata" };
      }
      const businessId = stripeMetadataBusinessId(meta);
      if (!businessId) return { handled: false, reason: "no_business" };
      const amount =
        session.amount_total != null ? centsToDollars(session.amount_total) : 0;
      if (amount <= 0) return { handled: false, reason: "zero_amount" };

      await recordRevenueFromWebhook(supabase, {
        businessId,
        amount,
        externalId: `stripe:session:${session.id}`,
        sourceKey: "stripe",
        closeMethod: "stripe",
        leadName: session.customer_details?.name ?? session.customer_email ?? undefined,
        campaign: meta?.campaign ?? meta?.utm_campaign ?? undefined,
        notes: `Stripe Checkout ${session.id}`,
        closedAt: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
      });
      return { handled: true };
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const meta = pi.metadata ?? undefined;
      if (!shouldTrackStripeRevenue(meta, event.type)) {
        return { handled: false, reason: "no_revenue_metadata" };
      }
      const businessId = stripeMetadataBusinessId(meta);
      if (!businessId) return { handled: false, reason: "no_business" };
      const amount = centsToDollars(pi.amount_received ?? pi.amount ?? 0);
      if (amount <= 0) return { handled: false, reason: "zero_amount" };

      await recordRevenueFromWebhook(supabase, {
        businessId,
        amount,
        externalId: `stripe:pi:${pi.id}`,
        sourceKey: "stripe",
        closeMethod: "stripe",
        leadName: meta?.lead_name ?? undefined,
        campaign: meta?.campaign ?? undefined,
        notes: `Stripe payment ${pi.id}`,
      });
      return { handled: true };
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const meta = invoice.metadata ?? undefined;
      if (!shouldTrackStripeRevenue(meta, event.type)) {
        return { handled: false, reason: "no_revenue_metadata" };
      }
      const businessId = stripeMetadataBusinessId(meta);
      if (!businessId) return { handled: false, reason: "no_business" };
      const amount = centsToDollars(invoice.amount_paid ?? 0);
      if (amount <= 0) return { handled: false, reason: "zero_amount" };

      await recordRevenueFromWebhook(supabase, {
        businessId,
        amount,
        externalId: `stripe:invoice:${invoice.id}`,
        sourceKey: "stripe",
        closeMethod: "stripe",
        leadName: invoice.customer_name ?? undefined,
        notes: `Stripe invoice ${invoice.number ?? invoice.id}`,
      });
      return { handled: true };
    }

    default:
      return { handled: false, reason: "unsupported_type" };
  }
}
