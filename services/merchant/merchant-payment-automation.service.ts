import type { SupabaseClient } from "@supabase/supabase-js";

import { EVENT_TYPES } from "@/types/backend";
import type { MerchantPaymentEventKind } from "@/types/merchant-services";

import { triggerEvent } from "@/services/events/event-dispatcher";
import { logAgentActivity } from "@/services/platform/agent-activity.service";

function eventTypeFor(kind: MerchantPaymentEventKind): (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES] {
  switch (kind) {
    case "payment_successful":
    case "invoice_paid":
    case "subscription_renewed":
    case "deposit_paid":
    case "installment_paid":
      return EVENT_TYPES.PAYMENT_SUCCEEDED;
    case "payment_failed":
    case "invoice_overdue":
    case "chargeback_opened":
      return EVENT_TYPES.PAYMENT_FAILED;
    case "subscription_created":
    case "subscription_canceled":
      return EVENT_TYPES.SUBSCRIPTION_STARTED;
    case "refund_issued":
      return EVENT_TYPES.PAYMENT_FAILED;
    default:
      return EVENT_TYPES.PAYMENT_SUCCEEDED;
  }
}

function agentKeyFor(kind: MerchantPaymentEventKind): string {
  if (kind === "payment_failed" || kind === "invoice_overdue") return "collections";
  if (kind.startsWith("subscription")) return "renewal";
  if (kind === "refund_issued" || kind === "chargeback_opened") return "payment_support";
  if (kind === "payment_successful" || kind === "invoice_paid") return "upsell";
  return "billing";
}

export async function handleMerchantPaymentAutomation(
  client: SupabaseClient,
  businessId: string,
  kind: MerchantPaymentEventKind,
  context: {
    amount: number;
    processor: string;
    processorTransactionId?: string;
    contactId?: string;
  },
): Promise<void> {
  await triggerEvent(client, {
    type: eventTypeFor(kind),
    businessId,
    leadId: undefined,
    payload: {
      merchantEvent: kind,
      amount: context.amount,
      processor: context.processor,
      processorTransactionId: context.processorTransactionId,
      contactId: context.contactId,
    },
  });

  await logAgentActivity(client, {
    businessId,
    agentKey: agentKeyFor(kind),
    actionType: kind,
    entityType: "merchant_transaction",
    entityId: context.processorTransactionId,
    payload: {
      amount: context.amount,
      processor: context.processor,
      message: merchantEventMessage(kind, context.amount),
    },
  });

  if (
    kind === "payment_successful" ||
    kind === "invoice_paid" ||
    kind === "deposit_paid" ||
    kind === "installment_paid"
  ) {
    await upsertPaidCustomerTag(client, businessId, context.contactId);
    await movePipelineToPaid(client, businessId, context.contactId);
    await createOnboardingTask(client, businessId, context.amount);
  }

  if (kind === "payment_failed" || kind === "invoice_overdue") {
    await ensureFailedPaymentTag(client, businessId);
  }
}

function merchantEventMessage(kind: MerchantPaymentEventKind, amount: number): string {
  switch (kind) {
    case "payment_successful":
      return `Payment of $${amount.toFixed(2)} received — CRM, pipeline, and workflows updated.`;
    case "payment_failed":
      return `Payment failed ($${amount.toFixed(2)}) — collections agent queued follow-up.`;
    case "invoice_paid":
      return `Invoice paid ($${amount.toFixed(2)}) — automations triggered.`;
    case "invoice_overdue":
      return `Invoice overdue — reminder sequence started.`;
    case "subscription_created":
      return "Subscription created — renewal agent monitoring.";
    case "subscription_renewed":
      return `Subscription renewed ($${amount.toFixed(2)}).`;
    case "subscription_canceled":
      return "Subscription canceled — retention workflow eligible.";
    case "refund_issued":
      return `Refund issued ($${amount.toFixed(2)}).`;
    case "chargeback_opened":
      return `Chargeback opened ($${amount.toFixed(2)}) — team notified.`;
    case "payout_sent":
      return `Payout sent ($${amount.toFixed(2)}).`;
    default:
      return `Merchant event: ${kind}`;
  }
}

async function upsertPaidCustomerTag(
  client: SupabaseClient,
  businessId: string,
  contactId?: string,
): Promise<void> {
  const { data: tag } = await client
    .from("tags")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", "Paid Customer")
    .maybeSingle();

  let tagId = tag?.id;
  if (!tagId) {
    const { data: created } = await client
      .from("tags")
      .insert({ business_id: businessId, name: "Paid Customer" })
      .select("id")
      .single();
    tagId = created?.id;
  }

  if (contactId && tagId) {
    await client.from("contact_tags").upsert(
      { contact_id: contactId, tag_id: tagId },
      { onConflict: "contact_id,tag_id", ignoreDuplicates: true },
    );
  }
}

async function movePipelineToPaid(
  client: SupabaseClient,
  businessId: string,
  contactId?: string,
): Promise<void> {
  if (!contactId) return;

  const { data: stage } = await client
    .from("pipeline_stages")
    .select("id, pipeline_id")
    .eq("business_id", businessId)
    .ilike("name", "%paid%")
    .limit(1)
    .maybeSingle();

  if (!stage) return;

  await client
    .from("contacts")
    .update({
      pipeline_id: stage.pipeline_id,
      pipeline_stage_id: stage.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId);
}

async function createOnboardingTask(
  client: SupabaseClient,
  businessId: string,
  amount: number,
): Promise<void> {
  const { data: board } = await client
    .from("project_boards")
    .select("id")
    .eq("business_id", businessId)
    .limit(1)
    .maybeSingle();

  if (!board) return;

  await client.from("project_tasks").insert({
    business_id: businessId,
    board_id: board.id,
    title: "New paid customer onboarding",
    description: `Merchant payment received ($${amount.toFixed(2)}). Complete onboarding checklist.`,
    status: "todo",
    priority: "high",
  });
}

async function ensureFailedPaymentTag(client: SupabaseClient, businessId: string): Promise<void> {
  const { data: tag } = await client
    .from("tags")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", "Failed Payment")
    .maybeSingle();
  if (!tag) {
    await client.from("tags").insert({ business_id: businessId, name: "Failed Payment" });
  }
}
