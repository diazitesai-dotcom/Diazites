/** AI Marketing OS domain types */

export type AiOperatingMode = "manual" | "assisted" | "autonomous";

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "marketer"
  | "sales_rep"
  | "viewer"
  | "agency_partner";

export type AdPlatform =
  | "meta"
  | "google"
  | "tiktok"
  | "microsoft"
  | "zernio"
  | "zapier"
  | "other";

export type ConnectionStatus =
  | "connected"
  | "not_connected"
  | "token_expired"
  | "needs_permissions"
  | "sync_failed";

export type LandingVersionLabel = "draft" | "published" | "a" | "b" | "c";

export type LandingSectionType =
  | "hero"
  | "offer"
  | "benefits"
  | "testimonials"
  | "faq"
  | "video"
  | "gallery"
  | "before_after"
  | "map"
  | "pricing"
  | "contact_form"
  | "calendar"
  | "trust_badges";

export type LandingSection = {
  id: string;
  type: LandingSectionType;
  enabled: boolean;
  order: number;
  content: Record<string, unknown>;
};

export type LandingFormField = {
  id: string;
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "number";
  required: boolean;
  crmField: string;
  options?: string[];
};

export type ApprovalType =
  | "campaign_launch"
  | "budget_change"
  | "ai_creative"
  | "agent_action"
  | "crm_mass_action"
  | "automation_change"
  | "optimization_action";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "modified" | "expired";

export type CampaignLifecycle =
  | "draft"
  | "generating"
  | "pending_approval"
  | "live"
  | "paused"
  | "completed"
  | "ai_optimizing";

export type OptimizationType =
  | "budget_shift"
  | "creative_fatigue"
  | "audience_expansion"
  | "cpl_spike"
  | "roas_drop"
  | "landing_page"
  | "other";

export type RecommendationStatus = "pending" | "approved" | "rejected" | "applied" | "expired";

export type GrowthEngineStage =
  | "input"
  | "ai_research"
  | "campaign_creative"
  | "funnel_blueprint"
  | "ai_generation_suite"
  | "variant_generation"
  | "ai_scoring"
  | "launch_system";

export const AGENT_PERMISSION_KEYS = [
  "read_campaigns",
  "create_campaigns",
  "edit_budgets",
  "pause_campaigns",
  "launch_landing_pages",
  "pull_reports",
  "create_optimization_recommendations",
] as const;

export type AgentPermissionKey = (typeof AGENT_PERMISSION_KEYS)[number];

export const DEFAULT_FORM_FIELDS: LandingFormField[] = [
  { id: "name", key: "name", label: "Name", type: "text", required: true, crmField: "name" },
  { id: "phone", key: "phone", label: "Phone", type: "phone", required: true, crmField: "phone" },
  { id: "email", key: "email", label: "Email", type: "email", required: true, crmField: "email" },
  { id: "address", key: "address", label: "Address", type: "text", required: false, crmField: "address" },
  {
    id: "service_needed",
    key: "service_needed",
    label: "Service needed",
    type: "text",
    required: false,
    crmField: "roofing_need",
  },
  { id: "timeline", key: "timeline", label: "Timeline", type: "text", required: false, crmField: "timeline" },
  { id: "budget", key: "budget", label: "Budget", type: "text", required: false, crmField: "budget" },
  { id: "notes", key: "notes", label: "Notes", type: "textarea", required: false, crmField: "notes" },
];

export const DEFAULT_LANDING_SECTIONS: LandingSection[] = [
  {
    id: "hero",
    type: "hero",
    enabled: true,
    order: 0,
    content: { headline: "", subheadline: "", cta: "Get Started" },
  },
  {
    id: "offer",
    type: "offer",
    enabled: true,
    order: 1,
    content: { title: "Our Offer", body: "" },
  },
  {
    id: "benefits",
    type: "benefits",
    enabled: true,
    order: 2,
    content: { items: [] },
  },
  {
    id: "contact_form",
    type: "contact_form",
    enabled: true,
    order: 3,
    content: { title: "Request a quote" },
  },
  {
    id: "trust_badges",
    type: "trust_badges",
    enabled: false,
    order: 4,
    content: { badges: [] },
  },
];

export type AiConversionScores = {
  headlineScore: number;
  ctaScore: number;
  formFrictionScore: number;
  expectedConversionLift: number;
  recommendations: string[];
};

export type AdAccountCapabilities = {
  leadAds: boolean;
  conversionTracking: boolean;
  creativePush: boolean;
  budgetSync: boolean;
  performancePullback: boolean;
};

export const PLATFORM_CAPABILITIES: Record<AdPlatform, AdAccountCapabilities> = {
  meta: {
    leadAds: true,
    conversionTracking: true,
    creativePush: true,
    budgetSync: true,
    performancePullback: true,
  },
  google: {
    leadAds: true,
    conversionTracking: true,
    creativePush: true,
    budgetSync: true,
    performancePullback: true,
  },
  tiktok: {
    leadAds: true,
    conversionTracking: true,
    creativePush: true,
    budgetSync: true,
    performancePullback: false,
  },
  microsoft: {
    leadAds: true,
    conversionTracking: true,
    creativePush: true,
    budgetSync: true,
    performancePullback: true,
  },
  zernio: {
    leadAds: true,
    conversionTracking: true,
    creativePush: false,
    budgetSync: true,
    performancePullback: true,
  },
  zapier: {
    leadAds: false,
    conversionTracking: false,
    creativePush: false,
    budgetSync: false,
    performancePullback: false,
  },
  other: {
    leadAds: false,
    conversionTracking: false,
    creativePush: false,
    budgetSync: false,
    performancePullback: false,
  },
};
