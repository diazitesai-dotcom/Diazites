"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAiTextRepository } from "@/repositories/ai-text.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { sendSmsCampaign } from "@/services/comms/sms-campaign.service";
import { isOpenAiConfigured, callJsonResponses } from "@/services/engine/ai/openai-client";

const textAgentSchema = z.object({
  name: z.string(),
  objective: z.string(),
  openingMessage: z.string(),
  followUpMessages: z.array(z.string()).min(1),
  tone: z.string(),
  stopOnReply: z.boolean(),
});

async function resolveContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { supabase, businessId: business.id, businessName: business.name };
}

export async function createAiTextAgentAction(input: {
  name: string;
  objective: string;
}): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!input.name.trim() || !input.objective.trim()) {
    return fail("Name and objective are required");
  }

  const repo = createAiTextRepository(ctx.supabase);
  const { data, error } = await repo.createAgent({
    businessId: ctx.businessId,
    name: input.name.trim(),
    objective: input.objective.trim(),
  });
  if (error || !data) return fail(error?.message ?? "Failed to create agent");

  revalidatePath("/dashboard/ai-text");
  return ok({ id: data.id });
}

export async function generateAiTextSystemAction(
  prompt: string,
): Promise<ServiceResult<{ agentName: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!prompt.trim()) return fail("Describe your SMS automation goal");

  let plan = {
    name: "AI Text Agent",
    objective: prompt.slice(0, 300),
    openingMessage: `Hi! This is ${ctx.businessName}. Thanks for connecting with us.`,
    followUpMessages: ["Just checking in — any questions we can help with?"],
    tone: "friendly",
    stopOnReply: true,
  };

  if (isOpenAiConfigured()) {
    const ai = await callJsonResponses({
      supabase: ctx.supabase,
      businessId: ctx.businessId,
      purpose: "ai_text_auto_builder",
      schema: textAgentSchema,
      system: "You design SMS/text agents for CRM follow-up inside Diazites.",
      prompt: `Business: ${ctx.businessName}\nGoal: "${prompt}"`,
    });
    if (ai.success) plan = { ...plan, ...ai.data };
  }

  const repo = createAiTextRepository(ctx.supabase);
  const { data, error } = await repo.createAgent({
    businessId: ctx.businessId,
    name: plan.name,
    objective: plan.objective,
    personaConfig: { tone: plan.tone, stopOnReply: plan.stopOnReply },
    scriptConfig: {
      openingMessage: plan.openingMessage,
      followUpMessages: plan.followUpMessages,
      generatedFrom: prompt,
    },
  });
  if (error || !data) return fail(error?.message ?? "Failed to save agent");

  revalidatePath("/dashboard/ai-text");
  return ok({ agentName: plan.name });
}

export async function updateAiTextAgentStatusAction(
  agentId: string,
  status: "draft" | "active" | "paused" | "archived",
): Promise<ServiceResult<void>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createAiTextRepository(ctx.supabase);
  const { error } = await repo.updateAgent(agentId, ctx.businessId, { status });
  if (error) return fail(error.message);

  revalidatePath("/dashboard/ai-text");
  return ok(undefined);
}

export async function createSmsCampaignAction(input: {
  name: string;
  messageBody: string;
  aiTextAgentId?: string;
}): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!input.name.trim() || !input.messageBody.trim()) {
    return fail("Campaign name and message are required");
  }

  const repo = createAiTextRepository(ctx.supabase);
  const { data, error } = await repo.createCampaign({
    businessId: ctx.businessId,
    name: input.name.trim(),
    messageBody: input.messageBody.trim(),
    aiTextAgentId: input.aiTextAgentId,
  });
  if (error || !data) return fail(error?.message ?? "Failed to create campaign");

  revalidatePath("/dashboard/ai-text");
  return ok({ id: data.id });
}

export async function sendSmsCampaignAction(campaignId: string): Promise<ServiceResult<{ sent: number; failed: number }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const result = await sendSmsCampaign(ctx.supabase, ctx.businessId, campaignId);
  if (result.success) revalidatePath("/dashboard/ai-text");
  return result;
}

export async function sendTestSmsAction(input: {
  phone: string;
  body: string;
}): Promise<ServiceResult<{ ok: boolean }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const { sendSms } = await import("@/services/sms/sms.service");
  const result = await sendSms({ to: input.phone, body: input.body });
  if (!result.ok) return fail(result.detail ?? "SMS send failed");
  return ok({ ok: true });
}
