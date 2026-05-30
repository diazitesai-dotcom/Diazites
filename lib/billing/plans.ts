import type { BillingPlanName } from "@/types/backend";

export type UsageMetricKey =
  | "ai_call_minutes"
  | "sms_sent"
  | "email_sent"
  | "ai_tokens"
  | "ai_agents"
  | "ad_accounts"
  | "contacts"
  | "landing_pages"
  | "forms"
  | "workflows_active"
  | "pipelines"
  | "users"
  | "storage_mb";

export type PlanLimits = {
  businesses: number;
  users: number;
  contacts: number | null;
  pipelines: number | null;
  workflowsActive: number | null;
  aiAgents: number | null;
  aiCallMinutes: number | null;
  adAccounts: number | null;
  landingPages: number | null;
  forms: number | null;
  smsPerMonth: number | null;
  emailsPerMonth: number | null;
};

export type PlanDefinition = {
  name: BillingPlanName;
  priceMonthly: number;
  priceAnnual?: number;
  description: string;
  recommended?: boolean;
  customPricing?: boolean;
  limits: PlanLimits;
  features: string[];
};

export const DEFAULT_TRIAL_DAYS = 14;

export const DIAZITES_PLANS: PlanDefinition[] = [
  {
    name: "Starter",
    priceMonthly: 147,
    description: "Solo businesses, local businesses, startups, and consultants.",
    limits: {
      businesses: 1,
      users: 1,
      contacts: 250,
      pipelines: 1,
      workflowsActive: 5,
      aiAgents: 1,
      aiCallMinutes: 50,
      adAccounts: 1,
      landingPages: 1,
      forms: 5,
      smsPerMonth: 500,
      emailsPerMonth: 1000,
    },
    features: [
      "CRM & 1 pipeline",
      "5 active workflows",
      "AI Text/SMS & Email",
      "Form builder",
      "Basic merchant services",
    ],
  },
  {
    name: "Growth",
    priceMonthly: 397,
    recommended: true,
    description: "Growing SMBs, agencies, nonprofits, and service companies.",
    limits: {
      businesses: 1,
      users: 5,
      contacts: null,
      pipelines: 10,
      workflowsActive: 25,
      aiAgents: 5,
      aiCallMinutes: 500,
      adAccounts: 2,
      landingPages: 10,
      forms: 25,
      smsPerMonth: 5000,
      emailsPerMonth: 25000,
    },
    features: [
      "AI Call Command Center",
      "Email campaign automation",
      "Lead scoring",
      "Project management",
      "AI backend management",
    ],
  },
  {
    name: "Pro",
    priceMonthly: 997,
    description: "Agencies, advanced operators, and multi-location businesses.",
    limits: {
      businesses: 1,
      users: 25,
      contacts: null,
      pipelines: null,
      workflowsActive: null,
      aiAgents: 15,
      aiCallMinutes: 2500,
      adAccounts: 10,
      landingPages: null,
      forms: null,
      smsPerMonth: 25000,
      emailsPerMonth: 100000,
    },
    features: [
      "Advanced AI ad management",
      "White label capability",
      "Team permissions",
      "Advanced merchant automation",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    priceMonthly: 2500,
    customPricing: true,
    description: "Large organizations, franchises, and enterprise deployments.",
    limits: {
      businesses: 999,
      users: 999,
      contacts: null,
      pipelines: null,
      workflowsActive: null,
      aiAgents: null,
      aiCallMinutes: null,
      adAccounts: null,
      landingPages: null,
      forms: null,
      smsPerMonth: null,
      emailsPerMonth: null,
    },
    features: [
      "Custom deployment",
      "Dedicated onboarding",
      "SLA support",
      "Multi-org support",
      "Custom usage limits",
    ],
  },
];

/** Legacy plan alias — maps stored Domination rows to Pro limits. */
export function normalizePlanName(name: string | null | undefined): BillingPlanName {
  if (!name) return "Starter";
  if (name === "Domination") return "Pro";
  if (name === "Starter" || name === "Growth" || name === "Pro" || name === "Enterprise") {
    return name;
  }
  return "Starter";
}

export function getPlanDefinition(name: string | null | undefined): PlanDefinition {
  const normalized = normalizePlanName(name);
  return DIAZITES_PLANS.find((p) => p.name === normalized) ?? DIAZITES_PLANS[0]!;
}

export function planMonthlyAmount(name: string | null | undefined): number {
  return getPlanDefinition(name).priceMonthly;
}

export const BILLING_PLANS_DISPLAY = DIAZITES_PLANS.filter((p) => p.name !== "Enterprise").concat(
  DIAZITES_PLANS.filter((p) => p.name === "Enterprise"),
);
