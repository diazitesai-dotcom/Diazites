import { getPlanDefinition, type PlanLimits, type UsageMetricKey } from "@/lib/billing/plans";
import {
  DEFAULT_PLATFORM_FEATURE_FLAGS,
  type PlatformFeatureFlags,
  type UsageLimitOverrides,
} from "@/types/platform-admin";

export function mergeFeatureFlags(
  raw?: Partial<PlatformFeatureFlags> | Record<string, boolean> | null,
): PlatformFeatureFlags {
  return { ...DEFAULT_PLATFORM_FEATURE_FLAGS, ...(raw ?? {}) } as PlatformFeatureFlags;
}

export function activeFeatureLabels(flags: PlatformFeatureFlags): string[] {
  return Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/_/g, " "));
}

export function planLimitsToUsageMap(limits: PlanLimits): Record<string, number | null> {
  return {
    ai_call_minutes: limits.aiCallMinutes,
    sms_sent: limits.smsPerMonth,
    email_sent: limits.emailsPerMonth,
    ai_agents: limits.aiAgents,
    ad_accounts: limits.adAccounts,
    workflows_active: limits.workflowsActive,
    contacts: limits.contacts,
    users: limits.users,
    landing_pages: limits.landingPages,
    forms: limits.forms,
    pipelines: limits.pipelines,
  };
}

export function mergedUsageLimits(
  planName: string | null | undefined,
  overrides: UsageLimitOverrides,
): Record<string, number | null> {
  const base = planLimitsToUsageMap(getPlanDefinition(planName).limits);
  const merged: Record<string, number | null> = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined) merged[k] = v;
  }
  return merged;
}

export function currentPeriodBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export const USAGE_METRIC_LABELS: Record<string, string> = {
  ai_call_minutes: "AI call minutes",
  sms_sent: "SMS sent",
  email_sent: "Emails sent",
  ai_agents: "AI agents",
  ad_accounts: "Ad accounts",
  workflows_active: "Active workflows",
  contacts: "Contacts",
  users: "Team users",
  ai_tokens: "AI tokens",
};
