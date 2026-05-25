import type { ConnectionStatus } from "@/lib/dashboard/mission-control-types";
import type { EngineStep } from "@/repositories/engine.repository";

export type PipelineStageStatus =
  | "not_started"
  | "running"
  | "complete"
  | "failed"
  | "needs_approval";

export type AutonomyMode =
  | "recommend_only"
  | "requires_approval"
  | "auto_execute"
  | "full_autonomous";

export type CloneRunPreset =
  | "same_business_new_offer"
  | "same_offer_new_location"
  | "same_funnel_new_niche"
  | "same_campaign_new_platform"
  | "same_campaign_new_budget";

export type EngineAgentKey =
  | "research"
  | "offer"
  | "funnel"
  | "landing"
  | "ads"
  | "creative"
  | "crm"
  | "followup"
  | "analytics"
  | "optimization"
  | "retargeting"
  | "compliance";

export type DeploymentGroupId = "paid_ads" | "crm" | "analytics" | "ecommerce";

export type EngineDeploymentTarget = {
  id: string;
  name: string;
  groupId: DeploymentGroupId;
  status: ConnectionStatus;
  permissions: string[];
  lastSync: string | null;
};

export type EngineAgentDefinition = {
  key: EngineAgentKey;
  label: string;
  purpose: string;
  tools: string[];
  defaultEnabled: boolean;
  estimatedCostUsd: number;
  riskLevel: "low" | "medium" | "high";
};

export type BudgetSafetyPolicy = {
  dailySpendCap: number;
  campaignSpendCap: number;
  approvalThresholdUsd: number;
  autoPauseCplSpike: boolean;
  autoPauseRoasDrop: boolean;
  alertTrackingBreak: boolean;
  alertAccountDisconnect: boolean;
  rollbackOnFailure: boolean;
};

export type GrowthEngineOsConfig = {
  autonomyMode: AutonomyMode;
  enabledAgents: EngineAgentKey[];
  selectedPlatforms: string[];
  policy: BudgetSafetyPolicy;
};

export type BusinessIntakeFields = {
  websiteUrl: string;
  businessName: string;
  niche: string;
  location: string;
  monthlyBudget: number | null;
  goal: string;
  targetAudience: string;
  revenueTarget: string;
  trafficSources: string;
  competitors: string;
  painPoints: string;
  usp: string;
  brandTone: string;
  servicesProducts: string;
  testimonials: string;
  complianceRestrictions: string;
  contactInfo: string;
  crmDestination: string;
  landingStyle: string;
};

export type PipelineStageView = {
  step: EngineStep;
  index: number;
  title: string;
  subtitle: string;
  status: PipelineStageStatus;
  duration: string | null;
  confidence: number | null;
  outputPreview: string;
  actions: { id: string; label: string }[];
};

export type CostForecastLine = {
  label: string;
  amount: string;
  detail?: string;
};

export type CostForecast = {
  lines: CostForecastLine[];
  projectedMonthly: string;
  projectedLeads: string;
  projectedCpl: string;
  projectedPipeline: string;
};

export type RunPerformanceCard = {
  id: string;
  businessName: string;
  websiteUrl: string | null;
  status: string;
  currentStep: EngineStep;
  stageProgress: number;
  platforms: string[];
  budget: number | null;
  leads: number;
  cpl: number | null;
  conversionRate: string | null;
  roasOrPipeline: string | null;
  startedAt: string;
  lastActivity: string;
};

export type WorkspaceTabId =
  | "overview"
  | "research"
  | "strategy"
  | "funnel"
  | "landing"
  | "creatives"
  | "audiences"
  | "crm"
  | "tracking"
  | "deployments"
  | "optimization"
  | "reasoning"
  | "approvals"
  | "performance";

export const WORKSPACE_TABS: { id: WorkspaceTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "research", label: "Research" },
  { id: "strategy", label: "Strategy" },
  { id: "funnel", label: "Funnel Blueprint" },
  { id: "landing", label: "Landing Pages" },
  { id: "creatives", label: "Ad Creatives" },
  { id: "audiences", label: "Audiences" },
  { id: "crm", label: "CRM / Follow-Up" },
  { id: "tracking", label: "Tracking" },
  { id: "deployments", label: "Deployments" },
  { id: "optimization", label: "Optimization Logs" },
  { id: "reasoning", label: "AI Reasoning" },
  { id: "approvals", label: "Approvals" },
  { id: "performance", label: "Performance" },
];

export const DEFAULT_OS_CONFIG: GrowthEngineOsConfig = {
  autonomyMode: "requires_approval",
  enabledAgents: [
    "research",
    "offer",
    "funnel",
    "landing",
    "ads",
    "creative",
    "crm",
    "followup",
    "analytics",
    "optimization",
  ],
  selectedPlatforms: ["meta", "google_ads", "ga4", "hubspot"],
  policy: {
    dailySpendCap: 25,
    campaignSpendCap: 150,
    approvalThresholdUsd: 50,
    autoPauseCplSpike: true,
    autoPauseRoasDrop: true,
    alertTrackingBreak: true,
    alertAccountDisconnect: true,
    rollbackOnFailure: true,
  },
};
