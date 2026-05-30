import type Stripe from "stripe";

import { env } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createMerchantRepository } from "@/repositories/merchant.repository";

import { recordMerchantPaymentEvent } from "@/services/merchant/merchant.service";

export async function handleMerchantConnectWebhook(event: Stripe.Event): Promise<void> {
  const client = createServiceRoleClient();
  const repo = createMerchantRepository(client);

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const businessId = account.metadata?.business_id;
      if (!businessId) return;

      const complete =
        account.charges_enabled === true &&
        account.payouts_enabled === true &&
        account.details_submitted === true;

      await repo.upsertMerchantAccount({
        businessId,
        processorAccountId: account.id,
        status: complete ? "active" : "onboarding",
        onboardingComplete: complete,
      });
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const businessId = pi.metadata?.business_id;
      if (!businessId) return;

      const amount = (pi.amount_received ?? pi.amount) / 100;
      await recordMerchantPaymentEvent(client, {
        businessId,
        kind: "payment_successful",
        amount,
        processor: "stripe",
        processorTransactionId: pi.id,
        contactId: pi.metadata?.contact_id,
        paymentMethodType: pi.payment_method_types?.[0],
        description: pi.description ?? undefined,
        metadata: { stripeEvent: event.type },
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const businessId = pi.metadata?.business_id;
      if (!businessId) return;
      await recordMerchantPaymentEvent(client, {
        businessId,
        kind: "payment_failed",
        amount: pi.amount / 100,
        processor: "stripe",
        processorTransactionId: pi.id,
        metadata: { stripeEvent: event.type },
      });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const businessId = invoice.metadata?.business_id;
      if (!businessId) return;
      await recordMerchantPaymentEvent(client, {
        businessId,
        kind: "invoice_paid",
        amount: (invoice.amount_paid ?? 0) / 100,
        processor: "stripe",
        processorTransactionId: invoice.id,
        metadata: { invoiceId: invoice.id },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const businessId = invoice.metadata?.business_id;
      if (!businessId) return;
      await recordMerchantPaymentEvent(client, {
        businessId,
        kind: "invoice_overdue",
        amount: (invoice.amount_due ?? 0) / 100,
        processor: "stripe",
        metadata: { invoiceId: invoice.id },
      });
      break;
    }

    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const businessId = sub.metadata?.business_id;
      if (!businessId) return;
      const amount =
        sub.items.data[0]?.price?.unit_amount != null
          ? sub.items.data[0].price.unit_amount / 100
          : 0;
      await recordMerchantPaymentEvent(client, {
        businessId,
        kind: "subscription_created",
        amount,
        processor: "stripe",
        processorTransactionId: sub.id,
        metadata: { subscriptionId: sub.id },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const businessId = sub.metadata?.business_id;
      if (!businessId) return;
      await recordMerchantPaymentEvent(client, {
        businessId,
        kind: "subscription_canceled",
        amount: 0,
        processor: "stripe",
        processorTransactionId: sub.id,
      });
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const businessId = charge.metadata?.business_id;
      if (!businessId) return;
      await recordMerchantPaymentEvent(client, {
        businessId,
        kind: "refund_issued",
        amount: (charge.amount_refunded ?? 0) / 100,
        processor: "stripe",
        processorTransactionId: charge.payment_intent as string | undefined,
      });
      await repo.insertRefund({
        business_id: businessId,
        processor: "stripe",
        processor_refund_id: charge.id,
        amount: (charge.amount_refunded ?? 0) / 100,
        status: "succeeded",
      });
      break;
    }

    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const piId =
        typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
      let businessId: string | undefined;
      if (piId) {
        const { data: txRow } = await client
          .from("merchant_transactions")
          .select("business_id")
          .eq("processor_transaction_id", piId)
          .maybeSingle();
        businessId = txRow?.business_id;
      }
      if (!businessId) return;
      await recordMerchantPaymentEvent(client, {
        businessId,
        kind: "chargeback_opened",
        amount: dispute.amount / 100,
        processor: "stripe",
        processorTransactionId: dispute.payment_intent as string | undefined,
      });
      await client.from("merchant_disputes").insert({
        business_id: businessId,
        processor: "stripe",
        processor_dispute_id: dispute.id,
        amount: dispute.amount / 100,
        status: dispute.status,
        reason: dispute.reason ?? null,
      });
      break;
    }

    case "payout.paid": {
      const payout = event.data.object as Stripe.Payout;
      const accountId = event.account;
      if (!accountId) return;

      const { data: merchantAccount } = await client
        .from("merchant_accounts")
        .select("business_id, id")
        .eq("processor_account_id", accountId)
        .maybeSingle();
      if (!merchantAccount) return;

      await recordMerchantPaymentEvent(client, {
        businessId: merchantAccount.business_id,
        kind: "payout_sent",
        amount: payout.amount / 100,
        processor: "stripe",
        processorTransactionId: payout.id,
      });
      await repo.insertPayout({
        business_id: merchantAccount.business_id,
        merchant_account_id: merchantAccount.id,
        processor: "stripe",
        processor_payout_id: payout.id,
        amount: payout.amount / 100,
        status: payout.status,
        arrival_date: payout.arrival_date
          ? new Date(payout.arrival_date * 1000).toISOString()
          : null,
      });
      break;
    }

    default:
      break;
  }
}

export function merchantWebhookSecretConfigured(): boolean {
  return Boolean(env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim() || env.STRIPE_WEBHOOK_SECRET?.trim());
}
