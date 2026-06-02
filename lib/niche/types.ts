import type { WorkflowDefinition } from "@/types/diazites-platform";

export type NicheId =
  | "generic"
  | "real_estate"
  | "restaurant"
  | "med_spa"
  | "law_firm"
  | "marketing_agency"
  | "nonprofit"
  | "home_services";

export type NicheStageAutomationDef = {
  name: string;
  automationType:
    | "enroll_workflow"
    | "send_email"
    | "add_tag"
    | "create_task"
    | "move_pipeline_stage"
    | "trigger_webhook"
    | "wait";
  workflowSlug?: string;
  config?: Record<string, unknown>;
};

export type NicheStageDef = {
  name: string;
  stageType: "open" | "won" | "lost";
  color: string;
  automations?: NicheStageAutomationDef[];
};

export type NichePipelineDef = {
  name: string;
  description: string;
  isDefault?: boolean;
  stages: NicheStageDef[];
};

export type NicheWorkflowDef = {
  slug: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  definition: WorkflowDefinition;
};

export type NicheBlueprint = {
  nicheId: NicheId;
  displayName: string;
  pipelines: NichePipelineDef[];
  tags: string[];
  workflows: NicheWorkflowDef[];
  systemWorkflowSlugs: string[];
  seedTasks: Array<{
    title: string;
    sourceAgent?: string;
    priority: "low" | "medium" | "high";
  }>;
  callingObjective: string;
  projectBoardName: string;
};

export type NicheProvisionInput = {
  industry?: string | null;
  businessType?: string | null;
  services?: string | null;
  businessName?: string | null;
};

export type NicheProvisionResult = {
  nicheId: NicheId;
  displayName: string;
  pipelineNames: string[];
  workflowNames: string[];
  tagCount: number;
  taskCount: number;
};
