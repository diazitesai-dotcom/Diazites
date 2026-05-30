export type PaymentProcessor =
  | "stripe"
  | "square"
  | "paypal"
  | "authorize_net"
  | "clover"
  | "external";

export type MerchantAccountStatus =
  | "pending"
  | "pending_approval"
  | "onboarding"
  | "active"
  | "suspended"
  | "deactivated"
  | "rejected";

export type MerchantConnectionType = "stripe_connect" | "external_api" | "manual";

export type MerchantTransactionStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "disputed";

export type MerchantPaymentEventKind =
  | "payment_successful"
  | "payment_failed"
  | "invoice_created"
  | "invoice_paid"
  | "invoice_overdue"
  | "subscription_created"
  | "subscription_renewed"
  | "subscription_canceled"
  | "refund_issued"
  | "chargeback_opened"
  | "payout_sent"
  | "payment_method_updated"
  | "deposit_paid"
  | "installment_paid";

export type AgencyRow = {
  id: string;
  business_id: string;
  name: string;
  merchant_services_enabled: boolean;
  allowed_processors: PaymentProcessor[];
  stripe_required: boolean;
  external_processors_allowed: boolean;
  platform_fees_enabled: boolean;
  merchant_included_in_plan: boolean;
  merchant_addon_price: number;
  created_at: string;
  updated_at: string;
};

export type AgencyManagedBusinessRow = {
  id: string;
  agency_id: string;
  business_id: string;
  label: string | null;
  merchant_services_enabled: boolean;
  created_at: string;
};

export type MerchantAccountRow = {
  id: string;
  business_id: string;
  agency_id: string | null;
  processor: PaymentProcessor;
  connection_type: MerchantConnectionType;
  status: MerchantAccountStatus;
  processor_account_id: string | null;
  processor_customer_id: string | null;
  onboarding_complete: boolean;
  capabilities: Record<string, boolean>;
  permissions: Record<string, boolean>;
  metadata: Record<string, unknown>;
  activated_at: string | null;
  deactivated_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MerchantFeeConfigRow = {
  id: string;
  business_id: string | null;
  agency_id: string | null;
  is_global_default: boolean;
  platform_fee_percent: number;
  platform_fee_flat: number;
  agency_revenue_share_percent: number;
  sub_account_markup_percent: number;
  processor_fee_tracking: boolean;
  payout_delay_days: number;
  created_at: string;
  updated_at: string;
};

export type MerchantActivationRequestRow = {
  id: string;
  business_id: string;
  agency_id: string | null;
  requested_by: string | null;
  processor: PaymentProcessor;
  connection_type: MerchantConnectionType;
  status: "pending" | "approved" | "denied" | "cancelled";
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type MerchantTransactionRow = {
  id: string;
  business_id: string;
  merchant_account_id: string | null;
  contact_id: string | null;
  customer_profile_id: string | null;
  processor: PaymentProcessor;
  processor_transaction_id: string | null;
  transaction_type: string;
  status: MerchantTransactionStatus;
  amount: number;
  currency: string;
  platform_fee: number;
  agency_share: number;
  processor_fee: number;
  net_amount: number;
  payment_method_type: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MerchantInvoiceRow = {
  id: string;
  business_id: string;
  merchant_account_id: string | null;
  contact_id: string | null;
  processor: PaymentProcessor;
  processor_invoice_id: string | null;
  invoice_number: string | null;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  due_date: string | null;
  hosted_url: string | null;
  created_at: string;
};

export type MerchantPaymentLinkRow = {
  id: string;
  business_id: string;
  merchant_account_id: string | null;
  processor: PaymentProcessor;
  processor_link_id: string | null;
  name: string;
  amount: number | null;
  currency: string;
  url: string | null;
  active: boolean;
  created_at: string;
};

export type MerchantSubscriptionRow = {
  id: string;
  business_id: string;
  contact_id: string | null;
  processor: PaymentProcessor;
  processor_subscription_id: string | null;
  status: string;
  amount: number;
  currency: string;
  interval: string;
  current_period_end: string | null;
  created_at: string;
};

export type MerchantPayoutRow = {
  id: string;
  business_id: string;
  merchant_account_id: string | null;
  processor: PaymentProcessor;
  processor_payout_id: string | null;
  amount: number;
  currency: string;
  status: string;
  arrival_date: string | null;
  created_at: string;
};

export type MerchantDisputeRow = {
  id: string;
  business_id: string;
  transaction_id: string | null;
  processor: PaymentProcessor;
  processor_dispute_id: string | null;
  amount: number;
  status: string;
  reason: string | null;
  created_at: string;
};

export type MerchantRefundRow = {
  id: string;
  business_id: string;
  transaction_id: string | null;
  processor: PaymentProcessor;
  processor_refund_id: string | null;
  amount: number;
  status: string;
  reason: string | null;
  created_at: string;
};

export type MerchantDashboardStats = {
  volume30d: number;
  platformRevenue30d: number;
  failedCount30d: number;
  refundCount30d: number;
  disputeCount30d: number;
  payoutPending: number;
  transactionCount30d: number;
};

export type MerchantAdminOverview = {
  totalAgencies: number;
  agenciesWithMerchant: number;
  activeMerchantAccounts: number;
  pendingActivations: number;
  volume30d: number;
  platformRevenue30d: number;
  failedPayments30d: number;
  chargebacksOpen: number;
};

export const PAYMENT_PROCESSORS: { id: PaymentProcessor; label: string; available: boolean }[] = [
  { id: "stripe", label: "Stripe", available: true },
  { id: "square", label: "Square", available: false },
  { id: "paypal", label: "PayPal", available: false },
  { id: "authorize_net", label: "Authorize.net", available: false },
  { id: "clover", label: "Clover", available: false },
  { id: "external", label: "Existing merchant account", available: true },
];

export const MERCHANT_AI_AGENTS = [
  { key: "billing", label: "AI Billing Agent", description: "Creates invoices and payment links" },
  { key: "collections", label: "AI Collections Agent", description: "Follows up on failed and overdue payments" },
  { key: "renewal", label: "AI Renewal Agent", description: "Manages subscription renewals and retention" },
  { key: "payment_support", label: "AI Payment Support Agent", description: "Answers billing questions" },
  { key: "upsell", label: "AI Upsell Agent", description: "Recommends upsells after successful payments" },
] as const;
