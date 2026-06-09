"use server";

import { z } from "zod";

import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import { autofillCeoBusinessProfileFromWebsite } from "@/lib/ceo-command-center/business-profile-autofill";
import { createEmptyBusinessProfile } from "@/lib/ceo-command-center/business-profile-utils";
import type { OnboardingPipelineWorkflow } from "@/lib/onboarding/command-center-payload";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callJsonResponses, isOpenAiConfigured } from "@/services/engine/ai/openai-client";
import type { BusinessProfileFields, OfferGoalsFields } from "@/types/ceo-command-center";

const PipelineAiSchema = z.object({
  summary: z.string(),
  pipelineType: z.string().optional(),
  leadOwner: z.string().optional(),
  responseSpeed: z.string().optional(),
  followUpStyle: z.string().optional(),
  followUpChannels: z.array(z.string()).optional(),
  qualificationQuestions: z.string().optional(),
  bookingAction: z.string().optional(),
  lostLeadRule: z.string().optional(),
  stages: z.array(z.string()).optional(),
  automations: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        enabled: z.boolean(),
      }),
    )
    .optional(),
  followUpMessages: z
    .object({
      firstSms: z.string().optional(),
      firstEmail: z.string().optional(),
      voicemailScript: z.string().optional(),
      followUpEmail: z.string().optional(),
      finalReminder: z.string().optional(),
    })
    .optional(),
});

export async function scanBusinessProfileAction(websiteUrl: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Not signed in" };
  }

  await ensurePublicUserRecord(user.id, user.email);

  const result = await autofillCeoBusinessProfileFromWebsite(
    supabase,
    websiteUrl,
    createEmptyBusinessProfile(websiteUrl),
  );

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  return { success: true as const, data: result.data };
}

export async function editOnboardingPipelineWithAiAction(input: {
  instruction: string;
  profile: BusinessProfileFields;
  offerGoals: OfferGoalsFields;
  pipelineWorkflow: OnboardingPipelineWorkflow;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "Not signed in" };

  if (!isOpenAiConfigured()) {
    return {
      success: false as const,
      error: "AI editing requires OPENAI_API_KEY on the server. Edit stages manually for now.",
    };
  }

  const instruction = input.instruction.trim();
  if (!instruction) return { success: false as const, error: "Describe what to change." };

  const aiResult = await callJsonResponses<z.infer<typeof PipelineAiSchema>>({
    supabase,
    businessId: null,
    purpose: "onboarding.pipeline_ai_edit",
    schema: PipelineAiSchema,
    system:
      "You edit onboarding CRM pipeline configuration for a local/service business. Apply the user's instruction. Return the full updated fields you changed plus a one-sentence summary. Keep stage names concise. Automation ids should be snake_case.",
    prompt: `Business: ${input.profile.businessName}
Industry: ${input.profile.industry}
Offer: ${input.profile.mainOffer}
Goal: ${input.offerGoals.primaryGoal}

Current pipeline JSON:
${JSON.stringify(input.pipelineWorkflow, null, 2)}

User instruction: ${instruction}

Return JSON with "summary" (string) and any updated pipeline fields.`,
  });

  if (!aiResult.success) {
    return { success: false as const, error: aiResult.error };
  }

  const patch = aiResult.data;
  const next: OnboardingPipelineWorkflow = {
    ...input.pipelineWorkflow,
    ...(patch.pipelineType !== undefined ? { pipelineType: patch.pipelineType } : {}),
    ...(patch.leadOwner !== undefined ? { leadOwner: patch.leadOwner } : {}),
    ...(patch.responseSpeed !== undefined ? { responseSpeed: patch.responseSpeed } : {}),
    ...(patch.followUpStyle !== undefined ? { followUpStyle: patch.followUpStyle } : {}),
    ...(patch.followUpChannels !== undefined ? { followUpChannels: patch.followUpChannels } : {}),
    ...(patch.qualificationQuestions !== undefined
      ? { qualificationQuestions: patch.qualificationQuestions }
      : {}),
    ...(patch.bookingAction !== undefined ? { bookingAction: patch.bookingAction } : {}),
    ...(patch.lostLeadRule !== undefined ? { lostLeadRule: patch.lostLeadRule } : {}),
    ...(patch.stages !== undefined ? { stages: patch.stages } : {}),
    ...(patch.automations !== undefined ? { automations: patch.automations } : {}),
    ...(patch.followUpMessages !== undefined
      ? {
          followUpMessages: {
            ...input.pipelineWorkflow.followUpMessages,
            ...patch.followUpMessages,
          },
        }
      : {}),
  };

  return {
    success: true as const,
    data: { pipeline: next, summary: patch.summary },
  };
}
