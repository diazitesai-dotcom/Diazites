import type { SupabaseClient } from "@supabase/supabase-js";

import { LEAD_STATUS_TO_STAGE_NAME } from "@/lib/pipelines/lead-stage-map";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createPipelineRepository } from "@/repositories/pipeline.repository";
import { EVENT_TYPES } from "@/types/backend";
import type { PipelineStatus } from "@/types/domain";

import { dispatchAutomationRules } from "@/services/automation/dispatch-automations.service";
import { triggerEvent } from "@/services/events/event-dispatcher";

import {
  runStageAutomationsForContact,
  type ContactPipelineContext,
} from "./pipeline-stage-runtime.service";

export type { ContactPipelineContext };

async function loadContact(
  client: SupabaseClient,
  contactId: string,
  businessId: string,
): Promise<ContactPipelineContext | null> {
  const { data } = await client
    .from("contacts")
    .select("id, business_id, lead_id, name, email, phone, pipeline_id, pipeline_stage_id")
    .eq("id", contactId)
    .eq("business_id", businessId)
    .maybeSingle();
  return data as ContactPipelineContext | null;
}

/**
 * Ensures a CRM contact exists for a lead (for pipeline + workflow enrollment).
 */
export async function ensureContactForLead(
  client: SupabaseClient,
  businessId: string,
  leadId: string,
): Promise<ContactPipelineContext | null> {
  const { data: existing } = await client
    .from("contacts")
    .select("id, business_id, lead_id, name, email, phone, pipeline_id, pipeline_stage_id")
    .eq("business_id", businessId)
    .eq("lead_id", leadId)
    .maybeSingle();

  if (existing) return existing as ContactPipelineContext;

  const { data: lead } = await client
    .from("leads")
    .select("id, business_id, name, email, phone, source")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return null;

  const { data: created, error } = await client
    .from("contacts")
    .insert({
      business_id: businessId,
      lead_id: leadId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source ?? "lead",
    })
    .select("id, business_id, lead_id, name, email, phone, pipeline_id, pipeline_stage_id")
    .single();

  if (error || !created) {
    console.error("[ensureContactForLead]", error?.message);
    return null;
  }

  return created as ContactPipelineContext;
}

async function resolveDefaultPipeline(
  client: SupabaseClient,
  businessId: string,
): Promise<{ pipelineId: string; stageId: string } | null> {
  const repo = createPipelineRepository(client);
  const { data: pipelines } = await repo.listPipelines(businessId);
  const list = pipelines ?? [];
  const pipeline = list.find((p) => p.is_default) ?? list[0];
  if (!pipeline) return null;

  const { data: stages } = await repo.listStages(pipeline.id, businessId);
  const first = stages?.[0];
  if (!first) return null;
  return { pipelineId: pipeline.id, stageId: first.id };
}

async function resolveStageByName(
  client: SupabaseClient,
  businessId: string,
  pipelineId: string,
  stageName: string,
): Promise<string | null> {
  const { data } = await client
    .from("pipeline_stages")
    .select("id")
    .eq("business_id", businessId)
    .eq("pipeline_id", pipelineId)
    .ilike("name", stageName)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Moves a contact to a pipeline stage and runs stage-entry automations at runtime.
 */
export async function moveContactToPipelineStage(
  client: SupabaseClient,
  input: {
    contactId: string;
    businessId: string;
    pipelineId: string;
    stageId: string;
    depth?: number;
    skipAutomations?: boolean;
  },
): Promise<ServiceResult<{ previousStageId: string | null }>> {
  const contact = await loadContact(client, input.contactId, input.businessId);
  if (!contact) return fail("Contact not found", "NOT_FOUND");

  if (
    contact.pipeline_id === input.pipelineId &&
    contact.pipeline_stage_id === input.stageId
  ) {
    return ok({ previousStageId: input.stageId });
  }

  const previousStageId = contact.pipeline_stage_id;

  const { error } = await client
    .from("contacts")
    .update({
      pipeline_id: input.pipelineId,
      pipeline_stage_id: input.stageId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.contactId)
    .eq("business_id", input.businessId);

  if (error) return fail(error.message);

  const updated: ContactPipelineContext = {
    ...contact,
    pipeline_id: input.pipelineId,
    pipeline_stage_id: input.stageId,
  };

  if (!input.skipAutomations) {
    await runStageAutomationsForContact(client, {
      businessId: input.businessId,
      contact: updated,
      pipelineId: input.pipelineId,
      stageId: input.stageId,
      depth: input.depth ?? 0,
    });

    await triggerEvent(client, {
      type: EVENT_TYPES.PIPELINE_STAGE_ENTERED,
      businessId: input.businessId,
      leadId: contact.lead_id ?? undefined,
      payload: {
        contactId: input.contactId,
        pipelineId: input.pipelineId,
        stageId: input.stageId,
        previousStageId,
      },
    });

    await dispatchAutomationRules(client, {
      type: EVENT_TYPES.PIPELINE_STAGE_ENTERED,
      businessId: input.businessId,
      leadId: contact.lead_id ?? undefined,
      payload: {
        contactId: input.contactId,
        pipelineId: input.pipelineId,
        stageId: input.stageId,
        previousStageId,
      },
    });
  }

  return ok({ previousStageId });
}

/**
 * Syncs a lead's kanban status to the matching native pipeline stage and runs automations.
 */
export async function syncLeadToPipelineStage(
  client: SupabaseClient,
  businessId: string,
  leadId: string,
  status: PipelineStatus,
): Promise<void> {
  const contact = await ensureContactForLead(client, businessId, leadId);
  if (!contact) return;

  const defaultPipe = await resolveDefaultPipeline(client, businessId);
  if (!defaultPipe) return;

  const stageName = LEAD_STATUS_TO_STAGE_NAME[status];
  const stageId =
    (await resolveStageByName(client, businessId, defaultPipe.pipelineId, stageName)) ??
    defaultPipe.stageId;

  await moveContactToPipelineStage(client, {
    contactId: contact.id,
    businessId,
    pipelineId: defaultPipe.pipelineId,
    stageId,
  });
}

/** Move contact to first stage matching a name pattern (e.g. `%paid%`). */
export async function moveContactToStageByNamePattern(
  client: SupabaseClient,
  businessId: string,
  contactId: string,
  namePattern: string,
): Promise<boolean> {
  const { data: stage } = await client
    .from("pipeline_stages")
    .select("id, pipeline_id")
    .eq("business_id", businessId)
    .ilike("name", namePattern)
    .limit(1)
    .maybeSingle();

  if (!stage) return false;

  const result = await moveContactToPipelineStage(client, {
    contactId,
    businessId,
    pipelineId: stage.pipeline_id,
    stageId: stage.id,
  });
  return result.success;
}

/** Tries patterns in order until a matching stage is found. */
export async function moveContactToStageByNamePatterns(
  client: SupabaseClient,
  businessId: string,
  contactId: string,
  patterns: string[],
): Promise<void> {
  for (const pattern of patterns) {
    const moved = await moveContactToStageByNamePattern(client, businessId, contactId, pattern);
    if (moved) return;
  }
}
