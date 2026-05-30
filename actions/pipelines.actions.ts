"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createPipelineRepository } from "@/repositories/pipeline.repository";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import { moveContactToPipelineStage } from "@/services/pipelines/contact-pipeline.service";
import {
  createPipelineWithDefaults,
  loadPipelineDetail,
} from "@/services/pipelines/pipeline.service";

const REVALIDATE = ["/dashboard/automations", "/dashboard/automations/pipelines", "/dashboard/workflows"];

function revalidateAutomations() {
  for (const p of REVALIDATE) revalidatePath(p);
}

async function resolveContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { supabase, businessId: business.id };
}

export async function createPipelineAction(
  name: string,
): Promise<ServiceResult<{ pipelineId: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!name.trim()) return fail("Pipeline name is required");

  const result = await createPipelineWithDefaults(ctx.supabase, ctx.businessId, name.trim());
  if (result.success) revalidateAutomations();
  return result;
}

export async function deletePipelineAction(pipelineId: string): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createPipelineRepository(ctx.supabase);
  const { error } = await repo.deletePipeline(pipelineId, ctx.businessId);
  if (error) return fail(error.message);
  revalidateAutomations();
  return ok({ ok: true });
}

export async function addPipelineStageAction(input: {
  pipelineId: string;
  name: string;
}): Promise<ServiceResult<{ stageId: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!input.name.trim()) return fail("Stage name is required");

  const repo = createPipelineRepository(ctx.supabase);
  const { data: stages } = await repo.listStages(input.pipelineId, ctx.businessId);
  const sortOrder = stages?.length ?? 0;

  const { data, error } = await repo.createStage({
    businessId: ctx.businessId,
    pipelineId: input.pipelineId,
    name: input.name.trim(),
    sortOrder,
  });
  if (error || !data) return fail(error?.message ?? "Failed to add stage");
  revalidatePath(`/dashboard/automations/pipelines/${input.pipelineId}`);
  revalidateAutomations();
  return ok({ stageId: data.id });
}

export async function deletePipelineStageAction(
  stageId: string,
  pipelineId: string,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createPipelineRepository(ctx.supabase);
  const { error } = await repo.deleteStage(stageId, ctx.businessId);
  if (error) return fail(error.message);
  revalidatePath(`/dashboard/automations/pipelines/${pipelineId}`);
  revalidateAutomations();
  return ok({ ok: true });
}

export async function attachWorkflowToStageAction(input: {
  pipelineId: string;
  stageId: string;
  workflowId: string;
}): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const detail = await loadPipelineDetail(ctx.supabase, ctx.businessId, input.pipelineId);
  if (!detail) return fail("Pipeline not found");

  const wfRepo = createWorkflowRepository(ctx.supabase);
  const { data: wf, error: wfErr } = await wfRepo.update(input.workflowId, ctx.businessId, {
    trigger_type: "pipeline_stage_changed",
  });
  if (wfErr || !wf) return fail(wfErr?.message ?? "Workflow not found");

  await ctx.supabase
    .from("diazites_workflows")
    .update({
      pipeline_id: input.pipelineId,
      pipeline_stage_id: input.stageId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.workflowId)
    .eq("business_id", ctx.businessId);

  const pipeRepo = createPipelineRepository(ctx.supabase);
  await pipeRepo.createStageAutomation({
    businessId: ctx.businessId,
    pipelineId: input.pipelineId,
    pipelineStageId: input.stageId,
    name: wf.name,
    automationType: "enroll_workflow",
    workflowId: input.workflowId,
    config: { trigger: "on_stage_enter" },
  });

  revalidatePath(`/dashboard/automations/pipelines/${input.pipelineId}`);
  revalidateAutomations();
  return ok({ ok: true });
}

export async function addStageAutomationAction(input: {
  pipelineId: string;
  stageId: string;
  name: string;
  automationType: string;
  config?: Record<string, unknown>;
}): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createPipelineRepository(ctx.supabase);
  const { data, error } = await repo.createStageAutomation({
    businessId: ctx.businessId,
    pipelineId: input.pipelineId,
    pipelineStageId: input.stageId,
    name: input.name.trim(),
    automationType: input.automationType,
    config: input.config,
  });
  if (error || !data) return fail(error?.message ?? "Failed to add automation");
  revalidatePath(`/dashboard/automations/pipelines/${input.pipelineId}`);
  return ok({ id: data.id });
}

export async function moveContactToStageAction(input: {
  contactId: string;
  pipelineId: string;
  stageId: string;
}): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const result = await moveContactToPipelineStage(ctx.supabase, {
    contactId: input.contactId,
    businessId: ctx.businessId,
    pipelineId: input.pipelineId,
    stageId: input.stageId,
  });
  if (!result.success) return fail(result.error);
  revalidatePath(`/dashboard/automations/pipelines/${input.pipelineId}`);
  revalidatePath("/dashboard/leads");
  return ok({ ok: true });
}

export async function removeStageAutomationAction(
  automationId: string,
  pipelineId: string,
): Promise<ServiceResult<{ ok: true }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createPipelineRepository(ctx.supabase);
  const { error } = await repo.deleteStageAutomation(automationId, ctx.businessId);
  if (error) return fail(error.message);
  revalidatePath(`/dashboard/automations/pipelines/${pipelineId}`);
  return ok({ ok: true });
}
