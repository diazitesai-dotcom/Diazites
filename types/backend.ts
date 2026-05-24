import type { PipelineStatus } from "@/types/domain";

export const EVENT_TYPES = {
  LEAD_CREATED: "LEAD_CREATED",
  LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
  LEAD_NOTE_ADDED: "LEAD_NOTE_ADDED",
  AGENT_ACTIVATED: "AGENT_ACTIVATED",
  AGENT_STATUS_CHANGED: "AGENT_STATUS_CHANGED",
  CAMPAIGN_CREATED: "CAMPAIGN_CREATED",
  CAMPAIGN_UPDATED: "CAMPAIGN_UPDATED",
  ONBOARDING_STAGE_CHANGED: "ONBOARDING_STAGE_CHANGED",
  AI_FOLLOW_UP_SENT: "AI_FOLLOW_UP_SENT",
  BILLING_PLAN_CHANGED: "BILLING_PLAN_CHANGED",
  ENGINE_LAUNCHED: "ENGINE_LAUNCHED",
  ENGINE_QA_FAILED: "ENGINE_QA_FAILED",
  AD_CAMPAIGN_PUSHED: "AD_CAMPAIGN_PUSHED",
  LANDING_PAGE_PUBLISHED: "LANDING_PAGE_PUBLISHED",
  LANDING_PAGE_SUBMISSION: "LANDING_PAGE_SUBMISSION",
  AD_ACCOUNT_CONNECTED: "AD_ACCOUNT_CONNECTED",
  AD_ACCOUNT_SYNCED: "AD_ACCOUNT_SYNCED",
  APPROVAL_REQUESTED: "APPROVAL_REQUESTED",
  APPROVAL_DECIDED: "APPROVAL_DECIDED",
  OPTIMIZATION_RECOMMENDED: "OPTIMIZATION_RECOMMENDED",
  OPTIMIZATION_APPLIED: "OPTIMIZATION_APPLIED",
  GROWTH_ENGINE_STAGE_CHANGED: "GROWTH_ENGINE_STAGE_CHANGED",
  AUDIT_ACTION: "AUDIT_ACTION",
} as const;

export type SystemEventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export type BillingPlanName = "Starter" | "Growth" | "Domination";

export type OnboardingStageDb =
  | "signup"
  | "profile"
  | "build"
  | "qa"
  | "live"
  | "optimize";

export interface LeadCreateInput {
  businessId: string;
  campaignId?: string | null;
  landingPageId?: string | null;
  landingPageVersionId?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  roofingNeed?: string | null;
  timeline?: string | null;
  budget?: string | null;
  notes?: string | null;
  source?: string | null;
  customFields?: Record<string, unknown>;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export interface LeadUpdateInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  roofingNeed?: string | null;
  timeline?: string | null;
  notes?: string | null;
  source?: string | null;
  status?: PipelineStatus;
}

export interface BusinessUpsertInput {
  name: string;
  website?: string | null;
  serviceArea?: string | null;
  cityState?: string | null;
  services?: string | null;
  businessHours?: string | null;
  monthlyBudget?: number;
  logoUrl?: string | null;
}

export interface CampaignCreateInput {
  businessId: string;
  platform: string;
  budget?: number;
  goal?: string | null;
  location?: string | null;
  status?: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  totalSpend: number;
  costPerLead: number | null;
  conversionRate: number | null;
  roi: number | null;
  activeCampaigns: number;
  periodDays: number;
}
