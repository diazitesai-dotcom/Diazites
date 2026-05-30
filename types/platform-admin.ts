import type { BillingPlanName, SubscriptionStatus } from "@/types/backend";
import type { UsageMetricKey } from "@/lib/billing/plans";

export type PlatformAccountType = "direct" | "agency" | "sub_account";

export type PlatformAccountStatus = "active" | "pending" | "suspended" | "approved";

export type PlatformFeatureFlags = {
  merchant_services: boolean;
  ai_calls: boolean;
  sms: boolean;
  email_campaigns: boolean;
  workflows: boolean;
  ai_agents: boolean;
  ad_accounts: boolean;
  white_label: boolean;
  funnel_studio: boolean;
  integrations: boolean;
};

export type UsageLimitOverrides = Partial<Record<UsageMetricKey, number | null>>;

export type PlatformAccountSettingsRow = {
  business_id: string;
  account_type: PlatformAccountType;
  status: PlatformAccountStatus;
  parent_business_id: string | null;
  feature_flags: PlatformFeatureFlags;
  usage_limit_overrides: UsageLimitOverrides;
  white_label_enabled: boolean;
  admin_notes: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformAccountView = {
  businessId: string;
  businessName: string;
  ownerUserId: string;
  ownerEmail: string | null;
  accountType: PlatformAccountType;
  status: PlatformAccountStatus;
  parentBusinessId: string | null;
  parentAgencyName: string | null;
  agencyId: string | null;
  agencyName: string | null;
  subAccountCount: number;
  teamMemberCount: number;
  planName: BillingPlanName | string;
  trialEndsAt: string | null;
  subscriptionStatus: SubscriptionStatus | string | null;
  billingStatus: string | null;
  promoCode: string | null;
  merchantStatus: string | null;
  featureFlags: PlatformFeatureFlags;
  usageLimitOverrides: UsageLimitOverrides;
  activeFeatures: string[];
  currentUsage: Record<string, number>;
  usageLimits: Record<string, number | null>;
  whiteLabelEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  recentAiActivityCount: number;
};

export type PlatformAdminOverview = {
  totalAccounts: number;
  agencies: number;
  subAccounts: number;
  directAccounts: number;
  activeTrials: number;
  suspended: number;
  pendingApproval: number;
  merchantActive: number;
};

export const DEFAULT_PLATFORM_FEATURE_FLAGS: PlatformFeatureFlags = {
  merchant_services: true,
  ai_calls: true,
  sms: true,
  email_campaigns: true,
  workflows: true,
  ai_agents: true,
  ad_accounts: true,
  white_label: false,
  funnel_studio: true,
  integrations: true,
};

export const FEATURE_FLAG_LABELS: Record<keyof PlatformFeatureFlags, string> = {
  merchant_services: "Merchant services",
  ai_calls: "AI Call Command Center",
  sms: "SMS / AI Text",
  email_campaigns: "Email campaigns",
  workflows: "Workflows",
  ai_agents: "AI agents",
  ad_accounts: "Ad accounts",
  white_label: "White label",
  funnel_studio: "Funnel Studio",
  integrations: "Integrations",
};
