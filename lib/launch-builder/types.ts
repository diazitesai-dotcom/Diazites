import type { NicheId } from "@/lib/niche/types";

export type LaunchStepKind =
  | "landing_page"
  | "ad_campaign"
  | "ad_creatives"
  | "follow_up_automation"
  | "workflow_automation"
  | "pipeline_crm"
  | "appointment_logic"
  | "nurture_sequence";

export type LaunchStepStatus = "draft_generated" | "edited" | "approved" | "launched";

export type LaunchStepBase = {
  id: string;
  kind: LaunchStepKind;
  title: string;
  status: LaunchStepStatus;
  order: number;
};

export type LandingPageStepData = {
  headline: string;
  subheadline: string;
  cta: string;
  bodyCopy: string;
  creativeDirection: string;
  formFields: string[];
  seoTitle: string;
  seoDescription: string;
  offer: string;
  location: string;
};

export type AdCampaignStepData = {
  platformRecommendation: string;
  dailyBudgetRecommendation: number;
  monthlyBudget: number;
  audienceTargeting: string;
  interests: string[];
  geographicSettings: string;
  objective: string;
  placements: string[];
  conversionEvent: string;
  campaignName: string;
};

export type AdCreativesStepData = {
  headlines: string[];
  primaryTexts: string[];
  hooks: string[];
  offers: string[];
  ctaVariations: string[];
  creativeConcepts: string[];
};

export type AutomationTrigger = {
  id: string;
  label: string;
  enabled: boolean;
};

export type AutomationAction = {
  id: string;
  type: "email" | "task" | "notification" | "ai_agent" | "wait" | "webhook";
  label: string;
  config?: Record<string, unknown>;
};

export type FollowUpAutomationStepData = {
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
};

export type WorkflowNodePreview = {
  id: string;
  label: string;
  type: string;
};

export type WorkflowAutomationStepData = {
  workflowName: string;
  description: string;
  nodes: WorkflowNodePreview[];
  nicheExamples: string[];
};

export type PipelineStagePreview = {
  name: string;
  stageType: "open" | "won" | "lost";
};

export type PipelineCrmStepData = {
  pipelineName: string;
  stages: PipelineStagePreview[];
  secondaryPipelines?: Array<{ name: string; stages: string[] }>;
};

export type AppointmentLogicStepData = {
  bookingObjective: string;
  qualificationRules: string[];
  routingRules: string[];
  reminderSchedule: string[];
  noShowHandling: string;
};

export type NurtureTouch = {
  day: number;
  channel: "email" | "task";
  label: string;
  templateKey?: string;
};

export type NurtureSequenceStepData = {
  sequenceName: string;
  touches: NurtureTouch[];
  notes: string;
};

export type LaunchStepData =
  | { kind: "landing_page"; data: LandingPageStepData }
  | { kind: "ad_campaign"; data: AdCampaignStepData }
  | { kind: "ad_creatives"; data: AdCreativesStepData }
  | { kind: "follow_up_automation"; data: FollowUpAutomationStepData }
  | { kind: "workflow_automation"; data: WorkflowAutomationStepData }
  | { kind: "pipeline_crm"; data: PipelineCrmStepData }
  | { kind: "appointment_logic"; data: AppointmentLogicStepData }
  | { kind: "nurture_sequence"; data: NurtureSequenceStepData };

export type LaunchStep = LaunchStepBase & LaunchStepData;

export type LaunchReadiness = Record<LaunchStepKind, boolean>;

export type LaunchPlan = {
  version: 1;
  nicheId: NicheId;
  nicheDisplayName: string;
  businessName: string;
  generatedAt: string;
  sourceSummary: string;
  steps: LaunchStep[];
  readiness: LaunchReadiness;
};

export const LAUNCH_STEP_LABELS: Record<LaunchStepKind, string> = {
  landing_page: "Landing Page",
  ad_campaign: "Ad Campaign",
  ad_creatives: "AI Ad Creatives",
  follow_up_automation: "Follow-Up Automation",
  workflow_automation: "Workflow Automation",
  pipeline_crm: "Pipeline / CRM",
  appointment_logic: "Appointment & Lead Handling",
  nurture_sequence: "Email Nurture Sequence",
};

export const LAUNCH_STEP_ORDER: LaunchStepKind[] = [
  "landing_page",
  "ad_campaign",
  "ad_creatives",
  "follow_up_automation",
  "workflow_automation",
  "pipeline_crm",
  "appointment_logic",
  "nurture_sequence",
];
