import { z } from "zod";

import {
  parseFunnelInput,
  slugifyFunnelInput,
  type ParsedFunnelInput,
} from "@/lib/funnel/parse-funnel-input";
import { callJsonResponses, isOpenAiConfigured } from "@/services/engine/ai/openai-client";
import type { LandingSection } from "@/types/marketing-os";
import { DEFAULT_LANDING_SECTIONS } from "@/types/marketing-os";

export type LandingPageVariantDraft = {
  angle: string;
  angleLabel: string;
  headline: string;
  subheadline: string;
  offer: string;
  ctaText: string;
  location: string;
  industry: string;
  sections: LandingSection[];
};

const variantSchema = z.object({
  angle: z.enum(["trust", "urgency", "value"]),
  angleLabel: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  offer: z.string(),
  ctaText: z.string(),
  location: z.string(),
  benefits: z.array(z.string()).min(3).max(6),
});

const responseSchema = z.object({
  businessSummary: z.string(),
  industry: z.string(),
  variants: z.array(variantSchema).length(3),
});

function buildSections(
  variant: z.infer<typeof variantSchema>,
): LandingSection[] {
  return DEFAULT_LANDING_SECTIONS.map((section) => {
    if (section.type === "hero") {
      return {
        ...section,
        content: {
          headline: variant.headline,
          subheadline: variant.subheadline,
          cta: variant.ctaText,
        },
      };
    }
    if (section.type === "offer") {
      return {
        ...section,
        content: { title: "What You Get", body: variant.offer },
      };
    }
    if (section.type === "benefits") {
      return { ...section, content: { items: variant.benefits } };
    }
    if (section.type === "trust_badges") {
      return {
        ...section,
        enabled: variant.angle === "trust",
        content: {
          badges: ["Licensed & insured", "5-star reviews", "Local experts", "Free estimates"],
        },
      };
    }
    if (section.type === "contact_form") {
      return {
        ...section,
        content: {
          title: variant.angle === "urgency" ? "Claim your spot" : "Get your free quote",
        },
      };
    }
    return section;
  });
}

function brandLabel(parsed: ParsedFunnelInput): string {
  if (parsed.kind === "url" && parsed.domain) {
    const host = parsed.domain.split(".")[0] ?? parsed.domain;
    return host.charAt(0).toUpperCase() + host.slice(1);
  }
  return parsed.displayLabel.slice(0, 80) || "Your business";
}

function fallbackVariants(parsed: ParsedFunnelInput): z.infer<typeof responseSchema> {
  const niche = brandLabel(parsed);
  const location = extractLocation(parsed.raw) ?? "Your area";

  return {
    businessSummary: parsed.displayLabel,
    industry: guessIndustry(parsed.aiPrompt),
    variants: [
      {
        angle: "trust",
        angleLabel: "Trust & Authority",
        headline: `${niche} — Trusted by Local Customers`,
        subheadline: "Licensed, insured, and backed by hundreds of 5-star reviews.",
        offer: `Free consultation and transparent pricing. No pressure — just honest recommendations for ${location}.`,
        ctaText: "Book Free Consultation",
        location,
        benefits: [
          "Licensed & fully insured",
          "Same-day response",
          "Transparent pricing",
          "Local team you can trust",
        ],
      },
      {
        angle: "urgency",
        angleLabel: "Urgency & Scarcity",
        headline: `Limited Spots: ${niche} This Week Only`,
        subheadline: "High demand in your area — schedule before slots fill up.",
        offer: `Act now for priority scheduling and a complimentary assessment. Offer valid for new clients in ${location}.`,
        ctaText: "Reserve My Spot",
        location,
        benefits: [
          "Priority scheduling",
          "This week only",
          "Fast turnaround",
          "No obligation quote",
        ],
      },
      {
        angle: "value",
        angleLabel: "Offer & Value",
        headline: `Save More With ${niche}'s Best Deal`,
        subheadline: "Maximum value, premium results — without the premium price tag.",
        offer: `Bundle pricing, flexible payment options, and a satisfaction guarantee tailored for ${location} customers.`,
        ctaText: "Get My Quote",
        location,
        benefits: [
          "Best-price guarantee",
          "Flexible financing",
          "Premium materials",
          "100% satisfaction focus",
        ],
      },
    ],
  };
}

function extractLocation(prompt: string): string | null {
  const match = prompt.match(/\b(?:in|near|serving)\s+([A-Za-z\s,]{3,40})/i);
  return match?.[1]?.trim() ?? null;
}

function guessIndustry(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/\.org|nonprofit|charity|foundation|donat/.test(lower)) return "Nonprofit";
  if (/roof|hvac|plumb|electric|home service/.test(lower)) return "Home Services";
  if (/dentist|medical|clinic|spa/.test(lower)) return "Medical";
  if (/law|attorney|legal/.test(lower)) return "Legal";
  if (/real estate|realtor|agent/.test(lower)) return "Real Estate";
  if (/agency|marketing|consult/.test(lower)) return "Agency";
  if (/church|ministr/.test(lower)) return "Nonprofit";
  if (/gym|fitness|coach/.test(lower)) return "Fitness";
  if (/restaurant|food|cafe/.test(lower)) return "Restaurant";
  if (/\.shop|store|commerce|buy|sell/.test(lower)) return "E-commerce";
  return "Local Business";
}

export async function generateThreeLandingPageVariants(input: {
  prompt: string;
  supabase: import("@supabase/supabase-js").SupabaseClient;
  businessId: string;
}): Promise<LandingPageVariantDraft[]> {
  const parsed = parseFunnelInput(input.prompt);

  let parsedResponse: z.infer<typeof responseSchema>;

  if (isOpenAiConfigured()) {
    const result = await callJsonResponses({
      supabase: input.supabase,
      businessId: input.businessId,
      purpose: "funnel_three_landing_pages",
      schema: responseSchema,
      system:
        "You are an expert direct-response copywriter for high-converting landing pages.",
      prompt: `${parsed.aiPrompt}

Generate exactly 3 DISTINCT landing page concepts for A/B testing:
1. trust — authority, social proof, credibility
2. urgency — scarcity, speed, limited availability
3. value — offer stack, savings, guarantee

Each variant needs unique headline, subheadline, offer copy, CTA, location (infer from prompt or use "Your area"), and 4 benefit bullets.
Return JSON only.`,
    });

    if (result.success) {
      parsedResponse = result.data;
    } else {
      parsedResponse = fallbackVariants(parsed);
    }
  } else {
    parsedResponse = fallbackVariants(parsed);
  }

  return parsedResponse.variants.map((v) => ({
    angle: v.angle,
    angleLabel: v.angleLabel,
    headline: v.headline,
    subheadline: v.subheadline,
    offer: v.offer,
    ctaText: v.ctaText,
    location: v.location,
    industry: parsedResponse.industry,
    sections: buildSections(v),
  }));
}

export function variantSlug(slugBase: string, angle: string, index: number) {
  const base = slugifyFunnelInput(slugBase);
  return `${base}-${angle}-${index + 1}`;
}

export { parseFunnelInput, slugifyFunnelInput };
