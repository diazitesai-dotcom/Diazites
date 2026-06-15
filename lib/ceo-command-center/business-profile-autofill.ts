import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  extractContactDetailsFromHtml,
  fetchWebsiteForAutofill,
} from "@/lib/onboarding/fetch-website-contact";
import {
  normalizeWebsiteUrl,
  type ContactDetails,
} from "@/lib/onboarding/fetch-website-text";
import { sanitizeBusinessProfile } from "@/lib/ceo-command-center/business-profile-utils";
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

/**
 * Build grounded contact fields. Prefers explicit markup (tel:/mailto:/<address>),
 * then the clean structured `contact` object the fetch layer extracted from the
 * raw page (BEFORE any synthetic "CONTACT …:" labels were added). We never
 * re-parse the labeled page text here, which previously polluted the address
 * (e.g. "9020 CONTACT ADDRESS: 2916 …").
 */
function buildContactHint(
  websiteContact: ContactDetails | undefined,
  homepageHtml?: string,
  contactHtml?: string,
): Partial<BusinessProfileFields> {
  const mergedHtml = [contactHtml ?? "", homepageHtml ?? ""].join("\n");
  const fromHtml = extractContactDetailsFromHtml(mergedHtml);

  const out: Partial<BusinessProfileFields> = {};
  const phone = fromHtml.phone ?? websiteContact?.phone;
  const email = fromHtml.email ?? websiteContact?.email;
  const address = fromHtml.address ?? websiteContact?.address;
  if (phone) out.phone = phone;
  if (email) out.email = email;
  if (address) out.address = address;
  if (websiteContact?.businessHours) out.businessHours = websiteContact.businessHours;
  return out;
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^[\s\S]*?[.!?](?:\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

/** Synthesize a concise main offer from already-extracted profile fields. */
function deriveMainOffer(input: {
  businessName?: string;
  services?: string;
  businessDescription?: string;
  seoMetaDescription?: string;
}): string {
  const firstService = (input.services ?? "").split(/[,;\n]|·|•/)[0]?.trim() ?? "";
  if (firstService) {
    const name = input.businessName?.trim();
    const offer = name ? `${name} — ${firstService}` : firstService;
    return offer.slice(0, 140);
  }
  const fromDescription = firstSentence(input.businessDescription ?? "");
  if (fromDescription) return fromDescription.slice(0, 140);
  const fromSeo = firstSentence(input.seoMetaDescription ?? "");
  if (fromSeo) return fromSeo.slice(0, 140);
  return "";
}

/** Backfill an empty mainOffer from services → description → SEO description. */
function withMainOfferFallback(profile: BusinessProfileFields): BusinessProfileFields {
  if (profile.mainOffer.trim()) return profile;
  const fromServices = profile.services.split(/[,;\n]|·|•/)[0]?.trim() ?? "";
  const fallback =
    fromServices ||
    firstSentence(profile.businessDescription) ||
    profile.seoMetaDescription.trim();
  if (!fallback) return profile;
  return { ...profile, mainOffer: fallback.slice(0, 140) };
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Drop AI-provided contact fields that do not actually appear in the fetched
 * page content. Prevents the model from inventing plausible-but-wrong phone
 * numbers, addresses, or hours when it cannot find the real ones.
 */
function groundContactFields(
  ai: Partial<BusinessProfileFields>,
  corpus: string,
): Partial<BusinessProfileFields> {
  const out: Partial<BusinessProfileFields> = { ...ai };
  const corpusLower = corpus.toLowerCase();
  const corpusDigits = digitsOf(corpus);

  if (out.phone) {
    const digits = digitsOf(out.phone).slice(-10);
    if (digits.length < 10 || !corpusDigits.includes(digits)) delete out.phone;
  }

  if (out.email && !corpusLower.includes(out.email.toLowerCase())) {
    delete out.email;
  }

  if (out.address) {
    const zip = out.address.match(/\b\d{5}\b/)?.[0];
    if (zip) {
      if (!corpusDigits.includes(zip)) delete out.address;
    } else {
      const tokens = out.address.toLowerCase().match(/[a-z]{4,}/g) ?? [];
      if (!tokens.some((token) => corpusLower.includes(token))) delete out.address;
    }
  }

  if (out.businessHours) {
    const mentionsHours =
      /\d{1,2}\s*[ap]\.?\s*m\.?/i.test(corpus) || /\bhours?\b/i.test(corpusLower);
    if (!mentionsHours) delete out.businessHours;
  }

  return out;
}

function heuristicProfile(
  url: string,
  text: string,
  title?: string,
  html?: string,
): Partial<BusinessProfileFields> {
  const businessName = (title?.split(/[|\-–—]/)[0]?.trim() ?? "").slice(0, 120);
  const descMatch = text.match(/DESCRIPTION:\s([^]+?)(?:\sOG:|$)/i);
  const description = descMatch?.[1]?.trim().slice(0, 500) ?? "";
  const domain = url.replace(/^https?:\/\//, "").split("/")[0] ?? url;
  const services = description.slice(0, 300);

  return {
    website: url,
    businessName,
    seoMetaTitle: title?.slice(0, 160) ?? "",
    seoMetaDescription: description.slice(0, 320),
    businessDescription: description,
    services,
    targetCustomer: description.slice(0, 200),
    keywords: domain.replace(/^www\./i, "").replace(/\./g, " ").trim(),
    mainOffer: deriveMainOffer({
      businessName,
      services,
      businessDescription: description,
      seoMetaDescription: description,
    }),
    ...(html ? extractFromJsonLd(html) : {}),
    ...extractPatterns(text),
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

  return sanitizeBusinessProfile(
    {
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
    },
    url,
  );
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
  let websiteContact: ContactDetails | undefined;

  try {
    const fetched = await fetchWebsiteForAutofill(normalized);
    pageText = fetched.text;
    pageTitle = fetched.title;
    pageHtml = fetched.html;
    contactHtml = fetched.contactHtml;
    contactText = fetched.contactText;
    contactUrl = fetched.contactUrl;
    websiteContact = fetched.contact;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not read website.", "FETCH_FAILED");
  }

  const contactHint = buildContactHint(websiteContact, pageHtml, contactHtml);
  const groundingCorpus = [pageText, contactText ?? "", pageHtml ?? "", contactHtml ?? ""].join(
    "\n",
  );

  if (!isOpenAiConfigured()) {
    const partial = heuristicProfile(normalized, pageText, pageTitle, pageHtml);
    return ok({
      profile: withMainOfferFallback(
        mergeProfile(currentProfile, { ...partial, ...contactHint }, normalized),
      ),
      usedAi: false,
    });
  }

  const aiResult = await callJsonResponses<ExtractedProfile>({
    supabase: client,
    businessId: null,
    purpose: "onboarding.ceo_business_profile_autofill",
    schema: CeoBusinessProfileSchema,
    system:
      "You extract structured business profile data from website content for a local/service business onboarding form. Prioritize the CONTACT PHONE/EMAIL/ADDRESS/HOURS lines and the CONTACT PAGE section for contact details. NEVER guess or invent a phone number, email, address, or hours — only return contact values that appear verbatim in the provided content. If a contact field is not present, omit it. For the address, output the address value ONLY — do not include the 'CONTACT ADDRESS:' label, any 'CONTACT/PHONE/EMAIL/HOURS' words, or stray phone digits. ALWAYS synthesize a concise one-sentence mainOffer (the primary product, service, or value proposition) from the page content even if it is not stated verbatim — mainOffer is a summary, so synthesis is expected. Return only fields you can infer confidently.",
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

For phone, email, address, and businessHours: copy them ONLY from the CONTACT PHONE/EMAIL/ADDRESS/HOURS lines or the Contact Us content above. Do not fabricate or approximate them — omit any contact field you cannot find verbatim in the content. The address must be the postal address only (street, city, state, ZIP) with NO 'CONTACT ADDRESS:' label or phone digits. Always include a concise one-sentence mainOffer summarizing what this business primarily offers.`,
  });

  if (!aiResult.success) {
    const partial = heuristicProfile(normalized, pageText, pageTitle, pageHtml);
    return ok({
      profile: withMainOfferFallback(
        mergeProfile(currentProfile, { ...partial, ...contactHint }, normalized),
      ),
      usedAi: false,
    });
  }

  return ok({
    profile: withMainOfferFallback(
      mergeProfile(
        currentProfile,
        {
          ...groundContactFields(aiResult.data, groundingCorpus),
          ...contactHint,
          website: normalized,
        },
        normalized,
      ),
    ),
    usedAi: true,
  });
}
