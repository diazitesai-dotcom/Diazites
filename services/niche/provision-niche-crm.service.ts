import type { SupabaseClient } from "@supabase/supabase-js";

import { detectNiche } from "@/lib/niche/detect-niche";
import { getNicheBlueprint } from "@/lib/niche/blueprints";
import type { NicheProvisionInput, NicheProvisionResult, NicheWorkflowDef } from "@/lib/niche/types";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createPipelineRepository } from "@/repositories/pipeline.repository";
import { createTaskRepository } from "@/repositories/task.repository";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import { SYSTEM_WORKFLOW_TEMPLATES } from "@/lib/workflows/workflow-templates";

function collectWorkflowDefs(
  blueprint: ReturnType<typeof getNicheBlueprint>,
): NicheWorkflowDef[] {
  const fromSystem = SYSTEM_WORKFLOW_TEMPLATES.filter((t) =>
    blueprint.systemWorkflowSlugs.includes(t.slug),
  ).map((t) => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: t.category,
    triggerType: String(t.definition.nodes[0]?.config?.triggerType ?? "new_lead_created"),
    definition: t.definition,
  }));
  const bySlug = new Map<string, NicheWorkflowDef>();
  for (const wf of [...blueprint.workflows, ...fromSystem]) {
    bySlug.set(wf.slug, wf);
  }
  return [...bySlug.values()];
}

/**
 * Provisions niche-optimized pipelines, stage automations, workflows, tags, and tasks.
 * Idempotent: skips if the business already has pipelines.
 */
export async function provisionNicheCrmSystem(
  client: SupabaseClient,
  businessId: string,
  input: NicheProvisionInput,
): Promise<ServiceResult<NicheProvisionResult>> {
  const pipelines = createPipelineRepository(client);
  const { data: existing } = await pipelines.listPipelines(businessId);
  if ((existing ?? []).length > 0) {
    const { nicheId, displayName } = detectNiche(input);
    return ok({
      nicheId,
      displayName,
      pipelineNames: (existing ?? []).map((p) => String((p as { name: string }).name)),
      workflowNames: [],
      tagCount: 0,
      taskCount: 0,
    });
  }

  const { nicheId, displayName } = detectNiche(input);
  const blueprint = getNicheBlueprint(nicheId);
  const workflowDefs = collectWorkflowDefs(blueprint);
  const workflowIdBySlug = new Map<string, string>();
  const workflowNames: string[] = [];
  const pipelineNames: string[] = [];

  await client.from("workflow_templates").upsert(
    SYSTEM_WORKFLOW_TEMPLATES.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      definition: t.definition,
      is_system: true,
    })),
    { onConflict: "slug" },
  );

  const workflows = createWorkflowRepository(client);
  let defaultPipelineId: string | null = null;

  for (const wfDef of workflowDefs) {
    const { data: wf, error: wfError } = await workflows.create({
      businessId,
      name: wfDef.name,
      description: wfDef.description,
      definition: wfDef.definition,
      triggerType: wfDef.triggerType,
      pipelineId: null,
    });
    if (wfError || !wf) continue;
    workflowIdBySlug.set(wfDef.slug, wf.id);
    workflowNames.push(wfDef.name);
  }

  for (const pipeDef of blueprint.pipelines) {
    const pipelineLabel =
      pipeDef.isDefault && pipeDef.name === "Sales Pipeline"
        ? `${displayName} Sales Pipeline`
        : pipeDef.name.includes("Pipeline") || pipeDef.name.includes("pipeline")
          ? pipeDef.name
          : `${displayName} ${pipeDef.name}`;

    const { data: pipeline, error: pipeError } = await pipelines.createPipeline({
      businessId,
      name: pipelineLabel,
      description: pipeDef.description,
      isDefault: pipeDef.isDefault ?? false,
    });
    if (pipeError || !pipeline) {
      return fail(pipeError?.message ?? "Failed to create pipeline");
    }
    pipelineNames.push(pipelineLabel);
    if (pipeDef.isDefault) defaultPipelineId = pipeline.id;

    const stageIdByName = new Map<string, string>();
    const newLeadStageNames = ["New Lead", "New Inquiry", "New Intake", "New Donor Lead", "Catering Inquiry"];

    for (let i = 0; i < pipeDef.stages.length; i++) {
      const stage = pipeDef.stages[i]!;
      const { data: stageRow, error: stageError } = await pipelines.createStage({
        businessId,
        pipelineId: pipeline.id,
        name: stage.name,
        sortOrder: i,
        stageType: stage.stageType,
        color: stage.color,
      });
      if (stageError || !stageRow) continue;
      stageIdByName.set(stage.name, stageRow.id);

      for (const auto of stage.automations ?? []) {
        await pipelines.createStageAutomation({
          businessId,
          pipelineId: pipeline.id,
          pipelineStageId: stageRow.id,
          name: auto.name,
          automationType: auto.automationType,
          workflowId: auto.workflowSlug ? workflowIdBySlug.get(auto.workflowSlug) ?? null : null,
          config: auto.config ?? {},
        });
      }
    }

    if (pipeDef.isDefault && defaultPipelineId) {
      const growthWfId = workflowIdBySlug.get("niche-automated-growth");
      const newLeadStageId = newLeadStageNames
        .map((n) => stageIdByName.get(n))
        .find(Boolean);
      if (growthWfId && newLeadStageId) {
        await client
          .from("diazites_workflows")
          .update({
            pipeline_id: pipeline.id,
            pipeline_stage_id: newLeadStageId,
            status: "active",
          })
          .eq("id", growthWfId)
          .eq("business_id", businessId);
      }
      for (const [slug, wfId] of workflowIdBySlug) {
        if (slug === "niche-automated-growth") continue;
        await client
          .from("diazites_workflows")
          .update({ pipeline_id: pipeline.id })
          .eq("id", wfId)
          .eq("business_id", businessId)
          .is("pipeline_id", null);
      }
    }
  }

  for (const tagName of blueprint.tags) {
    await client.from("tags").upsert(
      { business_id: businessId, name: tagName },
      { onConflict: "business_id,name" },
    );
  }

  const tasks = createTaskRepository(client);
  const { count } = await tasks.countPending(businessId);
  let taskCount = 0;
  if (!count || count === 0) {
    for (const task of blueprint.seedTasks) {
      await tasks.insert({
        businessId,
        title: task.title,
        sourceAgent: task.sourceAgent ?? "workflow",
        priority: task.priority,
        status: "pending",
      });
      taskCount += 1;
    }
  }

  const { data: business } = await client
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .maybeSingle();

  await client.from("ai_calling_agents").insert({
    business_id: businessId,
    name: "Appointment Setter",
    objective: blueprint.callingObjective,
    status: "draft",
    script_config: {
      greeting: `Hi, this is ${business?.name ?? "our team"}. How can I help you today?`,
      qualificationQuestions: [
        "What service are you interested in?",
        "When works best for a quick call?",
      ],
      bookingLogic: "Offer the next available appointment slot",
    },
  });

  const { data: project } = await client
    .from("projects")
    .insert({ business_id: businessId, name: blueprint.projectBoardName })
    .select("*")
    .single();

  if (project) {
    await client.from("project_boards").insert({
      business_id: businessId,
      project_id: project.id,
      name: "Main board",
      board_type: "kanban",
    });
  }

  return ok({
    nicheId,
    displayName,
    pipelineNames,
    workflowNames,
    tagCount: blueprint.tags.length,
    taskCount,
  });
}
