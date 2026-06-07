import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  extractContactDetailsFromHtml,
  fetchWebsiteForAutofill,
} from "@/lib/onboarding/fetch-website-contact";
import { normalizeWebsiteUrl } from "@/lib/onboarding/fetch-website-text";
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
  businessDescription: "Business Description",
};

export { FIELD_LABELS };

function extractFromJsonLd(html: string): Partial<BusinessProfileFields> {
  const out: Partial<BusinessProfileFields> = {};
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!blocks) return out;

  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
    try {
      const parsed = JSON.parse(inner) as Record<string, unknown>;
      const nodes = Array.isArray(parsed["@graph"])
        ? (parsed["@graph"] as Record<string, unknown>[])
        : [parsed];

      for (const node of nodes) {
        const type = String(node["@type"] ?? "");
        if (!/Organization|LocalBusiness|Corporation|Store|ProfessionalService/i.test(type)) {
          continue;
        }
        if (typeof node.name === "string" && !out.businessName) out.businessName = node.name;
        if (typeof node.telephone === "string" && !out.phone) out.phone = node.telephone;
        if (typeof node.email === "string" && !out.email) out.email = node.email;
        if (typeof node.description === "string" && !out.businessDescription) {
          out.businessDescription = node.description;
        }
        if (node.address && typeof node.address === "object") {
          const addr = node.address as Record<string, unknown>;
          const parts = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode]
            .filter((p) => typeof p === "string" && p.trim())
            .join(", ");
          if (parts && !out.address) out.address = parts;
        }
        if (node.openingHoursSpecification && !out.businessHours) {
          out.businessHours = JSON.stringify(node.openingHoursSpecification).slice(0, 200);
        }
      }
    } catch {
      /* ignore invalid JSON-LD */
    }
  }

  return out;
}

function extractPatterns(text: string): Partial<BusinessProfileFields> {
  const out: Partial<BusinessProfileFields> = {};
  const phone = text.match(/(?:\+1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/);
  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (phone?.[0]) out.phone = phone[0];
  if (email?.[0] && !email[0].includes("example.com")) out.email = email[0];
  return out;
}

function extractContactFields(
  homepageHtml?: string,
  contactHtml?: string,
  contactText?: string,
): Partial<BusinessProfileFields> {
  const mergedHtml = [contactHtml ?? "", homepageHtml ?? ""].join("\n");
  const fromHtml = extractContactDetailsFromHtml(mergedHtml);
  const fromText = contactText ? extractPatterns(contactText) : {};

  return {
    phone: fromHtml.phone ?? fromText.phone,
    email: fromHtml.email ?? fromText.email,
    address: fromHtml.address ?? fromText.address,
  };
}

function heuristicProfile(
  url: string,
  text: string,
  title?: string,
  html?: string,
  contactHtml?: string,
  contactText?: string,
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
    keywords: domain.replace(/^www\./i, "").replace(/\./g, " ").trim(),
    ...(html ? extractFromJsonLd(html) : {}),
    ...extractPatterns(text),
    ...extractContactFields(html, contactHtml, contactText),
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
  let pageHtml: string | undefined;
  let contactHtml: string | undefined;
  let contactText: string | undefined;
  let contactUrl: string | undefined;

  try {
    const fetched = await fetchWebsiteForAutofill(normalized);
    pageText = fetched.text;
    pageTitle = fetched.title;
    pageHtml = fetched.html;
    contactHtml = fetched.contactHtml;
    contactText = fetched.contactText;
    contactUrl = fetched.contactUrl;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not read website.", "FETCH_FAILED");
  }

  const contactHint = extractContactFields(pageHtml, contactHtml, contactText);

  if (!isOpenAiConfigured()) {
    const partial = heuristicProfile(
      normalized,
      pageText,
      pageTitle,
      pageHtml,
      contactHtml,
      contactText,
    );
    return ok({
      profile: mergeProfile(currentProfile, { ...partial, ...contactHint }, normalized),
      usedAi: false,
    });
  }

  const aiResult = await callJsonResponses<ExtractedProfile>({
    supabase: client,
    businessId: null,
    purpose: "onboarding.ceo_business_profile_autofill",
    schema: CeoBusinessProfileSchema,
    system:
      "You extract structured business profile data from website content for a local/service business onboarding form. Prioritize the CONTACT PAGE section for phone, email, and address. Return only fields you can infer confidently; omit unknown fields.",
    prompt: `Analyze this business website and extract onboarding profile fields.

Website URL: ${normalized}
Page title: ${pageTitle ?? "(unknown)"}
${contactUrl ? `Contact page scanned: ${contactUrl}` : "No separate contact page found — check homepage footer/header."}

Website text excerpt (homepage + contact page):
"""
${pageText.slice(0, 14000)}
"""

Return JSON with any of these optional string fields:
businessName, industry, services, address, phone, email, website, businessHours, targetCustomer, keywords (comma-separated), seoMetaTitle (≤60 chars), seoMetaDescription (≤160 chars), mainOffer, businessDescription.

For phone, email, and address: use the Contact Us / contact page content first. Be specific to this business. Use concise, operator-ready values.`,
  });

  if (!aiResult.success) {
    const partial = heuristicProfile(
      normalized,
      pageText,
      pageTitle,
      pageHtml,
      contactHtml,
      contactText,
    );
    return ok({
      profile: mergeProfile(currentProfile, { ...partial, ...contactHint }, normalized),
      usedAi: false,
    });
  }

  return ok({
    profile: mergeProfile(
      currentProfile,
      { ...aiResult.data, ...contactHint, website: normalized },
      normalized,
    ),
    usedAi: true,
  });
}
