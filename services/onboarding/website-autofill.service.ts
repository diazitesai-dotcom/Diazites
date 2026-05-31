import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { fetchWebsiteText, normalizeWebsiteUrl } from "@/lib/onboarding/fetch-website-text";
import type { OnboardingDraft } from "@/lib/onboarding/draft";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { callJsonResponses, isOpenAiConfigured } from "@/services/engine/ai/openai-client";
import type { CampaignGoalId } from "@/types/platform-growth";

const WebsiteAutofillSchema = z.object({
  businessName: z.string().optional(),
  ownerName: z.string().optional(),
  businessEmail: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  businessAddress: z.string().optional(),
  serviceArea: z.string().optional(),
  cityState: z.string().optional(),
  services: z.string().optional(),
  businessHours: z.string().optional(),
  industry: z.string().optional(),
  businessType: z.string().optional(),
  targetAudience: z.string().optional(),
  idealCustomer: z.string().optional(),
  offerPromotion: z.string().optional(),
  brandTone: z.string().optional(),
  brandColors: z.string().optional(),
  campaignGoal: z
    .enum([
      "generate_leads",
      "book_appointments",
      "sell_products",
      "promote_services",
      "website_traffic",
      "form_submissions",
      "grow_email_list",
      "retarget_visitors",
      "local_ads",
      "scale_campaigns",
    ])
    .optional(),
  monthlyBudget: z.number().optional(),
});

export type WebsiteAutofillResult = Partial<OnboardingDraft>;

function heuristicAutofill(
  url: string,
  text: string,
  title?: string,
): WebsiteAutofillResult {
  const businessName = title?.split(/[|\-–—]/)[0]?.trim() || "";
  const descMatch = text.match(/DESCRIPTION:\s([^]+?)(?:\sOG:|$)/i);

  return {
    website: url,
    businessName: businessName.slice(0, 120),
    services: descMatch?.[1]?.trim().slice(0, 500) ?? "",
    targetAudience: descMatch?.[1]?.trim().slice(0, 300) ?? "",
    industry: "",
  };
}

function mergeAutofill(
  current: OnboardingDraft,
  extracted: WebsiteAutofillResult,
): OnboardingDraft {
  const pick = <K extends keyof OnboardingDraft>(key: K): OnboardingDraft[K] => {
    const next = extracted[key];
    const cur = current[key];
    if (typeof next === "string" && next.trim() && (!cur || (typeof cur === "string" && !cur.trim()))) {
      return next as OnboardingDraft[K];
    }
    if (typeof next === "number" && next > 0 && (!cur || cur === 0 || cur === "0")) {
      return String(next) as OnboardingDraft[K];
    }
    return cur;
  };

  return {
    ...current,
    businessName: pick("businessName"),
    ownerName: pick("ownerName"),
    businessEmail: pick("businessEmail"),
    phone: pick("phone"),
    website: extracted.website || current.website || normalizeWebsiteUrl(current.website) || "",
    businessAddress: pick("businessAddress"),
    serviceArea: pick("serviceArea"),
    cityState: pick("cityState"),
    services: pick("services"),
    businessHours: pick("businessHours"),
    industry: pick("industry"),
    businessType: pick("businessType"),
    targetAudience: pick("targetAudience"),
    idealCustomer: pick("idealCustomer"),
    offerPromotion: pick("offerPromotion"),
    brandTone: pick("brandTone"),
    brandColors: pick("brandColors"),
    monthlyBudget:
      extracted.monthlyBudget && !current.monthlyBudget
        ? String(extracted.monthlyBudget)
        : current.monthlyBudget,
    campaignGoal: (extracted.campaignGoal as CampaignGoalId) ?? current.campaignGoal,
  };
}

export async function autofillOnboardingFromWebsite(
  client: SupabaseClient,
  userId: string,
  rawUrl: string,
  currentDraft: OnboardingDraft,
): Promise<ServiceResult<{ draft: OnboardingDraft; usedAi: boolean }>> {
  const normalized = normalizeWebsiteUrl(rawUrl);
  if (!normalized) {
    return fail("Enter a valid website URL.", "INVALID_URL");
  }

  let pageText: string;
  let pageTitle: string | undefined;
  try {
    const fetched = await fetchWebsiteText(normalized);
    pageText = fetched.text;
    pageTitle = fetched.title;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not read website.", "FETCH_FAILED");
  }

  if (!isOpenAiConfigured()) {
    const partial = heuristicAutofill(normalized, pageText, pageTitle);
    return ok({
      draft: mergeAutofill(currentDraft, partial),
      usedAi: false,
    });
  }

  const aiResult = await callJsonResponses({
    supabase: client,
    businessId: null,
    purpose: "onboarding.website_autofill",
    schema: WebsiteAutofillSchema,
    system:
      "You extract structured business onboarding data from website content. Return only fields you can infer confidently; omit unknown fields.",
    prompt: `Analyze this business website and extract onboarding fields.

Website URL: ${normalized}
Page title: ${pageTitle ?? "(unknown)"}

Website text excerpt:
"""
${pageText.slice(0, 12000)}
"""

Return JSON with any of these optional fields:
businessName, ownerName, businessEmail, phone, website, businessAddress, serviceArea, cityState, services, businessHours, industry, businessType, targetAudience, idealCustomer, offerPromotion, brandTone, brandColors, campaignGoal (generate_leads|book_appointments|sell_products|promote_services|website_traffic|form_submissions|grow_email_list|retarget_visitors|local_ads|scale_campaigns), monthlyBudget (number, USD estimate if mentioned).

Use concise, operator-ready values. For services, summarize as a comma-separated list.`,
  });

  if (!aiResult.success) {
    const partial = heuristicAutofill(normalized, pageText, pageTitle);
    return ok({
      draft: mergeAutofill(currentDraft, partial),
      usedAi: false,
    });
  }

  const merged = mergeAutofill(currentDraft, {
    ...aiResult.data,
    website: normalized,
    monthlyBudget:
      aiResult.data.monthlyBudget != null
        ? String(aiResult.data.monthlyBudget)
        : undefined,
  });

  void userId;

  return ok({ draft: merged, usedAi: true });
}
