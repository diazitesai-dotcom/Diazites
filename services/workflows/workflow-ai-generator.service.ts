import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { WorkflowDefinition } from "@/types/diazites-platform";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import { isOpenAiConfigured, callJsonResponses } from "@/services/engine/ai/openai-client";
import { SYSTEM_WORKFLOW_TEMPLATES } from "@/lib/workflows/workflow-templates";

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(["trigger", "condition", "action", "wait", "branch"]),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  config: z.record(z.string(), z.unknown()),
});

const aiWorkflowSchema = z.object({
  name: z.string(),
  description: z.string(),
  triggerType: z.string(),
  nodes: z.array(nodeSchema).min(2),
  edges: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
    }),
  ),
  emailSubject: z.string().optional(),
});

function fallbackFromPrompt(prompt: string): z.infer<typeof aiWorkflowSchema> {
  const tpl = SYSTEM_WORKFLOW_TEMPLATES[0]!;
  return {
    name: "AI Follow-Up Pipeline",
    description: prompt.slice(0, 200),
    triggerType: "new_lead_created",
    nodes: tpl.definition.nodes,
    edges: tpl.definition.edges,
    emailSubject: "Thanks for your interest",
  };
}

export async function generateWorkflowFromPrompt(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  prompt: string,
): Promise<
  ServiceResult<{
    name: string;
    description: string;
    definition: WorkflowDefinition;
    triggerType: string;
  }>
> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  let parsed: z.infer<typeof aiWorkflowSchema>;
  if (isOpenAiConfigured()) {
    const result = await callJsonResponses({
      supabase: client,
      businessId,
      purpose: "workflow_ai_builder",
      schema: aiWorkflowSchema,
      system:
        "You build visual automation workflows for Diazites native CRM. Return nodes with x,y layout left-to-right.",
      prompt: `Business: ${business.name}\nUser request: "${prompt}"\n\nInclude trigger, waits, if/else branches, email, pipeline moves, tasks, and AI agent steps as appropriate.`,
    });
    parsed = result.success ? result.data : fallbackFromPrompt(prompt);
  } else {
    parsed = fallbackFromPrompt(prompt);
  }

  const definition: WorkflowDefinition = {
    nodes: parsed.nodes,
    edges: parsed.edges,
  };

  const workflows = createWorkflowRepository(client);
  const { data, error } = await workflows.create({
    businessId,
    name: parsed.name,
    description: parsed.description,
    definition,
    triggerType: parsed.triggerType,
  });

  if (error || !data) return fail(error?.message ?? "Failed to save workflow");

  return ok({
    name: parsed.name,
    description: parsed.description,
    definition,
    triggerType: parsed.triggerType,
  });
}
