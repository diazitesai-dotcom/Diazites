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
