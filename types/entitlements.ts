/** Plan keys for entitlement templates (lowercase). */
export type EntitlementPlanKey = "trial" | "starter" | "growth" | "pro" | "enterprise";

export type EntitlementKey =
  | "users"
  | "workspaces"
  | "crm_pipelines"
  | "pipeline_stages"
  | "workflows"
  | "contacts"
  | "landing_pages"
  | "forms"
  | "ad_accounts"
  | "ad_platforms"
  | "campaigns"
  | "ad_spend_monitored"
  | "ads_agent_lite"
  | "ads_agent_full"
  | "lead_capture_agent_lite"
  | "crm_agent_lite"
  | "follow_up_agent_lite"
  | "ai_voice_lite"
  | "ai_voice_minutes"
  | "outbound_ai_calls"
  | "emails_monthly"
  | "sms_monthly"
  | "merchant_setup"
  | "merchant_automation"
  | "analytics_basic"
  | "analytics_advanced"
  | "settings_access"
  | "zapier_basic"
  | "zapier_advanced"
  | "external_api_access"
  | "mcp_connectors"
  | "subaccounts"
  | "white_label"
  | "team_permissions"
  | "priority_support";

export type EntitlementValue = {
  bool?: boolean;
  int?: number | null;
};

export type AccountEntitlementsMap = Partial<Record<EntitlementKey, EntitlementValue>>;

export type AccountEntitlementContext = {
  businessId: string;
  planKey: EntitlementPlanKey;
  entitlements: AccountEntitlementsMap;
};

export type UpgradePlanTarget = "growth" | "pro" | "enterprise";

export type UpgradePromptContext = {
  featureKey: EntitlementKey | string;
  title: string;
  message: string;
  requiredPlan: UpgradePlanTarget;
};

export const STARTER_AGENT_KEYS = [
  "lead_capture",
  "crm",
  "follow_up",
  "ads_lite",
  "ai_voice_lite",
] as const;

export type StarterAgentKey = (typeof STARTER_AGENT_KEYS)[number];
