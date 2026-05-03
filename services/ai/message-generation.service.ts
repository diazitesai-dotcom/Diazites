import OpenAI from "openai";

import { assertRequiredEnv, env } from "@/lib/env";
import { ok, fail, type ServiceResult } from "@/lib/result";

export type LeadMessageContext = {
  leadName: string;
  leadEmail?: string | null;
  roofingNeed?: string | null;
  timeline?: string | null;
  businessName: string;
  serviceArea?: string | null;
  brandVoice?: string | null;
};

/**
 * Generates a personalized follow-up message via OpenAI Responses API.
 */
export async function generateAIMessage(
  context: LeadMessageContext,
): Promise<ServiceResult<{ body: string; model: string }>> {
  try {
    assertRequiredEnv(["OPENAI_API_KEY"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "OpenAI not configured", "AI_CONFIG");
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const model = "gpt-4.1-mini";

  const prompt = `You write concise, trustworthy emails for a roofing contractor's CRM.

Business: ${context.businessName}
Service area: ${context.serviceArea ?? "local area"}
Lead name: ${context.leadName}
Roofing need: ${context.roofingNeed ?? "roofing project"}
Timeline: ${context.timeline ?? "unspecified"}
${context.brandVoice ? `Brand voice notes: ${context.brandVoice}` : ""}

Write a short follow-up email body (plain text, no subject line).
Include a warm thank-you, one clarifying question if helpful, and a clear next step (schedule inspection / call).
Keep under 180 words.`;

  try {
    const response = await openai.responses.create({
      model,
      input: prompt,
    });

    const body = response.output_text?.trim();
    if (!body) {
      return fail("Empty model output", "AI_EMPTY");
    }

    return ok({ body, model });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "OpenAI request failed", "AI_ERROR");
  }
}
