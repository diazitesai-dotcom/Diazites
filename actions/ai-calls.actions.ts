"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAiCallsRepository } from "@/repositories/ai-calls.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { isOpenAiConfigured, callJsonResponses } from "@/services/engine/ai/openai-client";
import { z } from "zod";

const callAgentSchema = z.object({
  name: z.string(),
  objective: z.string(),
  greeting: z.string(),
  qualificationQuestions: z.array(z.string()).min(2),
  bookingLogic: z.string(),
  voiceTone: z.string(),
});

async function resolveContext() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;
  return { supabase, userId: user.id, businessId: business.id, businessName: business.name };
}

export async function createAiCallingAgentAction(input: {
  name: string;
  objective: string;
}): Promise<ServiceResult<{ id: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!input.name.trim() || !input.objective.trim()) {
    return fail("Name and objective are required");
  }

  const repo = createAiCallsRepository(ctx.supabase);
  const { data, error } = await repo.createAgent({
    businessId: ctx.businessId,
    name: input.name.trim(),
    objective: input.objective.trim(),
  });
  if (error || !data) return fail(error?.message ?? "Failed to create agent");

  revalidatePath("/dashboard/ai-calls");
  return ok({ id: data.id });
}

export async function generateAiCallingSystemAction(
  prompt: string,
): Promise<ServiceResult<{ agentName: string }>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");
  if (!prompt.trim()) return fail("Describe what your AI calling system should accomplish");

  let plan = {
    name: "AI Sales Caller",
    objective: prompt.slice(0, 300),
    greeting: `Hi, this is ${ctx.businessName}. How can I help you today?`,
    qualificationQuestions: [
      "What service are you interested in?",
      "When is a good time to connect?",
    ],
    bookingLogic: "Offer the next available appointment slot",
    voiceTone: "friendly and professional",
  };

  if (isOpenAiConfigured()) {
    const ai = await callJsonResponses({
      supabase: ctx.supabase,
      businessId: ctx.businessId,
      purpose: "ai_calling_auto_builder",
      schema: callAgentSchema,
      system: "You design native AI phone agents for small businesses inside Diazites CRM.",
      prompt: `Business: ${ctx.businessName}\nGoal: "${prompt}"\nReturn agent name, objective, greeting, qualification questions, booking logic, and voice tone.`,
    });
    if (ai.success) {
      plan = {
        name: ai.data.name,
        objective: ai.data.objective,
        greeting: ai.data.greeting,
        qualificationQuestions: ai.data.qualificationQuestions,
        bookingLogic: ai.data.bookingLogic,
        voiceTone: ai.data.voiceTone,
      };
    }
  }

  const repo = createAiCallsRepository(ctx.supabase);
  const { data, error } = await repo.createAgent({
    businessId: ctx.businessId,
    name: plan.name,
    objective: plan.objective,
    voiceConfig: { tone: plan.voiceTone, speed: 1, language: "en" },
    scriptConfig: {
      greeting: plan.greeting,
      qualificationQuestions: plan.qualificationQuestions,
      bookingLogic: plan.bookingLogic,
      generatedFrom: prompt,
    },
  });
  if (error || !data) return fail(error?.message ?? "Failed to save agent");

  revalidatePath("/dashboard/ai-calls");
  return ok({ agentName: plan.name });
}

export async function updateAiCallingAgentStatusAction(
  agentId: string,
  status: "draft" | "active" | "paused" | "archived",
): Promise<ServiceResult<void>> {
  const ctx = await resolveContext();
  if (!ctx) return fail("No business found");

  const repo = createAiCallsRepository(ctx.supabase);
  const { error } = await repo.updateAgent(agentId, ctx.businessId, { status });
  if (error) return fail(error.message);

  revalidatePath("/dashboard/ai-calls");
  return ok(undefined);
}
