import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { scoreLead, type LeadScoreBucket } from "@/lib/lead-scoring";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createLeadRepository } from "@/repositories/lead.repository";
import { createLeadEventRepository } from "@/repositories/marketing-os.repository";
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
    payload: {
      source: input.source ?? "web",
      campaignId: input.campaignId,
      landingPageId: input.landingPageId,
    },
  });

  try {
    const { createBusinessRepository: getBiz } = await import("@/repositories/business.repository");
    const { createNotificationRepository } = await import(
      "@/repositories/cross-cutting.repository"
    );
    const businesses = getBiz(client);
    const { data: biz } = await businesses.getById(input.businessId);
    const ownerUserId = (biz as { user_id?: string | null } | null)?.user_id ?? null;
    if (ownerUserId) {
      const notifications = createNotificationRepository(client);
      await notifications.create({
        userId: ownerUserId,
        businessId: input.businessId,
        kind: "new_lead",
        title: `New lead: ${input.name}`,
        body: input.source ? `From ${input.source}` : undefined,
        link: "/dashboard/leads",
      });
    }
  } catch {
    // swallow
  }

  try {
    const events = createLeadEventRepository(client);
    await events.insert({
      businessId: input.businessId,
      leadId: data.id,
      eventType: "form_submitted",
      actorType: "system",
      payload: { source: input.source ?? "web" },
    });
  } catch {
    // lead_events table may not exist until migration applied
  }

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
  phone: string;
  email: string;
  address: string;
  roofingNeed: string;
  timeline: string;
  source: string;
  campaign: string;
  status: PipelineStatus;
  notes: string;
  score: number;
  scoreBucket: LeadScoreBucket;
  createdAt: string | null;
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
      email: string | null;
      phone: string | null;
      source: string | null;
      status: PipelineStatus;
      notes: string | null;
      timeline: string | null;
      roofing_need: string | null;
      created_at: string | null;
      campaigns: unknown;
    };
    const score = scoreLead({
      email: r.email,
      phone: r.phone,
      source: r.source,
      status: r.status,
      notes: r.notes,
      timeline: r.timeline,
      roofingNeed: r.roofing_need,
      createdAt: r.created_at,
    });
    return {
      id: r.id,
      name: r.name,
      phone: r.phone ?? "",
      email: r.email ?? "",
      address: (r as { address?: string | null }).address ?? "",
      roofingNeed: r.roofing_need ?? "",
      timeline: r.timeline ?? "",
      source: r.source ?? "—",
      campaign: campaignLabel(r.campaigns),
      status: r.status,
      notes: r.notes ?? "",
      score: score.value,
      scoreBucket: score.bucket,
      createdAt: r.created_at,
    };
  });

  return ok(mapped);
}

export async function deleteLead(
  client: SupabaseClient,
  leadId: string,
  businessId: string,
  ownerUserId: string,
): Promise<ServiceResult<void>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createLeadRepository(client);
  const { data: lead } = await repo.getById(leadId);
  if (!lead || lead.business_id !== businessId) {
    return fail("Lead not found", "NOT_FOUND");
  }

  const { error } = await repo.deleteById(leadId);
  if (error) return fail(error.message);
  return ok(undefined);
}

export async function saveLead(
  client: SupabaseClient,
  leadId: string,
  businessId: string,
  ownerUserId: string,
  input: LeadUpdateInput,
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createLeadRepository(client);
  const { data: lead } = await repo.getById(leadId);
  if (!lead || lead.business_id !== businessId) {
    return fail("Lead not found", "NOT_FOUND");
  }

  const { data, error } = await repo.updateFields(leadId, input);
  if (error || !data) return fail(error?.message ?? "Save failed");

  if (input.status && input.status !== lead.status) {
    await triggerEvent(client, {
      type: EVENT_TYPES.LEAD_STATUS_CHANGED,
      businessId,
      leadId,
      payload: { status: input.status },
    });
  }

  return ok(data);
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
