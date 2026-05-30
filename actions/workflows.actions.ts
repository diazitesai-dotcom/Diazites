"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import { bootstrapBusinessSystem } from "@/services/platform/bootstrap-business-system.service";
import { generateWorkflowFromPrompt } from "@/services/workflows/workflow-ai-generator.service";
import type { WorkflowDefinition } from "@/types/diazites-platform";
import { SYSTEM_WORKFLOW_TEMPLATES } from "@/lib/workflows/workflow-templates";

async function resolveContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { supabase, userId: user.id, businessId: business.id };
}

export async function generateWorkflowWithAiAction(
  prompt: string,
): Promise<ServiceResult<{ name: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!prompt.trim()) return fail("Describe the workflow you want");

  const result = await generateWorkflowFromPrompt(
    ctx.supabase,
    ctx.userId,
    ctx.businessId,
    prompt.trim(),
  );
  if (!result.success) return result;

  revalidatePath("/dashboard/workflows");
  return ok({ name: result.data.name });
}

export async function bootstrapBusinessSystemAction(
  userGoal: string,
): Promise<ServiceResult<{ message: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!userGoal.trim()) return fail("Tell us what you want your business system to do");

  const result = await bootstrapBusinessSystem(
    ctx.supabase,
    ctx.userId,
    ctx.businessId,
    userGoal.trim(),
  );
  if (!result.success) return result;

  revalidatePath("/dashboard/workflows");
  revalidatePath("/dashboard/ai-calls");
  revalidatePath("/dashboard/leads");
  return result;
}

export async function createWorkflowFromTemplateAction(
  slug: string,
): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const tpl = SYSTEM_WORKFLOW_TEMPLATES.find((t) => t.slug === slug);
  if (!tpl) return fail("Template not found");

  const repo = createWorkflowRepository(ctx.supabase);
  const { data, error } = await repo.create({
    businessId: ctx.businessId,
    name: tpl.name,
    description: tpl.description,
    definition: tpl.definition,
    triggerType: String(tpl.definition.nodes[0]?.config?.triggerType ?? "new_lead_created"),
  });
  if (error || !data) return fail(error?.message ?? "Failed to create workflow");

  revalidatePath("/dashboard/workflows");
  return ok({ id: data.id });
}

export async function updateWorkflowStatusAction(
  workflowId: string,
  status: "draft" | "active" | "paused" | "archived",
): Promise<ServiceResult<void>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createWorkflowRepository(ctx.supabase);
  const { error } = await repo.update(workflowId, ctx.businessId, { status });
  if (error) return fail(error.message);

  revalidatePath("/dashboard/workflows");
  revalidatePath(`/dashboard/workflows/${workflowId}`);
  return ok(undefined);
}

export async function saveWorkflowDefinitionAction(
  workflowId: string,
  definition: WorkflowDefinition,
  name?: string,
): Promise<ServiceResult<void>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createWorkflowRepository(ctx.supabase);
  const patch: { definition: WorkflowDefinition; name?: string } = { definition };
  if (name?.trim()) patch.name = name.trim();

  const { error } = await repo.update(workflowId, ctx.businessId, patch);
  if (error) return fail(error.message);

  revalidatePath(`/dashboard/workflows/${workflowId}`);
  return ok(undefined);
}

export async function duplicateWorkflowAction(
  workflowId: string,
): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createWorkflowRepository(ctx.supabase);
  const { data: existing, error: getErr } = await repo.getById(workflowId, ctx.businessId);
  if (getErr || !existing) return fail("Workflow not found");

  const { data, error } = await repo.create({
    businessId: ctx.businessId,
    name: `${existing.name} (copy)`,
    description: existing.description ?? undefined,
    definition: existing.definition as WorkflowDefinition,
    triggerType: existing.trigger_type ?? undefined,
    pipelineId: existing.pipeline_id,
  });
  if (error || !data) return fail(error?.message ?? "Duplicate failed");

  revalidatePath("/dashboard/workflows");
  return ok({ id: data.id });
}

export async function deleteWorkflowAction(workflowId: string): Promise<ServiceResult<void>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createWorkflowRepository(ctx.supabase);
  const { error } = await repo.delete(workflowId, ctx.businessId);
  if (error) return fail(error.message);

  revalidatePath("/dashboard/workflows");
  return ok(undefined);
}
