import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createLeadRepository } from "@/repositories/lead.repository";
import type { LeadCreateInput, LeadUpdateInput } from "@/types/backend";
import { EVENT_TYPES } from "@/types/backend";
import type { PipelineStatus } from "@/types/domain";

import { runLeadCreatedAutomation } from "@/services/leads/lead-automation.service";
import { triggerEvent } from "@/services/events/event-dispatcher";

export async function createLead(
  client: SupabaseClient,
  input: LeadCreateInput,
): Promise<ServiceResult<{ id: string }>> {
  const repo = createLeadRepository(client);
  const { data, error } = await repo.create(input);

  if (error || !data) {
    return fail(error?.message ?? "Failed to create lead", "LEAD_CREATE_FAILED");
  }

  await triggerEvent(client, {
    type: EVENT_TYPES.LEAD_CREATED,
    businessId: input.businessId,
    leadId: data.id,
    payload: { source: input.source ?? "web", campaignId: input.campaignId },
  });

  return ok({ id: data.id });
}

export async function getLeadsByBusiness(
  client: SupabaseClient,
  businessId: string,
): Promise<ServiceResult<unknown[]>> {
  const repo = createLeadRepository(client);
  const { data, error } = await repo.listByBusiness(businessId);
  if (error) return fail(error.message);
  return ok(data ?? []);
}

export type LeadBoardRow = {
  id: string;
  name: string;
  source: string;
  campaign: string;
  status: PipelineStatus;
  notes: string;
};

export async function getLeadsForBoard(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
): Promise<ServiceResult<LeadBoardRow[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createLeadRepository(client);
  const { data, error } = await repo.listByBusinessWithCampaign(businessId);
  if (error) return fail(error.message);

  const raw = (data ?? []) as unknown[];

  const campaignLabel = (c: unknown): string => {
    if (c && typeof c === "object" && "platform" in c) {
      return String((c as { platform: string }).platform);
    }
    if (Array.isArray(c) && c[0] && typeof c[0] === "object" && "platform" in c[0]) {
      return String((c[0] as { platform: string }).platform);
    }
    return "—";
  };

  const mapped: LeadBoardRow[] = raw.map((row) => {
    const r = row as {
      id: string;
      name: string;
      source: string | null;
      status: PipelineStatus;
      notes: string | null;
      campaigns: unknown;
    };
    return {
      id: r.id,
      name: r.name,
      source: r.source ?? "—",
      campaign: campaignLabel(r.campaigns),
      status: r.status,
      notes: r.notes ?? "",
    };
  });

  return ok(mapped);
}

export async function updateLeadStatus(
  client: SupabaseClient,
  leadId: string,
  status: PipelineStatus,
  businessId: string,
): Promise<ServiceResult<unknown>> {
  const repo = createLeadRepository(client);
  const { data: lead } = await repo.getById(leadId);
  if (!lead || lead.business_id !== businessId) {
    return fail("Lead not found", "NOT_FOUND");
  }

  const { data, error } = await repo.updateStatus(leadId, status);
  if (error || !data) return fail(error?.message ?? "Update failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.LEAD_STATUS_CHANGED,
    businessId,
    leadId,
    payload: { status },
  });

  return ok(data);
}

export async function addLeadNote(
  client: SupabaseClient,
  leadId: string,
  businessId: string,
  noteLine: string,
): Promise<ServiceResult<unknown>> {
  const repo = createLeadRepository(client);
  const { data: lead } = await repo.getById(leadId);
  if (!lead || lead.business_id !== businessId) {
    return fail("Lead not found", "NOT_FOUND");
  }

  const { data, error } = await repo.appendNote(leadId, noteLine);
  if (error || !data) return fail(error?.message ?? "Failed to append note");

  await triggerEvent(client, {
    type: EVENT_TYPES.LEAD_NOTE_ADDED,
    businessId,
    leadId,
    payload: { preview: noteLine.slice(0, 120) },
  });

  return ok(data);
}

export async function updateLeadFields(
  client: SupabaseClient,
  leadId: string,
  businessId: string,
  input: LeadUpdateInput,
): Promise<ServiceResult<unknown>> {
  const repo = createLeadRepository(client);
  const { data: lead } = await repo.getById(leadId);
  if (!lead || lead.business_id !== businessId) {
    return fail("Lead not found", "NOT_FOUND");
  }

  const { data, error } = await repo.updateFields(leadId, input);
  if (error || !data) return fail(error?.message ?? "Update failed");
  return ok(data);
}

/**
 * Re-runs the AI follow-up + email path (e.g. operator retry or scheduled job).
 */
export async function triggerFollowUpSequence(
  client: SupabaseClient,
  leadId: string,
): Promise<ServiceResult<void>> {
  const repo = createLeadRepository(client);
  const { data: lead, error } = await repo.getById(leadId);
  if (error || !lead) {
    return fail("Lead not found", "NOT_FOUND");
  }

  await runLeadCreatedAutomation(client, lead.business_id, leadId);
  return ok(undefined);
}
