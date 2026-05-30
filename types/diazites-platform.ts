export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

export type WorkflowNodeType =
  | "trigger"
  | "condition"
  | "action"
  | "wait"
  | "branch";

export type WorkflowDefinition = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
};

export type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type WorkflowTemplateRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
};

export type DiazitesWorkflowRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  definition: WorkflowDefinition;
  pipeline_id: string | null;
  pipeline_stage_id: string | null;
  trigger_type: string | null;
  attachment: Record<string, unknown>;
  conversion_rate: number;
  revenue_attributed: number;
  created_at: string;
  updated_at: string;
};

export type WorkflowDashboardStats = {
  active: number;
  draft: number;
  paused: number;
  completedRuns: number;
  failedRuns: number;
  leadsInWorkflows: number;
  conversionRate: number;
  revenueAttributed: number;
  scheduledActions: number;
};

export type AiCallingAgentRow = {
  id: string;
  business_id: string;
  name: string;
  objective: string;
  status: "draft" | "active" | "paused" | "archived";
  voice_config: Record<string, unknown>;
  script_config: Record<string, unknown>;
  routing_config: Record<string, unknown>;
  pipeline_id: string | null;
  workflow_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AiCallDashboardStats = {
  activeAgents: number;
  callsToday: number;
  outbound: number;
  inbound: number;
  answerRate: number;
  qualifiedLeads: number;
  appointmentsBooked: number;
  followUpsTriggered: number;
  pipelineMovements: number;
  workflowActionsTriggered: number;
  revenueAttributed: number;
};

export type PipelineRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
};

export type PipelineStageRow = {
  id: string;
  pipeline_id: string;
  name: string;
  sort_order: number;
  stage_type: string;
  color: string | null;
};

export type AiTextAgentRow = {
  id: string;
  business_id: string;
  name: string;
  objective: string;
  status: "draft" | "active" | "paused" | "archived";
  persona_config: Record<string, unknown>;
  script_config: Record<string, unknown>;
  routing_config: Record<string, unknown>;
  pipeline_id: string | null;
  workflow_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AiTextDashboardStats = {
  activeAgents: number;
  messagesSentToday: number;
  campaignsActive: number;
  replyRate: number;
  sequencesActive: number;
  pipelineMovements: number;
  workflowActionsTriggered: number;
  failedDeliveries: number;
};

export type SmsCampaignRow = {
  id: string;
  business_id: string;
  ai_text_agent_id: string | null;
  name: string;
  status: string;
  message_body: string;
  audience_type: string;
  audience_filter: Record<string, unknown>;
  scheduled_at: string | null;
  sent_at: string | null;
  stats: { sent?: number; delivered?: number; failed?: number; replied?: number };
  created_at: string;
};

export type SmsSequenceRow = {
  id: string;
  business_id: string;
  name: string;
  status: string;
  steps: unknown[];
  trigger_type: string;
  created_at: string;
};

export type EmailAudienceRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  contact_count: number;
  created_at: string;
};

export type EmailTemplateRow = {
  id: string;
  business_id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  html_body: string;
  plain_text_body: string | null;
  category: string | null;
  is_ai_generated: boolean;
  created_at: string;
};

export type EmailCampaignRow = {
  id: string;
  business_id: string;
  audience_id: string | null;
  template_id: string | null;
  name: string;
  subject: string;
  preview_text: string | null;
  from_name: string | null;
  status: string;
  html_body: string;
  plain_text_body: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  stats: {
    sent?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
    bounced?: number;
    unsubscribed?: number;
  };
  ab_test_enabled: boolean;
  created_at: string;
};

export type EmailCampaignDashboardStats = {
  totalCampaigns: number;
  drafts: number;
  sent: number;
  scheduled: number;
  totalSubscribers: number;
  avgOpenRate: number;
  avgClickRate: number;
  automationsActive: number;
};

export const AI_TEXT_AGENT_PRESETS = [
  { name: "Lead Nurture SMS", objective: "Warm leads with helpful follow-up texts" },
  { name: "Appointment Reminder", objective: "Send reminders and reduce no-shows" },
  { name: "Missed Lead Recovery", objective: "Text leads who did not answer calls" },
  { name: "Review Request", objective: "Ask happy customers for reviews" },
] as const;

export const EMAIL_CAMPAIGN_FEATURES = [
  "Audiences & segments",
  "Drag-and-drop templates",
  "A/B subject lines",
  "Schedule & send",
  "Open & click tracking",
  "Automations & drip sequences",
  "CRM + workflow triggers",
  "AI content generation",
] as const;
