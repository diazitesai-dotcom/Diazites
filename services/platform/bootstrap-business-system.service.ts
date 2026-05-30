import type { SupabaseClient } from "@supabase/supabase-js";

import { SYSTEM_WORKFLOW_TEMPLATES } from "@/lib/workflows/workflow-templates";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import { isOpenAiConfigured, callJsonResponses } from "@/services/engine/ai/openai-client";
import { z } from "zod";

const bootstrapSchema = z.object({
  pipelineName: z.string(),
  stages: z.array(z.string()).min(3),
  tags: z.array(z.string()).min(2),
  workflowSlugs: z.array(z.string()).min(1),
  callingObjective: z.string(),
  projectBoardName: z.string(),
});

export async function bootstrapBusinessSystem(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  userGoal: string,
): Promise<ServiceResult<{ message: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  let plan = {
    pipelineName: "Sales Pipeline",
    stages: ["New Lead", "Contacted", "Qualified", "Appointment Booked", "Won", "Lost"],
    tags: ["New Lead", "Hot Lead", "Follow-Up"],
    workflowSlugs: ["new-lead-follow-up", "missed-call-text-back"],
    callingObjective: "Book appointments and qualify inbound leads",
    projectBoardName: "Sales Operations",
  };

  if (isOpenAiConfigured()) {
    const ai = await callJsonResponses({
      supabase: client,
      businessId,
      purpose: "bootstrap_business_system",
      schema: bootstrapSchema,
      system: "You design native CRM and automation systems for small businesses.",
      prompt: `Business: ${business.name}
User goal: "${userGoal}"

Return pipeline name, 5-6 stage names, 3-5 tags, workflow template slugs from: new-lead-follow-up, missed-call-text-back, appointment-reminder, ai-call-follow-up, calling objective, and a project board name.`,
    });
    if (ai.success) plan = { ...plan, ...ai.data };
  }

  const { data: pipeline, error: pipeError } = await client
    .from("pipelines")
    .insert({
      business_id: businessId,
      name: plan.pipelineName,
      description: `AI-generated for: ${userGoal.slice(0, 120)}`,
      is_default: true,
    })
    .select("*")
    .single();

  if (pipeError || !pipeline) return fail(pipeError?.message ?? "Pipeline create failed");

  for (let i = 0; i < plan.stages.length; i++) {
    const name = plan.stages[i]!;
    await client.from("pipeline_stages").insert({
      business_id: businessId,
      pipeline_id: pipeline.id,
      name,
      sort_order: i,
      stage_type: name.toLowerCase().includes("won")
        ? "won"
        : name.toLowerCase().includes("lost")
          ? "lost"
          : "open",
    });
  }

  for (const tagName of plan.tags) {
    await client.from("tags").upsert(
      { business_id: businessId, name: tagName },
      { onConflict: "business_id,name" },
    );
  }

  const workflows = createWorkflowRepository(client);
  for (const slug of plan.workflowSlugs) {
    const tpl = SYSTEM_WORKFLOW_TEMPLATES.find((t) => t.slug === slug);
    if (!tpl) continue;
    await workflows.create({
      businessId,
      name: tpl.name,
      description: tpl.description,
      definition: tpl.definition,
      triggerType: String(tpl.definition.nodes[0]?.config?.triggerType ?? "new_lead_created"),
      pipelineId: pipeline.id,
    });
  }

  await client.from("ai_calling_agents").insert({
    business_id: businessId,
    name: "Appointment Setter",
    objective: plan.callingObjective,
    status: "draft",
    script_config: {
      greeting: `Hi, this is ${business.name}. How can I help you today?`,
      qualificationQuestions: ["What service are you interested in?", "When works best for a call?"],
      bookingLogic: "Offer next available appointment slot",
    },
  });

  const { data: project } = await client
    .from("projects")
    .insert({ business_id: businessId, name: plan.projectBoardName })
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

  return ok({
    message: `Created pipeline "${plan.pipelineName}", ${plan.workflowSlugs.length} workflows, tags, AI calling agent, and project board.`,
  });
}
