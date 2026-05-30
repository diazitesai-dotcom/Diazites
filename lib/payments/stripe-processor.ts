import type Stripe from "stripe";

import { requireStripe } from "@/lib/stripe";
import type {
  PaymentProcessorInterface,
  ProcessorCheckoutInput,
  ProcessorConnectAccountInput,
  ProcessorCustomerInput,
  ProcessorInvoiceInput,
  ProcessorOnboardingLinkInput,
  ProcessorPaymentLinkInput,
  ProcessorRefundInput,
  ProcessorSubscriptionInput,
  ProcessorWebhookContext,
} from "@/lib/payments/processor-interface";

export class StripeProcessor implements PaymentProcessorInterface {
  readonly processorId = "stripe" as const;

  private stripe(): Stripe {
    return requireStripe();
  }

  async createConnectAccount(input: ProcessorConnectAccountInput): Promise<{ accountId: string }> {
    const account = await this.stripe().accounts.create({
      type: "express",
      email: input.email,
      business_profile: { name: input.businessName },
      country: input.country ?? "US",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        business_id: input.businessId,
        ...input.metadata,
      },
    });
    return { accountId: account.id };
  }

  async createOnboardingLink(input: ProcessorOnboardingLinkInput): Promise<{ url: string }> {
    const link = await this.stripe().accountLinks.create({
      account: input.connectedAccountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: "account_onboarding",
    });
    return { url: link.url };
  }

  async createCustomer(input: ProcessorCustomerInput): Promise<{ customerId: string }> {
    const customer = await this.stripe().customers.create({
      email: input.email,
      name: input.name,
      metadata: {
        business_id: input.businessId,
        ...input.metadata,
      },
    });
    return { customerId: customer.id };
  }

  async createPaymentLink(input: ProcessorPaymentLinkInput): Promise<{ linkId: string; url: string }> {
    const stripe = this.stripe();
    const lineItems = input.amount
      ? [
          {
            price_data: {
              currency: input.currency ?? "usd",
              product_data: { name: input.name },
              unit_amount: Math.round(input.amount * 100),
            },
            quantity: 1,
          },
        ]
      : undefined;

    const params: Stripe.PaymentLinkCreateParams = {
      line_items: lineItems ?? [
        {
          price_data: {
            currency: input.currency ?? "usd",
            product_data: { name: input.name },
            unit_amount: 0,
          },
          quantity: 1,
        },
      ],
      metadata: {
        business_id: input.businessId,
        ...input.metadata,
      },
    };

    if (input.connectedAccountId) {
      params.on_behalf_of = input.connectedAccountId;
      params.transfer_data = { destination: input.connectedAccountId };
    }

    const link = await stripe.paymentLinks.create(params);
    return { linkId: link.id, url: link.url ?? "" };
  }

  async createInvoice(input: ProcessorInvoiceInput): Promise<{ invoiceId: string; hostedUrl?: string }> {
    const stripe = this.stripe();
    const invoiceParams: Stripe.InvoiceCreateParams = {
      customer: input.customerId,
      collection_method: "send_invoice",
      days_until_due: input.dueDate
        ? Math.max(1, Math.ceil((input.dueDate.getTime() - Date.now()) / 86400000))
        : 30,
      metadata: {
        business_id: input.businessId,
        ...input.metadata,
      },
    };

    if (input.connectedAccountId) {
      invoiceParams.on_behalf_of = input.connectedAccountId;
      invoiceParams.transfer_data = { destination: input.connectedAccountId };
    }

    const invoice = await stripe.invoices.create(invoiceParams);
    await stripe.invoiceItems.create({
      customer: input.customerId,
      invoice: invoice.id,
      amount: Math.round(input.amount * 100),
      currency: input.currency ?? "usd",
      description: input.description ?? "Invoice",
    });
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    return { invoiceId: finalized.id, hostedUrl: finalized.hosted_invoice_url ?? undefined };
  }

  async createCheckoutSession(input: ProcessorCheckoutInput): Promise<{ sessionId: string; url: string }> {
    const stripe = this.stripe();
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: input.currency ?? "usd",
            product_data: { name: "Payment" },
            unit_amount: Math.round(input.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        business_id: input.businessId,
        ...input.metadata,
      },
    };

    if (input.connectedAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: { destination: input.connectedAccountId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) throw new Error("Stripe checkout session missing URL");
    return { sessionId: session.id, url: session.url };
  }

  async createSubscription(input: ProcessorSubscriptionInput): Promise<{ subscriptionId: string }> {
    const stripe = this.stripe();
    const product = await stripe.products.create({
      name: `Subscription — ${input.businessId}`,
      metadata: { business_id: input.businessId },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(input.priceAmount * 100),
      currency: input.currency ?? "usd",
      recurring: { interval: input.interval ?? "month" },
    });
    const subParams: Stripe.SubscriptionCreateParams = {
      customer: input.customerId,
      items: [{ price: price.id }],
      metadata: {
        business_id: input.businessId,
        ...input.metadata,
      },
    };
    if (input.connectedAccountId) {
      subParams.transfer_data = { destination: input.connectedAccountId };
    }
    const sub = await stripe.subscriptions.create(subParams);
    return { subscriptionId: sub.id };
  }

  async refundPayment(input: ProcessorRefundInput): Promise<{ refundId: string }> {
    const refund = await this.stripe().refunds.create({
      payment_intent: input.transactionId,
      amount: input.amount != null ? Math.round(input.amount * 100) : undefined,
      reason: input.reason as Stripe.RefundCreateParams.Reason | undefined,
    });
    return { refundId: refund.id };
  }

  async verifyWebhook(ctx: ProcessorWebhookContext): Promise<{ type: string; data: unknown }> {
    const event = this.stripe().webhooks.constructEvent(ctx.rawBody, ctx.signature, ctx.secret);
    return { type: event.type, data: event.data.object };
  }

  async getTransaction(
    transactionId: string,
    connectedAccountId?: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const pi = await this.stripe().paymentIntents.retrieve(
        transactionId,
        {},
        connectedAccountId ? { stripeAccount: connectedAccountId } : undefined,
      );
      return pi as unknown as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async getPayout(payoutId: string, connectedAccountId?: string): Promise<Record<string, unknown> | null> {
    try {
      const payout = await this.stripe().payouts.retrieve(
        payoutId,
        {},
        connectedAccountId ? { stripeAccount: connectedAccountId } : undefined,
      );
      return payout as unknown as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async getDispute(disputeId: string, connectedAccountId?: string): Promise<Record<string, unknown> | null> {
    try {
      const dispute = await this.stripe().disputes.retrieve(
        disputeId,
        {},
        connectedAccountId ? { stripeAccount: connectedAccountId } : undefined,
      );
      return dispute as unknown as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export const stripeProcessor = new StripeProcessor();
