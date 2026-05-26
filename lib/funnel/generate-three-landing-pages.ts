import { z } from "zod";

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

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 36) || "landing"
  );
}

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

function fallbackVariants(prompt: string): z.infer<typeof responseSchema> {
  const niche = prompt.trim().slice(0, 80) || "Your business";
  const location = extractLocation(prompt) ?? "Your area";

  return {
    businessSummary: niche,
    industry: guessIndustry(prompt),
    variants: [
      {
        angle: "trust",
        angleLabel: "Trust & Authority",
        headline: `${niche} — Trusted by Local Homeowners`,
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
        headline: `Save More With ${niche.split(" ")[0] ?? "Our"} Best Deal`,
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
  if (/roof|hvac|plumb|electric|home service/.test(lower)) return "Home Services";
  if (/dentist|medical|clinic|spa/.test(lower)) return "Medical";
  if (/law|attorney|legal/.test(lower)) return "Legal";
  if (/real estate|realtor|agent/.test(lower)) return "Real Estate";
  if (/agency|marketing|consult/.test(lower)) return "Agency";
  if (/nonprofit|church|donat/.test(lower)) return "Nonprofit";
  if (/gym|fitness|coach/.test(lower)) return "Fitness";
  if (/restaurant|food|cafe/.test(lower)) return "Restaurant";
  return "Local Business";
}

export async function generateThreeLandingPageVariants(input: {
  prompt: string;
  supabase: import("@supabase/supabase-js").SupabaseClient;
  businessId: string;
}): Promise<LandingPageVariantDraft[]> {
  const prompt = input.prompt.trim();
  if (prompt.length < 8) {
    throw new Error("Describe your business or offer in at least a few words.");
  }

  let parsed: z.infer<typeof responseSchema>;

  if (isOpenAiConfigured()) {
    const result = await callJsonResponses({
      supabase: input.supabase,
      businessId: input.businessId,
      purpose: "funnel_three_landing_pages",
      schema: responseSchema,
      system:
        "You are an expert direct-response copywriter for high-converting landing pages.",
      prompt: `Business / offer description:
"${prompt}"

Generate exactly 3 DISTINCT landing page concepts for A/B testing:
1. trust — authority, social proof, credibility
2. urgency — scarcity, speed, limited availability
3. value — offer stack, savings, guarantee

Each variant needs unique headline, subheadline, offer copy, CTA, location (infer from prompt or use "Your area"), and 4 benefit bullets.
Return JSON only.`,
    });

    if (result.success) {
      parsed = result.data;
    } else {
      parsed = fallbackVariants(prompt);
    }
  } else {
    parsed = fallbackVariants(prompt);
  }

  return parsed.variants.map((v) => ({
    angle: v.angle,
    angleLabel: v.angleLabel,
    headline: v.headline,
    subheadline: v.subheadline,
    offer: v.offer,
    ctaText: v.ctaText,
    location: v.location,
    industry: parsed.industry,
    sections: buildSections(v),
  }));
}

export function variantSlug(basePrompt: string, angle: string, index: number) {
  const base = slugify(basePrompt);
  return `${base}-${angle}-${index + 1}`;
}
