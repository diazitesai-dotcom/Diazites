import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_PIPELINE_STAGES } from "@/lib/pipelines/default-pipeline";
import { SYSTEM_WORKFLOW_TEMPLATES } from "@/lib/workflows/workflow-templates";
import { ok, fail, type ServiceResult } from "@/lib/result";
import {
  createPipelineRepository,
  type PipelineStageAutomationRow,
} from "@/repositories/pipeline.repository";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import type { DiazitesWorkflowRow, PipelineRow, PipelineStageRow } from "@/types/diazites-platform";

export type PipelineDetailView = {
  pipeline: PipelineRow;
  stages: PipelineStageRow[];
  stageAutomations: PipelineStageAutomationRow[];
  workflows: DiazitesWorkflowRow[];
  contactCountByStage: Record<string, number>;
};

export async function loadPipelinesHub(
  client: SupabaseClient,
  businessId: string,
): Promise<{
  pipelines: PipelineRow[];
  stageCounts: Record<string, number>;
}> {
  const repo = createPipelineRepository(client);
  const { data: pipelines } = await repo.listPipelines(businessId);
  const rows = (pipelines ?? []) as PipelineRow[];

  const stageCounts: Record<string, number> = {};
  for (const p of rows) {
    const { data: stages } = await repo.listStages(p.id, businessId);
    stageCounts[p.id] = stages?.length ?? 0;
  }

  return { pipelines: rows, stageCounts };
}

export async function loadPipelineDetail(
  client: SupabaseClient,
  businessId: string,
  pipelineId: string,
): Promise<PipelineDetailView | null> {
  const repo = createPipelineRepository(client);
  const { data: pipeline } = await repo.getPipeline(pipelineId, businessId);
  if (!pipeline) return null;

  const [stagesRes, autoRes, workflowsRes, contactsRes] = await Promise.all([
    repo.listStages(pipelineId, businessId),
    repo.listStageAutomations(pipelineId, businessId),
    repo.listWorkflowsForPipeline(pipelineId, businessId),
    repo.countContactsByStage(pipelineId, businessId),
  ]);

  const contactCountByStage: Record<string, number> = {};
  for (const c of contactsRes.data ?? []) {
    const sid = c.pipeline_stage_id as string | null;
    if (sid) contactCountByStage[sid] = (contactCountByStage[sid] ?? 0) + 1;
  }

  return {
    pipeline: pipeline as PipelineRow,
    stages: (stagesRes.data ?? []) as PipelineStageRow[],
    stageAutomations: (autoRes.data ?? []) as PipelineStageAutomationRow[],
    workflows: (workflowsRes.data ?? []) as DiazitesWorkflowRow[],
    contactCountByStage,
  };
}

export async function createPipelineWithDefaults(
  client: SupabaseClient,
  businessId: string,
  name: string,
  attachStarterWorkflow = true,
): Promise<ServiceResult<{ pipelineId: string }>> {
  const repo = createPipelineRepository(client);
  const { data: existing } = await repo.listPipelines(businessId);
  const isFirst = (existing ?? []).length === 0;

  const { data: pipeline, error } = await repo.createPipeline({
    businessId,
    name,
    description: "Native sales pipeline — attach workflows per stage like GoHighLevel.",
    isDefault: isFirst,
  });
  if (error || !pipeline) return fail(error?.message ?? "Failed to create pipeline");

  for (let i = 0; i < DEFAULT_PIPELINE_STAGES.length; i++) {
    const s = DEFAULT_PIPELINE_STAGES[i]!;
    await repo.createStage({
      businessId,
      pipelineId: pipeline.id,
      name: s.name,
      sortOrder: i,
      stageType: s.stageType,
      color: s.color,
    });
  }

  if (attachStarterWorkflow) {
    const tpl = SYSTEM_WORKFLOW_TEMPLATES.find((t) => t.slug === "new-lead-follow-up");
    const workflows = createWorkflowRepository(client);
    if (tpl) {
      const { data: wf } = await workflows.create({
        businessId,
        name: tpl.name,
        description: tpl.description,
        definition: tpl.definition,
        triggerType: "new_lead_created",
        pipelineId: pipeline.id,
      });
      const { data: stages } = await repo.listStages(pipeline.id, businessId);
      const newLeadStage = stages?.find((st) => st.name === "New Lead");
      if (wf && newLeadStage) {
        await client
          .from("diazites_workflows")
          .update({
            pipeline_stage_id: newLeadStage.id,
            trigger_type: "pipeline_stage_changed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", wf.id);
        await repo.createStageAutomation({
          businessId,
          pipelineId: pipeline.id,
          pipelineStageId: newLeadStage.id,
          name: tpl.name,
          automationType: "enroll_workflow",
          workflowId: wf.id,
          config: { trigger: "on_stage_enter" },
        });
      }
    }
  }

  return ok({ pipelineId: pipeline.id });
}
