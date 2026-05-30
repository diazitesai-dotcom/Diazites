import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { EVENT_TYPES } from "@/types/backend";

import { triggerEvent } from "@/services/events/event-dispatcher";
import { logAgentActivity } from "@/services/platform/agent-activity.service";

type PaymentEventKind =
  | "payment_successful"
  | "payment_failed"
  | "subscription_started"
  | "subscription_canceled"
  | "invoice_paid"
  | "invoice_overdue"
  | "refund_issued";

function eventTypeFor(kind: PaymentEventKind): (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES] {
  switch (kind) {
    case "payment_successful":
    case "invoice_paid":
    case "subscription_started":
      return EVENT_TYPES.PAYMENT_SUCCEEDED;
    case "payment_failed":
    case "invoice_overdue":
      return EVENT_TYPES.PAYMENT_FAILED;
    case "subscription_canceled":
      return EVENT_TYPES.SUBSCRIPTION_CANCELED;
    case "refund_issued":
      return EVENT_TYPES.PAYMENT_FAILED;
    default:
      return EVENT_TYPES.PAYMENT_SUCCEEDED;
  }
}

export async function handleStripePaymentAutomation(
  client: SupabaseClient,
  businessId: string,
  kind: PaymentEventKind,
  stripeObject: Stripe.Checkout.Session | Stripe.Invoice | Stripe.Subscription,
): Promise<void> {
  const amount =
    "amount_total" in stripeObject && stripeObject.amount_total != null
      ? stripeObject.amount_total / 100
      : "amount_paid" in stripeObject && stripeObject.amount_paid != null
        ? stripeObject.amount_paid / 100
        : 0;

  await triggerEvent(client, {
    type: eventTypeFor(kind),
    businessId,
    payload: { kind, amount, stripeId: stripeObject.id },
  });

  await logAgentActivity(client, {
    businessId,
    agentKey: "billing",
    actionType: kind,
    entityType: "stripe",
    entityId: undefined,
    payload: {
      amount,
      message:
        kind === "payment_successful" || kind === "invoice_paid"
          ? "Payment collected — CRM and onboarding automations queued."
          : `Payment event: ${kind}`,
    },
  });

  if (kind === "payment_successful" || kind === "invoice_paid" || kind === "subscription_started") {
    const { data: hotTag } = await client
      .from("tags")
      .select("id")
      .eq("business_id", businessId)
      .eq("name", "Paid Customer")
      .maybeSingle();

    if (!hotTag) {
      await client.from("tags").insert({ business_id: businessId, name: "Paid Customer" });
    }

    const { data: board } = await client
      .from("project_boards")
      .select("id")
      .eq("business_id", businessId)
      .limit(1)
      .maybeSingle();

    if (board) {
      await client.from("project_tasks").insert({
        business_id: businessId,
        board_id: board.id,
        title: "New customer onboarding",
        description: `Payment received ($${amount}). Complete onboarding checklist.`,
        status: "todo",
        priority: "high",
      });
    }
  }
}
