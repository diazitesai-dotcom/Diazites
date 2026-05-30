import type { AiRecommendation, LandingStackVersion } from "@/lib/dashboard/mission-control-types";

export type SystemModuleId =
  | "traffic"
  | "landing"
  | "qualify"
  | "followup"
  | "crm"
  | "optimize";

export type SystemModuleDisplayState =
  | "live"
  | "running"
  | "active"
  | "processing"
  | "failed"
  | "needs_attention"
  | "disconnected"
  | "idle";

export type SystemModuleLogEntry = {
  id: string;
  time: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
};

export type SystemModuleKeyValue = { label: string; value: string };

export type SystemModuleDetailBase = {
  moduleId: SystemModuleId;
  title: string;
  displayState: SystemModuleDisplayState;
  isEmpty: boolean;
  summary: string;
  metrics: SystemModuleKeyValue[];
  logs: SystemModuleLogEntry[];
  aiReasoning?: string;
  history?: { time: string; event: string }[];
  contextualActions?: { label: string; href?: string; action?: string }[];
  trendPercent?: number;
  sparkTrend?: number[];
  healthHint?: string;
};

export type TrafficModuleDetail = SystemModuleDetailBase & {
  moduleId: "traffic";
  sources: { name: string; visits: number; percent: number }[];
  utmCampaigns: SystemModuleKeyValue[];
  devices: SystemModuleKeyValue[];
  locations: SystemModuleKeyValue[];
  timeline: { time: string; event: string }[];
  landingViews: SystemModuleKeyValue[];
  clickPath: string[];
};

export type LandingModuleDetail = SystemModuleDetailBase & {
  moduleId: "landing";
  conversions: number;
  conversionRate: string;
  capturedLeads: number;
  winningVersion: string;
  ctaClicks: number;
  formSubmissions: number;
  abTests: { variant: string; cvr: string; traffic: string }[];
  agentActions: string[];
  versions: LandingStackVersion[];
};

export type QualifyModuleDetail = SystemModuleDetailBase & {
  moduleId: "qualify";
  scoredLeads: number;
  queueCount: number;
  processingTime: string;
  leads: {
    id: string;
    name: string;
    score: number;
    reasoning: string;
    missingFields: string[];
    status: "pending" | "approved" | "rejected";
  }[];
  rules: string[];
};

export type FollowUpModuleDetail = SystemModuleDetailBase & {
  moduleId: "followup";
  pendingCount: number;
  eta: string;
  sequences: {
    lead: string;
    channel: "email" | "sms";
    status: string;
    preview: string;
    failed?: boolean;
  }[];
  nextOutreach: string;
};

export type CrmModuleDetail = SystemModuleDetailBase & {
  moduleId: "crm";
  syncedCount: number;
  syncLatency: string;
  connectedAccount: string;
  fieldMapping: SystemModuleKeyValue[];
  failedRecords: { id: string; reason: string }[];
};

export type OptimizeModuleDetail = SystemModuleDetailBase & {
  moduleId: "optimize";
  tuningActions: string[];
  recommendations: AiRecommendation[];
  changes: { what: string; why: string }[];
  budgetAdjustments: SystemModuleKeyValue[];
  performanceImpact: string;
  rollbackAvailable: boolean;
};

export type SystemModuleDetail =
  | TrafficModuleDetail
  | LandingModuleDetail
  | QualifyModuleDetail
  | FollowUpModuleDetail
  | CrmModuleDetail
  | OptimizeModuleDetail;

export type SystemModuleContext = {
  funnelCounts: {
    visitors: number;
    leads: number;
    qualified: number;
    booked: number;
    won: number;
  };
  metrics: {
    totalLeads: number;
    activeCampaigns: number;
    totalSpend: number;
    costPerLead: number | null;
    roi: number | null;
    periodDays: number;
  } | null;
  agents: { key: string; name: string; status: string }[];
  landingStackVersions: LandingStackVersion[];
  recommendations: AiRecommendation[];
  crmConnected: boolean;
  hasPaidAds: boolean;
  pixelOk?: boolean;
  trackingRequired?: boolean;
};
