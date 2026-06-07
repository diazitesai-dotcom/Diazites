import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { fetchWebsiteText, normalizeWebsiteUrl } from "@/lib/onboarding/fetch-website-text";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { callJsonResponses, isOpenAiConfigured } from "@/services/engine/ai/openai-client";
import type { BusinessProfileFields } from "@/types/ceo-command-center";

const CeoBusinessProfileSchema = z.object({
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
  competitors: z.string().optional(),
  bestCallToAction: z.string().optional(),
  brandVoice: z.string().optional(),
  businessDescription: z.string().optional(),
});

type ExtractedProfile = z.infer<typeof CeoBusinessProfileSchema>;

const FIELD_LABELS: Record<keyof BusinessProfileFields, string> = {
  businessName: "Business Name",
  industry: "Industry / Niche",
  services: "Services",
  address: "Address",
  phone: "Phone",
  email: "Email",
  website: "Website",
  businessHours: "Business Hours",
  targetCustomer: "Target Customer",
  keywords: "Keywords",
  seoMetaTitle: "SEO Meta Title",
  seoMetaDescription: "SEO Meta Description",
  mainOffer: "Main Offer",
  competitors: "Competitors",
  bestCallToAction: "Best Call-To-Action",
  brandVoice: "Brand Voice",
  businessDescription: "Business Description",
};

export { FIELD_LABELS };

function heuristicProfile(
  url: string,
  text: string,
  title?: string,
): Partial<BusinessProfileFields> {
  const businessName = title?.split(/[|\-–—]/)[0]?.trim() ?? "";
  const descMatch = text.match(/DESCRIPTION:\s([^]+?)(?:\sOG:|$)/i);
  const description = descMatch?.[1]?.trim().slice(0, 500) ?? "";
  const domain = url.replace(/^https?:\/\//, "").split("/")[0] ?? url;

  return {
    website: url,
    businessName: businessName.slice(0, 120),
    seoMetaTitle: title?.slice(0, 160) ?? "",
    seoMetaDescription: description.slice(0, 320),
    businessDescription: description,
    services: description.slice(0, 300),
    targetCustomer: description.slice(0, 200),
    keywords: domain.replace(/\./g, " ").replace(/www\s?/i, "").trim(),
    bestCallToAction: "Get Started",
    brandVoice: "Professional, trustworthy, local expert",
  };
}

function mergeProfile(
  current: BusinessProfileFields,
  extracted: Partial<BusinessProfileFields>,
  url: string,
): BusinessProfileFields {
  const pick = (key: keyof BusinessProfileFields): string => {
    const next = extracted[key]?.trim();
    if (next) return next;
    if (key === "website") return url;
    return current[key] ?? "";
  };

  return {
    businessName: pick("businessName"),
    industry: pick("industry"),
    services: pick("services"),
    address: pick("address"),
    phone: pick("phone"),
    email: pick("email"),
    website: url,
    businessHours: pick("businessHours"),
    targetCustomer: pick("targetCustomer"),
    keywords: pick("keywords"),
    seoMetaTitle: pick("seoMetaTitle"),
    seoMetaDescription: pick("seoMetaDescription"),
    mainOffer: pick("mainOffer"),
    competitors: pick("competitors"),
    bestCallToAction: pick("bestCallToAction"),
    brandVoice: pick("brandVoice"),
    businessDescription: pick("businessDescription"),
  };
}

export async function autofillCeoBusinessProfileFromWebsite(
  client: SupabaseClient,
  rawUrl: string,
  currentProfile: BusinessProfileFields,
): Promise<ServiceResult<{ profile: BusinessProfileFields; usedAi: boolean }>> {
  const normalized = normalizeWebsiteUrl(rawUrl);
  if (!normalized) {
    return fail("Enter a valid website URL (include https://).", "INVALID_URL");
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
    const partial = heuristicProfile(normalized, pageText, pageTitle);
    return ok({
      profile: mergeProfile(currentProfile, partial, normalized),
      usedAi: false,
    });
  }

  const aiResult = await callJsonResponses<ExtractedProfile>({
    supabase: client,
    businessId: null,
    purpose: "onboarding.ceo_business_profile_autofill",
    schema: CeoBusinessProfileSchema,
    system:
      "You extract structured business profile data from website content for a local/service business onboarding form. Return only fields you can infer confidently; omit unknown fields.",
    prompt: `Analyze this business website and extract onboarding profile fields.

Website URL: ${normalized}
Page title: ${pageTitle ?? "(unknown)"}

Website text excerpt:
"""
${pageText.slice(0, 14000)}
"""

Return JSON with any of these optional string fields:
businessName, industry, services, address, phone, email, website, businessHours, targetCustomer, keywords (comma-separated), seoMetaTitle (≤60 chars), seoMetaDescription (≤160 chars), mainOffer, competitors (comma-separated names), bestCallToAction, brandVoice, businessDescription.

Be specific to this business. Use concise, operator-ready values.`,
  });

  if (!aiResult.success) {
    const partial = heuristicProfile(normalized, pageText, pageTitle);
    return ok({
      profile: mergeProfile(currentProfile, partial, normalized),
      usedAi: false,
    });
  }

  return ok({
    profile: mergeProfile(currentProfile, { ...aiResult.data, website: normalized }, normalized),
    usedAi: true,
  });
}
