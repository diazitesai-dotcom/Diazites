import type { PaymentProcessor } from "@/types/merchant-services";

export type ProcessorCustomerInput = {
  businessId: string;
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
};

export type ProcessorPaymentLinkInput = {
  businessId: string;
  name: string;
  amount?: number;
  currency?: string;
  connectedAccountId?: string;
  metadata?: Record<string, string>;
};

export type ProcessorInvoiceInput = {
  businessId: string;
  customerId: string;
  amount: number;
  currency?: string;
  description?: string;
  dueDate?: Date;
  connectedAccountId?: string;
  metadata?: Record<string, string>;
};

export type ProcessorCheckoutInput = {
  businessId: string;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  connectedAccountId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export type ProcessorSubscriptionInput = {
  businessId: string;
  customerId: string;
  priceAmount: number;
  currency?: string;
  interval?: "month" | "year";
  connectedAccountId?: string;
  metadata?: Record<string, string>;
};

export type ProcessorRefundInput = {
  transactionId: string;
  amount?: number;
  reason?: string;
  connectedAccountId?: string;
};

export type ProcessorConnectAccountInput = {
  businessId: string;
  email: string;
  businessName: string;
  country?: string;
  metadata?: Record<string, string>;
};

export type ProcessorOnboardingLinkInput = {
  connectedAccountId: string;
  refreshUrl: string;
  returnUrl: string;
};

export type ProcessorWebhookContext = {
  rawBody: string;
  signature: string;
  secret: string;
};

export interface PaymentProcessorInterface {
  readonly processorId: PaymentProcessor;

  createConnectAccount(input: ProcessorConnectAccountInput): Promise<{ accountId: string }>;
  createOnboardingLink(input: ProcessorOnboardingLinkInput): Promise<{ url: string }>;
  createCustomer(input: ProcessorCustomerInput): Promise<{ customerId: string }>;
  createPaymentLink(input: ProcessorPaymentLinkInput): Promise<{ linkId: string; url: string }>;
  createInvoice(input: ProcessorInvoiceInput): Promise<{ invoiceId: string; hostedUrl?: string }>;
  createCheckoutSession(input: ProcessorCheckoutInput): Promise<{ sessionId: string; url: string }>;
  createSubscription(input: ProcessorSubscriptionInput): Promise<{ subscriptionId: string }>;
  refundPayment(input: ProcessorRefundInput): Promise<{ refundId: string }>;
  verifyWebhook(ctx: ProcessorWebhookContext): Promise<{ type: string; data: unknown }>;
  getTransaction(transactionId: string, connectedAccountId?: string): Promise<Record<string, unknown> | null>;
  getPayout(payoutId: string, connectedAccountId?: string): Promise<Record<string, unknown> | null>;
  getDispute(disputeId: string, connectedAccountId?: string): Promise<Record<string, unknown> | null>;
  updatePaymentMethod?(
    customerId: string,
    paymentMethodId: string,
    connectedAccountId?: string,
  ): Promise<void>;
}
