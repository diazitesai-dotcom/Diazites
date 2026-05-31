import type { BillingPlanName } from "@/types/backend";

export type UsageMetricKey =
  | "ai_call_minutes"
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
    description: "Launch your first AI growth system.",
    limits: {
      businesses: 1,
      users: 1,
      contacts: 500,
      pipelines: 1,
      workflowsActive: 5,
      aiAgents: 5,
      aiCallMinutes: 100,
      adAccounts: 1,
      landingPages: 1,
      forms: 1,
      emailsPerMonth: 500,
    },
    features: [
      "1 workspace · 1 user · 1 CRM pipeline",
      "5 workflows · 1 landing page",
      "Lead Capture, CRM, Follow-Up & Ads Agent Lite",
      "Connect Meta OR Google Ads",
      "AI Voice Lite — 100 min · 25 outbound calls/mo",
      "Stripe setup · Basic analytics",
    ],
  },
  {
    name: "Growth",
    priceMonthly: 397,
    recommended: true,
    description: "Scale campaigns, conversations, and automation.",
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
      emailsPerMonth: 25000,
    },
    features: [
      "5 users · 5 AI agents",
      "Meta + Google + more ad platforms",
      "10 landing pages · 25 workflows",
      "500 AI voice minutes · 100 outbound calls",
      "Advanced analytics · Zapier advanced",
      "Merchant automation options",
    ],
  },
  {
    name: "Pro",
    priceMonthly: 997,
    description: "Operate like an AI-powered agency.",
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
      emailsPerMonth: 100000,
    },
    features: [
      "25 users · 15 AI agents",
      "Subaccounts · White label",
      "Advanced ad management",
      "API / MCP connectors",
      "Team permissions · Priority support",
    ],
  },
  {
    name: "Enterprise",
    priceMonthly: 2500,
    customPricing: true,
    description: "Custom AI operating system for serious scale.",
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
      emailsPerMonth: null,
    },
    features: [
      "Custom agents & limits",
      "Multi-org support",
      "Custom integrations",
      "Dedicated onboarding",
      "SLA support",
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

/** Usage metrics hidden from billing UI (legacy / deprecated). */
export const HIDDEN_USAGE_METRIC_KEYS: readonly string[] = ["sms_sent"];

export const BILLING_PLANS_DISPLAY = DIAZITES_PLANS.filter((p) => p.name !== "Enterprise").concat(
  DIAZITES_PLANS.filter((p) => p.name === "Enterprise"),
);
