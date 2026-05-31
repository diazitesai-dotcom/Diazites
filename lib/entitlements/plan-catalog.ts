import type { EntitlementKey, EntitlementPlanKey, EntitlementValue } from "@/types/entitlements";

export type PlanEntitlementTemplate = Partial<Record<EntitlementKey, EntitlementValue>>;

const starter: PlanEntitlementTemplate = {
  users: { int: 1 },
  workspaces: { int: 1 },
  crm_pipelines: { int: 1 },
  pipeline_stages: { int: 5 },
  workflows: { int: 5 },
  contacts: { int: 500 },
  landing_pages: { int: 1 },
  forms: { int: 1 },
  ad_accounts: { int: 1 },
  ad_platforms: { int: 1 },
  campaigns: { int: 3 },
  ad_spend_monitored: { int: 5000 },
  ads_agent_lite: { bool: true },
  ads_agent_full: { bool: false },
  lead_capture_agent_lite: { bool: true },
  crm_agent_lite: { bool: true },
  follow_up_agent_lite: { bool: true },
  ai_voice_lite: { bool: true },
  ai_voice_minutes: { int: 100 },
  outbound_ai_calls: { int: 25 },
  emails_monthly: { int: 500 },
  sms_monthly: { int: 100 },
  merchant_setup: { bool: true },
  merchant_automation: { bool: false },
  analytics_basic: { bool: true },
  analytics_advanced: { bool: false },
  settings_access: { bool: true },
  zapier_basic: { bool: true },
  zapier_advanced: { bool: false },
  external_api_access: { bool: false },
  mcp_connectors: { bool: false },
  subaccounts: { int: 1 },
  white_label: { bool: false },
  team_permissions: { bool: false },
  priority_support: { bool: false },
};

const trial: PlanEntitlementTemplate = { ...starter };

const growth: PlanEntitlementTemplate = {
  users: { int: 5 },
  workspaces: { int: 1 },
  crm_pipelines: { int: 10 },
  pipeline_stages: { int: null },
  workflows: { int: 25 },
  contacts: { int: 2500 },
  landing_pages: { int: 10 },
  forms: { int: 25 },
  ad_accounts: { int: 5 },
  ad_platforms: { int: 3 },
  campaigns: { int: null },
  ad_spend_monitored: { int: null },
  ads_agent_lite: { bool: true },
  ads_agent_full: { bool: true },
  lead_capture_agent_lite: { bool: true },
  crm_agent_lite: { bool: true },
  follow_up_agent_lite: { bool: true },
  ai_voice_lite: { bool: true },
  ai_voice_minutes: { int: 500 },
  outbound_ai_calls: { int: 100 },
  emails_monthly: { int: 25000 },
  sms_monthly: { int: 5000 },
  merchant_setup: { bool: true },
  merchant_automation: { bool: true },
  analytics_basic: { bool: true },
  analytics_advanced: { bool: true },
  settings_access: { bool: true },
  zapier_basic: { bool: true },
  zapier_advanced: { bool: true },
  external_api_access: { bool: false },
  mcp_connectors: { bool: false },
  subaccounts: { int: 5 },
  white_label: { bool: false },
  team_permissions: { bool: false },
  priority_support: { bool: false },
};

const pro: PlanEntitlementTemplate = {
  users: { int: 25 },
  workspaces: { int: null },
  crm_pipelines: { int: null },
  pipeline_stages: { int: null },
  workflows: { int: null },
  contacts: { int: null },
  landing_pages: { int: null },
  forms: { int: null },
  ad_accounts: { int: 10 },
  ad_platforms: { int: null },
  campaigns: { int: null },
  ad_spend_monitored: { int: null },
  ads_agent_lite: { bool: true },
  ads_agent_full: { bool: true },
  lead_capture_agent_lite: { bool: true },
  crm_agent_lite: { bool: true },
  follow_up_agent_lite: { bool: true },
  ai_voice_lite: { bool: true },
  ai_voice_minutes: { int: 2500 },
  outbound_ai_calls: { int: null },
  emails_monthly: { int: 100000 },
  sms_monthly: { int: 25000 },
  merchant_setup: { bool: true },
  merchant_automation: { bool: true },
  analytics_basic: { bool: true },
  analytics_advanced: { bool: true },
  settings_access: { bool: true },
  zapier_basic: { bool: true },
  zapier_advanced: { bool: true },
  external_api_access: { bool: true },
  mcp_connectors: { bool: true },
  subaccounts: { int: null },
  white_label: { bool: true },
  team_permissions: { bool: true },
  priority_support: { bool: true },
};

const enterprise: PlanEntitlementTemplate = {
  users: { int: null },
  workspaces: { int: null },
  crm_pipelines: { int: null },
  pipeline_stages: { int: null },
  workflows: { int: null },
  contacts: { int: null },
  landing_pages: { int: null },
  forms: { int: null },
  ad_accounts: { int: null },
  ad_platforms: { int: null },
  campaigns: { int: null },
  ad_spend_monitored: { int: null },
  ads_agent_lite: { bool: true },
  ads_agent_full: { bool: true },
  lead_capture_agent_lite: { bool: true },
  crm_agent_lite: { bool: true },
  follow_up_agent_lite: { bool: true },
  ai_voice_lite: { bool: true },
  ai_voice_minutes: { int: null },
  outbound_ai_calls: { int: null },
  emails_monthly: { int: null },
  sms_monthly: { int: null },
  merchant_setup: { bool: true },
  merchant_automation: { bool: true },
  analytics_basic: { bool: true },
  analytics_advanced: { bool: true },
  settings_access: { bool: true },
  zapier_basic: { bool: true },
  zapier_advanced: { bool: true },
  external_api_access: { bool: true },
  mcp_connectors: { bool: true },
  subaccounts: { int: null },
  white_label: { bool: true },
  team_permissions: { bool: true },
  priority_support: { bool: true },
};

export const PLAN_ENTITLEMENT_CATALOG: Record<EntitlementPlanKey, PlanEntitlementTemplate> = {
  trial,
  starter,
  growth,
  pro,
  enterprise,
};

/** Maps Stripe/billing plan display names to entitlement plan keys. */
export function billingToEntitlementPlan(
  planName: string | null | undefined,
  subscriptionStatus?: string | null,
): EntitlementPlanKey {
  if (subscriptionStatus === "trialing") return "trial";
  const raw = (planName ?? "Starter").toLowerCase();
  if (raw === "starter" || raw === "free") return "starter";
  if (raw === "growth") return "growth";
  if (raw === "pro" || raw === "domination") return "pro";
  if (raw === "enterprise") return "enterprise";
  if (raw === "trial") return "trial";
  return "starter";
}

export function planRank(plan: EntitlementPlanKey): number {
  const order: EntitlementPlanKey[] = ["trial", "starter", "growth", "pro", "enterprise"];
  return order.indexOf(plan);
}

export function meetsPlanMinimum(
  current: EntitlementPlanKey,
  required: EntitlementPlanKey,
): boolean {
  return planRank(current) >= planRank(required);
}
