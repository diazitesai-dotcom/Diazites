"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createEmailCampaignRepository } from "@/repositories/email-campaign.repository";
import {
  generateEmailCampaignContent,
  sendEmailCampaign,
} from "@/services/comms/email-campaign.service";

async function resolveContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { supabase, businessId: business.id, businessName: business.name };
}

export async function createEmailAudienceAction(input: {
  name: string;
  description?: string;
  syncFromCrm?: boolean;
}): Promise<ServiceResult<{ id: string; memberCount: number }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createEmailCampaignRepository(ctx.supabase);
  const { data, error } = await repo.createAudience({
    businessId: ctx.businessId,
    name: input.name.trim(),
    description: input.description,
  });
  if (error || !data) return fail(error?.message ?? "Failed to create audience");

  let memberCount = 0;
  if (input.syncFromCrm) {
    const sync = await repo.syncAudienceFromContacts(data.id, ctx.businessId);
    memberCount = sync.count;
  }

  revalidatePath("/dashboard/email-campaigns");
  return ok({ id: data.id, memberCount });
}

export async function syncEmailAudienceAction(audienceId: string): Promise<ServiceResult<{ count: number }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createEmailCampaignRepository(ctx.supabase);
  const sync = await repo.syncAudienceFromContacts(audienceId, ctx.businessId);
  revalidatePath("/dashboard/email-campaigns");
  return ok({ count: sync.count });
}

export async function createEmailTemplateAction(input: {
  name: string;
  subject: string;
  htmlBody: string;
  plainTextBody?: string;
  previewText?: string;
}): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createEmailCampaignRepository(ctx.supabase);
  const { data, error } = await repo.createTemplate({
    businessId: ctx.businessId,
    name: input.name.trim(),
    subject: input.subject.trim(),
    htmlBody: input.htmlBody,
    plainTextBody: input.plainTextBody,
    previewText: input.previewText,
  });
  if (error || !data) return fail(error?.message ?? "Failed to create template");

  revalidatePath("/dashboard/email-campaigns");
  return ok({ id: data.id });
}

export async function generateEmailWithAiAction(
  prompt: string,
): Promise<ServiceResult<{ subject: string; previewText: string; htmlBody: string; plainTextBody: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!prompt.trim()) return fail("Describe your email campaign");

  return generateEmailCampaignContent(ctx.supabase, ctx.businessId, ctx.businessName, prompt);
}

export async function createEmailCampaignAction(input: {
  name: string;
  subject: string;
  htmlBody: string;
  plainTextBody?: string;
  audienceId?: string;
  templateId?: string;
  previewText?: string;
  fromName?: string;
}): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createEmailCampaignRepository(ctx.supabase);
  const { data, error } = await repo.createCampaign({
    businessId: ctx.businessId,
    name: input.name.trim(),
    subject: input.subject.trim(),
    htmlBody: input.htmlBody,
    plainTextBody: input.plainTextBody,
    audienceId: input.audienceId,
    templateId: input.templateId,
    previewText: input.previewText,
    fromName: input.fromName ?? ctx.businessName,
  });
  if (error || !data) return fail(error?.message ?? "Failed to create campaign");

  revalidatePath("/dashboard/email-campaigns");
  return ok({ id: data.id });
}

export async function sendEmailCampaignAction(campaignId: string): Promise<ServiceResult<{ sent: number; failed: number }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const result = await sendEmailCampaign(ctx.supabase, ctx.businessId, campaignId, ctx.businessName);
  if (result.success) revalidatePath("/dashboard/email-campaigns");
  return result;
}

export async function scheduleEmailCampaignAction(
  campaignId: string,
  scheduledAt: string,
): Promise<ServiceResult<void>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createEmailCampaignRepository(ctx.supabase);
  const { error } = await repo.updateCampaign(campaignId, ctx.businessId, {
    status: "scheduled",
    scheduled_at: scheduledAt,
  } as never);
  if (error) return fail(error.message);

  revalidatePath("/dashboard/email-campaigns");
  return ok(undefined);
}
