import { BILLING_PLANS_DISPLAY } from "@/lib/billing/plans";

export const BRAND_HEADLINE =
  "Diazites — The AI Growth Operating System For Businesses & Agencies";

export const BRAND_SUBHEADLINE =
  "Deploy AI agents to run ads, capture leads, automate follow-up, manage CRM pipelines, launch landing pages, connect payments, and track performance from one command center.";

export const TRUST_BADGES = [
  "AI Agents",
  "CRM",
  "Landing Pages",
  "Campaigns",
  "Payments",
  "Automations",
  "Agency / Subaccounts",
] as const;

export const INTEGRATION_PARTNERS = [
  { name: "Stripe", slug: "stripe" },
  { name: "Supabase", slug: "supabase" },
  { name: "Vercel", slug: "vercel" },
  { name: "Google", slug: "google" },
  { name: "Meta", slug: "meta" },
  { name: "OpenAI", slug: "openai" },
  { name: "Anthropic", slug: "anthropic" },
  { name: "Namecheap", slug: "namecheap" },
  { name: "Cursor", slug: "cursor" },
  { name: "Hermes", slug: "hermes" },
] as const;

export const CAPABILITY_METRICS = [
  { label: "AI Agents Available", value: "8+" },
  { label: "Campaign Types Supported", value: "12+" },
  { label: "Integrations Ready", value: "10+" },
  { label: "Workspace Types", value: "3" },
  { label: "Automation Modules", value: "8+" },
  { label: "Payment Tools", value: "6+" },
] as const;

export const SECURITY_FEATURES = [
  "Supabase authentication",
  "Row Level Security on business data",
  "Role-based access control",
  "Account isolation per workspace",
  "Secure OAuth connections",
  "Admin audit logs",
  "Plan-based entitlements",
] as const;

export const ONBOARDING_AI_AGENTS = [
  {
    key: "crm",
    label: "CRM Agent",
    description: "Organize contacts, pipelines, and lead stages automatically.",
  },
  {
    key: "ads",
    label: "Ads Agent",
    description: "Build and optimize paid campaigns across Google and Meta.",
  },
  {
    key: "email",
    label: "Email Campaign Agent",
    description: "Launch nurture and conversion email flows.",
  },
  {
    key: "landing",
    label: "Landing Page Agent",
    description: "Publish high-converting capture pages fast.",
  },
  {
    key: "pipeline",
    label: "Pipeline Automation Agent",
    description: "Trigger stage-based automations in your CRM.",
  },
  {
    key: "merchant",
    label: "Merchant Services",
    description: "Collect payments, invoices, and subscriptions via Stripe.",
  },
  {
    key: "analytics",
    label: "Analytics Agent",
    description: "Track performance, attribution, and growth KPIs.",
  },
  {
    key: "tasks",
    label: "Task Agent",
    description: "Turn insights into assigned follow-up tasks.",
  },
] as const;

export const ONBOARDING_CONNECTIONS = [
  { key: "google", label: "Google", description: "Ads, Analytics, and OAuth." },
  { key: "meta", label: "Meta / Facebook", description: "Ad accounts and lead sync." },
  { key: "stripe", label: "Stripe", description: "Payments and subscriptions." },
  { key: "email", label: "Email", description: "SMTP or provider inbox." },
  { key: "website", label: "Website", description: "Domain and tracking pixel." },
  { key: "calendar", label: "Calendar", description: "Booking and appointments." },
  { key: "crm_import", label: "CRM Import", description: "Bring existing contacts in." },
] as const;

export const BUSINESS_TYPE_OPTIONS = [
  "Agency",
  "Local Business",
  "Nonprofit",
  "Consultant",
  "SaaS",
  "Ecommerce",
  "Creator",
  "Enterprise",
] as const;

export type BusinessTypeOption = (typeof BUSINESS_TYPE_OPTIONS)[number];

export const PRICING_PREVIEW_PLANS = BILLING_PLANS_DISPLAY.map((plan) => ({
  name: plan.name,
  priceMonthly: plan.customPricing ? null : plan.priceMonthly,
  customPricing: plan.customPricing ?? false,
  description: plan.description,
  recommended: plan.recommended ?? false,
  limits: {
    users: plan.limits.users,
    agents: plan.limits.aiAgents,
    subaccounts: plan.name === "Pro" || plan.name === "Enterprise" ? "Unlimited" : plan.limits.businesses,
    campaigns: plan.limits.adAccounts,
    landingPages: plan.limits.landingPages,
    emails: plan.limits.emailsPerMonth,
    merchant: plan.features.some((f) => f.toLowerCase().includes("merchant")),
    support:
      plan.name === "Enterprise"
        ? "Dedicated SLA"
        : plan.name === "Pro"
          ? "Priority"
          : plan.name === "Growth"
            ? "Standard"
            : "Email",
  },
  features: plan.features.filter((f) => !/sms|text\/sms|twilio/i.test(f)),
}));
