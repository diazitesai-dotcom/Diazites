"use server";

import { z } from "zod";

import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import { autofillCeoBusinessProfileFromWebsite } from "@/lib/ceo-command-center/business-profile-autofill";
import { createEmptyBusinessProfile } from "@/lib/ceo-command-center/business-profile-utils";
import type {
  LandingPageDraft,
  LandingPageSettings,
} from "@/lib/ceo-command-center/landing-builder-types";
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

const AI_NOT_CONFIGURED =
  "AI help requires OPENAI_API_KEY on the server. You can still fill in the fields manually.";

async function requireSignedInUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in" };
  return { success: true as const, supabase };
}

const BusinessProfileAiSchema = z.object({
  summary: z.string(),
  businessName: z.string().optional(),
  industry: z.string().optional(),
  services: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  businessHours: z.string().optional(),
  targetCustomer: z.string().optional(),
  keywords: z.string().optional(),
  seoMetaTitle: z.string().optional(),
  seoMetaDescription: z.string().optional(),
  mainOffer: z.string().optional(),
  businessDescription: z.string().optional(),
});

export async function fillBusinessProfileWithAiAction(input: {
  instruction: string;
  profile: BusinessProfileFields;
}) {
  const auth = await requireSignedInUser();
  if (!auth.success) return auth;
  if (!isOpenAiConfigured()) return { success: false as const, error: AI_NOT_CONFIGURED };

  const instruction = input.instruction.trim();
  if (!instruction) return { success: false as const, error: "Describe your business first." };

  const aiResult = await callJsonResponses<z.infer<typeof BusinessProfileAiSchema>>({
    supabase: auth.supabase,
    businessId: null,
    purpose: "onboarding.business_profile_ai_fill",
    schema: BusinessProfileAiSchema,
    system:
      "You help a local/service business owner fill out their business profile during onboarding. Use the user's plain-language description to fill or improve the fields. Only return fields you are confident about. Keep keywords comma-separated, the SEO meta title under 60 characters, and the SEO meta description under 155 characters. Always include a one-sentence summary of what you filled in.",
    prompt: `Current business profile JSON:
${JSON.stringify(input.profile, null, 2)}

User description / instruction: ${instruction}

Return JSON with "summary" (string) plus any business profile fields you filled or improved.`,
  });

  if (!aiResult.success) return { success: false as const, error: aiResult.error };

  const { summary, ...rawFields } = aiResult.data;
  const patch: Partial<BusinessProfileFields> = {};
  for (const [key, value] of Object.entries(rawFields)) {
    if (typeof value === "string" && value.trim()) {
      patch[key as keyof BusinessProfileFields] = value.trim();
    }
  }

  return { success: true as const, data: { patch, summary } };
}

const OFFER_TYPE_VALUES = [
  "consultation",
  "estimate",
  "paid_service",
  "product_purchase",
  "appointment",
  "program_enrollment",
  "donation",
  "trial_demo",
  "limited_offer",
  "lead_magnet",
] as const;

const PRIMARY_GOAL_VALUES = [
  "leads",
  "phone_calls",
  "forms",
  "bookings",
  "quote_requests",
  "sales",
  "revenue",
  "email_sms_list",
  "donations_sponsors",
  "program_enrollments",
  "local_visits",
  "customer_reactivation",
] as const;

const CONVERSION_ACTION_VALUES = [
  "call",
  "form",
  "booking",
  "checkout",
  "quote_request",
  "application",
  "email_signup",
  "sms_signup",
  "whatsapp",
  "live_chat",
  "donation",
  "download",
] as const;

// Accept loose strings from the model so an unexpected value never fails the
// whole response; we validate each enum field against the allowed values below.
const OfferGoalsAiSchema = z.object({
  summary: z.string(),
  offerType: z.string().optional(),
  primaryGoal: z.string().optional(),
  preferredConversionAction: z.string().optional(),
  monthlyTarget: z.string().optional(),
  averageDealValue: z.string().optional(),
});

function matchEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return allowed.find((option) => option === normalized);
}

export async function fillOfferGoalsWithAiAction(input: {
  instruction: string;
  profile: BusinessProfileFields;
  offerGoals: OfferGoalsFields;
}) {
  const auth = await requireSignedInUser();
  if (!auth.success) return auth;
  if (!isOpenAiConfigured()) return { success: false as const, error: AI_NOT_CONFIGURED };

  const instruction = input.instruction.trim();
  if (!instruction) return { success: false as const, error: "Describe your offer or goal first." };

  const aiResult = await callJsonResponses<z.infer<typeof OfferGoalsAiSchema>>({
    supabase: auth.supabase,
    businessId: null,
    purpose: "onboarding.offer_goals_ai_fill",
    schema: OfferGoalsAiSchema,
    system:
      "You help a local/service business owner define their offer and goals during onboarding. From the user's plain-language description, choose the best matching offerType, primaryGoal, and preferredConversionAction from the allowed values only, and fill monthlyTarget and averageDealValue as short strings. Only return fields you are confident about. Always include a one-sentence summary.",
    prompt: `Business: ${input.profile.businessName}
Industry: ${input.profile.industry}
Main offer: ${input.profile.mainOffer}

Current offer & goals JSON:
${JSON.stringify(input.offerGoals, null, 2)}

User description / instruction: ${instruction}

Return JSON with "summary" (string) plus any offer & goals fields you set.`,
  });

  if (!aiResult.success) return { success: false as const, error: aiResult.error };

  const patch = aiResult.data;
  const offerType = matchEnum<OfferGoalsFields["offerType"]>(patch.offerType, OFFER_TYPE_VALUES);
  const primaryGoal = matchEnum<OfferGoalsFields["primaryGoal"]>(
    patch.primaryGoal,
    PRIMARY_GOAL_VALUES,
  );
  const preferredConversionAction = matchEnum<OfferGoalsFields["preferredConversionAction"]>(
    patch.preferredConversionAction,
    CONVERSION_ACTION_VALUES,
  );

  const next: Partial<OfferGoalsFields> = {
    ...(offerType ? { offerType } : {}),
    ...(primaryGoal ? { primaryGoal } : {}),
    ...(preferredConversionAction ? { preferredConversionAction } : {}),
    ...(patch.monthlyTarget && patch.monthlyTarget.trim()
      ? { monthlyTarget: patch.monthlyTarget.trim() }
      : {}),
    ...(patch.averageDealValue && patch.averageDealValue.trim()
      ? { averageDealValue: patch.averageDealValue.trim() }
      : {}),
  };

  return { success: true as const, data: { patch: next, summary: patch.summary } };
}

const LandingPageAiSchema = z.object({
  summary: z.string(),
  heroHeadline: z.string().optional(),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  offerDetails: z.string().optional(),
  benefits: z.string().optional(),
  formFields: z.string().optional(),
  socialProof: z.string().optional(),
  faq: z.string().optional(),
  thankYouMessage: z.string().optional(),
  buttonText: z.string().optional(),
  pageSlug: z.string().optional(),
  trackingEvent: z.string().optional(),
  thankYouRedirect: z.string().optional(),
  brandTone: z.string().optional(),
});

export async function fillLandingPageWithAiAction(input: {
  instruction: string;
  profile: BusinessProfileFields;
  offerGoals: OfferGoalsFields;
  draft: LandingPageDraft;
  settings: LandingPageSettings;
}) {
  const auth = await requireSignedInUser();
  if (!auth.success) return auth;
  if (!isOpenAiConfigured()) return { success: false as const, error: AI_NOT_CONFIGURED };

  const instruction = input.instruction.trim();
  if (!instruction) return { success: false as const, error: "Describe the page you want." };

  const aiResult = await callJsonResponses<z.infer<typeof LandingPageAiSchema>>({
    supabase: auth.supabase,
    businessId: null,
    purpose: "onboarding.landing_page_ai_fill",
    schema: LandingPageAiSchema,
    system:
      "You write and improve landing page copy and settings for a local/service business during onboarding. Use the business context and the user's instruction to write compelling, concise copy. Benefits, form fields, and FAQ should be newline-separated lists. Only return fields you changed. Always include a one-sentence summary.",
    prompt: `Business: ${input.profile.businessName}
Industry: ${input.profile.industry}
Main offer: ${input.profile.mainOffer}
Target customer: ${input.profile.targetCustomer}
Primary goal: ${input.offerGoals.primaryGoal}
Conversion action: ${input.offerGoals.preferredConversionAction}

Current landing page sections JSON:
${JSON.stringify(input.draft, null, 2)}

Current landing page settings JSON:
${JSON.stringify(input.settings, null, 2)}

User description / instruction: ${instruction}

Return JSON with "summary" (string) plus any landing page section or settings fields you wrote or improved.`,
  });

  if (!aiResult.success) return { success: false as const, error: aiResult.error };

  const patch = aiResult.data;
  const draftPatch: Partial<LandingPageDraft> = {};
  const draftKeys: (keyof LandingPageDraft)[] = [
    "heroHeadline",
    "subheadline",
    "ctaText",
    "offerDetails",
    "benefits",
    "formFields",
    "socialProof",
    "faq",
    "thankYouMessage",
  ];
  for (const key of draftKeys) {
    const value = patch[key];
    if (typeof value === "string" && value.trim()) draftPatch[key] = value.trim();
  }

  const settingsPatch: Partial<LandingPageSettings> = {};
  const settingsKeys = [
    "buttonText",
    "pageSlug",
    "trackingEvent",
    "thankYouRedirect",
    "brandTone",
  ] as const;
  for (const key of settingsKeys) {
    const value = patch[key];
    if (typeof value === "string" && value.trim()) {
      settingsPatch[key] = value.trim();
    }
  }

  return {
    success: true as const,
    data: { draftPatch, settingsPatch, summary: patch.summary },
  };
}

const ConnectionsAiSchema = z.object({
  summary: z.string(),
  recommendedIntegrationIds: z.array(z.string()).optional(),
});

export async function recommendConnectionsWithAiAction(input: {
  instruction: string;
  profile: BusinessProfileFields;
  offerGoals: OfferGoalsFields;
  integrations: Array<{ id: string; name: string }>;
}) {
  const auth = await requireSignedInUser();
  if (!auth.success) return auth;
  if (!isOpenAiConfigured()) return { success: false as const, error: AI_NOT_CONFIGURED };

  const instruction = input.instruction.trim();
  if (!instruction) return { success: false as const, error: "Tell us how you market first." };

  const aiResult = await callJsonResponses<z.infer<typeof ConnectionsAiSchema>>({
    supabase: auth.supabase,
    businessId: null,
    purpose: "onboarding.connections_ai_recommend",
    schema: ConnectionsAiSchema,
    system:
      "You recommend which marketing/CRM/payment tools a local/service business should connect during onboarding. Choose only from the provided integration ids. Return the ids that best fit their goal plus a one-sentence summary explaining why.",
    prompt: `Business: ${input.profile.businessName}
Industry: ${input.profile.industry}
Primary goal: ${input.offerGoals.primaryGoal}
Conversion action: ${input.offerGoals.preferredConversionAction}

Available integrations (id - name):
${input.integrations.map((item) => `${item.id} - ${item.name}`).join("\n")}

User instruction: ${instruction}

Return JSON with "summary" (string) and "recommendedIntegrationIds" (array of ids from the list above).`,
  });

  if (!aiResult.success) return { success: false as const, error: aiResult.error };

  const validIds = new Set(input.integrations.map((item) => item.id));
  const recommendedIntegrationIds = (aiResult.data.recommendedIntegrationIds ?? []).filter((id) =>
    validIds.has(id),
  );

  return {
    success: true as const,
    data: { recommendedIntegrationIds, summary: aiResult.data.summary },
  };
}

const AgentsAiSchema = z.object({
  summary: z.string(),
  recommendedAgents: z.array(z.string()).optional(),
});

export async function recommendAgentsWithAiAction(input: {
  instruction: string;
  profile: BusinessProfileFields;
  offerGoals: OfferGoalsFields;
}) {
  const auth = await requireSignedInUser();
  if (!auth.success) return auth;
  if (!isOpenAiConfigured()) return { success: false as const, error: AI_NOT_CONFIGURED };

  const instruction = input.instruction.trim();
  if (!instruction) return { success: false as const, error: "Describe what you need help with." };

  const aiResult = await callJsonResponses<z.infer<typeof AgentsAiSchema>>({
    supabase: auth.supabase,
    businessId: null,
    purpose: "onboarding.agents_ai_recommend",
    schema: AgentsAiSchema,
    system:
      "You recommend which AI agents a local/service business should activate (e.g. Appointment Setter, Follow-Up Specialist, Missed Call Text-Back, Review Agent, Reactivation Agent). Suggest the most relevant ones for their goal. Return human-readable agent names plus a one-sentence summary.",
    prompt: `Business: ${input.profile.businessName}
Industry: ${input.profile.industry}
Main offer: ${input.profile.mainOffer}
Primary goal: ${input.offerGoals.primaryGoal}
Conversion action: ${input.offerGoals.preferredConversionAction}

User instruction: ${instruction}

Return JSON with "summary" (string) and "recommendedAgents" (array of agent names).`,
  });

  if (!aiResult.success) return { success: false as const, error: aiResult.error };

  return {
    success: true as const,
    data: {
      recommendedAgents: aiResult.data.recommendedAgents ?? [],
      summary: aiResult.data.summary,
    },
  };
}

const AdsPlanAiSchema = z.object({
  summary: z.string(),
});

export async function draftAdsPlanWithAiAction(input: {
  instruction: string;
  profile: BusinessProfileFields;
  offerGoals: OfferGoalsFields;
}) {
  const auth = await requireSignedInUser();
  if (!auth.success) return auth;
  if (!isOpenAiConfigured()) return { success: false as const, error: AI_NOT_CONFIGURED };

  const instruction = input.instruction.trim();
  if (!instruction) return { success: false as const, error: "Describe your ad goal or budget." };

  const aiResult = await callJsonResponses<z.infer<typeof AdsPlanAiSchema>>({
    supabase: auth.supabase,
    businessId: null,
    purpose: "onboarding.ads_plan_ai_draft",
    schema: AdsPlanAiSchema,
    system:
      "You draft a concise starter advertising plan for a local/service business: recommended channel(s), budget split, and a core ad angle. Keep it to a short, practical paragraph in the summary field.",
    prompt: `Business: ${input.profile.businessName}
Industry: ${input.profile.industry}
Main offer: ${input.profile.mainOffer}
Target customer: ${input.profile.targetCustomer}
Primary goal: ${input.offerGoals.primaryGoal}
Conversion action: ${input.offerGoals.preferredConversionAction}
Monthly target: ${input.offerGoals.monthlyTarget}

User instruction: ${instruction}

Return JSON with "summary" (string) containing the ad plan recommendation.`,
  });

  if (!aiResult.success) return { success: false as const, error: aiResult.error };

  return { success: true as const, data: { summary: aiResult.data.summary } };
}

const TrackingAiSchema = z.object({
  summary: z.string(),
  recommendedTrackingPlatforms: z.array(z.string()).optional(),
});

export async function recommendTrackingWithAiAction(input: {
  instruction: string;
  profile: BusinessProfileFields;
}) {
  const auth = await requireSignedInUser();
  if (!auth.success) return auth;
  if (!isOpenAiConfigured()) return { success: false as const, error: AI_NOT_CONFIGURED };

  const instruction = input.instruction.trim();
  if (!instruction) return { success: false as const, error: "Describe your tracking goal." };

  const aiResult = await callJsonResponses<z.infer<typeof TrackingAiSchema>>({
    supabase: auth.supabase,
    businessId: null,
    purpose: "onboarding.tracking_ai_recommend",
    schema: TrackingAiSchema,
    system:
      "You recommend which tracking/analytics platforms a local/service business should set up (e.g. GA4, Meta Pixel, Google Tag Manager, call tracking). Suggest the most relevant ones for their goal. Return platform names plus a one-sentence summary.",
    prompt: `Business: ${input.profile.businessName}
Industry: ${input.profile.industry}

User instruction: ${instruction}

Return JSON with "summary" (string) and "recommendedTrackingPlatforms" (array of platform names).`,
  });

  if (!aiResult.success) return { success: false as const, error: aiResult.error };

  return {
    success: true as const,
    data: {
      recommendedTrackingPlatforms: aiResult.data.recommendedTrackingPlatforms ?? [],
      summary: aiResult.data.summary,
    },
  };
}
