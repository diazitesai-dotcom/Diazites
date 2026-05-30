import type { SupabaseClient } from "@supabase/supabase-js";

import type { PipelineRow, PipelineStageRow } from "@/types/diazites-platform";

export type PipelineStageAutomationRow = {
  id: string;
  business_id: string;
  pipeline_id: string;
  pipeline_stage_id: string;
  name: string;
  automation_type: string;
  workflow_id: string | null;
  config: Record<string, unknown>;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function createPipelineRepository(client: SupabaseClient) {
  return {
    async listPipelines(businessId: string) {
      return client
        .from("pipelines")
        .select("*")
        .eq("business_id", businessId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
    },

    async getPipeline(pipelineId: string, businessId: string) {
      return client
        .from("pipelines")
        .select("*")
        .eq("id", pipelineId)
        .eq("business_id", businessId)
        .maybeSingle();
    },

    async createPipeline(input: {
      businessId: string;
      name: string;
      description?: string;
      isDefault?: boolean;
    }) {
      return client
        .from("pipelines")
        .insert({
          business_id: input.businessId,
          name: input.name,
          description: input.description ?? null,
          is_default: input.isDefault ?? false,
        })
        .select("*")
        .single();
    },

    async updatePipeline(
      pipelineId: string,
      businessId: string,
      patch: Partial<{ name: string; description: string | null; is_default: boolean }>,
    ) {
      return client
        .from("pipelines")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", pipelineId)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },

    async deletePipeline(pipelineId: string, businessId: string) {
      return client.from("pipelines").delete().eq("id", pipelineId).eq("business_id", businessId);
    },

    async listStages(pipelineId: string, businessId: string) {
      return client
        .from("pipeline_stages")
        .select("*")
        .eq("pipeline_id", pipelineId)
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true });
    },

    async createStage(input: {
      businessId: string;
      pipelineId: string;
      name: string;
      sortOrder: number;
      stageType?: "open" | "won" | "lost";
      color?: string;
    }) {
      return client
        .from("pipeline_stages")
        .insert({
          business_id: input.businessId,
          pipeline_id: input.pipelineId,
          name: input.name,
          sort_order: input.sortOrder,
          stage_type: input.stageType ?? "open",
          color: input.color ?? "#8b5cf6",
        })
        .select("*")
        .single();
    },

    async updateStage(
      stageId: string,
      businessId: string,
      patch: Partial<{
        name: string;
        sort_order: number;
        stage_type: string;
        color: string;
      }>,
    ) {
      return client
        .from("pipeline_stages")
        .update(patch)
        .eq("id", stageId)
        .eq("business_id", businessId)
        .select("*")
        .single();
    },

    async deleteStage(stageId: string, businessId: string) {
      return client.from("pipeline_stages").delete().eq("id", stageId).eq("business_id", businessId);
    },

    async listStageAutomations(pipelineId: string, businessId: string) {
      return client
        .from("pipeline_stage_automations")
        .select("*")
        .eq("pipeline_id", pipelineId)
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true });
    },

    async createStageAutomation(input: {
      businessId: string;
      pipelineId: string;
      pipelineStageId: string;
      name: string;
      automationType: string;
      workflowId?: string | null;
      config?: Record<string, unknown>;
    }) {
      return client
        .from("pipeline_stage_automations")
        .insert({
          business_id: input.businessId,
          pipeline_id: input.pipelineId,
          pipeline_stage_id: input.pipelineStageId,
          name: input.name,
          automation_type: input.automationType,
          workflow_id: input.workflowId ?? null,
          config: input.config ?? {},
        })
        .select("*")
        .single();
    },

    async deleteStageAutomation(id: string, businessId: string) {
      return client
        .from("pipeline_stage_automations")
        .delete()
        .eq("id", id)
        .eq("business_id", businessId);
    },

    async listWorkflowsForPipeline(pipelineId: string, businessId: string) {
      return client
        .from("diazites_workflows")
        .select("*")
        .eq("business_id", businessId)
        .eq("pipeline_id", pipelineId)
        .order("updated_at", { ascending: false });
    },

    async countContactsByStage(pipelineId: string, businessId: string) {
      return client
        .from("contacts")
        .select("pipeline_stage_id")
        .eq("business_id", businessId)
        .eq("pipeline_id", pipelineId);
    },
  };
}

export type { PipelineRow, PipelineStageRow };
