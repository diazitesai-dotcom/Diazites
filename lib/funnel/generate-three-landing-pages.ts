import { z } from "zod";

import {
  DEFAULT_DEMO_VIDEO_EMBED,
  pickStockGallery,
  pickStockHeroImage,
} from "@/lib/funnel/landing-stock-media";
import {
  parseFunnelInput,
  slugifyFunnelInput,
  type ParsedFunnelInput,
} from "@/lib/funnel/parse-funnel-input";
import { callJsonResponses, isOpenAiConfigured } from "@/services/engine/ai/openai-client";
import type { LandingSection } from "@/types/marketing-os";
import { DEFAULT_FORM_FIELDS } from "@/types/marketing-os";

export type LandingPageVariantDraft = {
  angle: string;
  angleLabel: string;
  headline: string;
  subheadline: string;
  offer: string;
  ctaText: string;
  location: string;
  industry: string;
  brandName: string;
  sections: LandingSection[];
};

const richVariantSchema = z.object({
  angle: z.enum(["trust", "urgency", "value"]),
  angleLabel: z.string(),
  brandName: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  offer: z.string(),
  ctaText: z.string(),
  location: z.string(),
  benefits: z.array(z.string()).min(3).max(6),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).min(3).max(4),
  testimonials: z
    .array(z.object({ quote: z.string(), author: z.string(), role: z.string() }))
    .min(2)
    .max(4),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).min(3).max(6),
  gallery: z
    .array(z.object({ url: z.string(), alt: z.string() }))
    .min(2)
    .max(4)
    .optional(),
  heroImageUrl: z.string().optional(),
  videoEmbedUrl: z.string().nullable().optional(),
  theme: z.enum(["violet", "cyan", "emerald", "amber"]).optional(),
});

const responseSchema = z.object({
  businessSummary: z.string(),
  industry: z.string(),
  variants: z.array(richVariantSchema).length(3),
});

type RichVariant = z.infer<typeof richVariantSchema>;

function buildRichSections(
  variant: RichVariant,
  industry: string,
  angleIndex: number,
): LandingSection[] {
  const heroImage =
    variant.heroImageUrl?.startsWith("http") ?
      variant.heroImageUrl
    : pickStockHeroImage(industry, angleIndex);
  const gallery =
    variant.gallery?.length ?
      variant.gallery
    : pickStockGallery(industry).map((g, i) => ({
        ...g,
        alt: g.alt || `${variant.brandName} — image ${i + 1}`,
      }));
  const videoUrl = variant.videoEmbedUrl || DEFAULT_DEMO_VIDEO_EMBED;
  const theme = variant.theme ?? (["violet", "cyan", "emerald"] as const)[angleIndex % 3];

  return [
    {
      id: "hero",
      type: "hero",
      enabled: true,
      order: 0,
      content: {
        brandName: variant.brandName,
        headline: variant.headline,
        subheadline: variant.subheadline,
        cta: variant.ctaText,
        heroImageUrl: heroImage,
        theme,
        stats: variant.stats,
      },
    },
    {
      id: "benefits",
      type: "benefits",
      enabled: true,
      order: 1,
      content: { title: "Why choose us", items: variant.benefits },
    },
    {
      id: "video",
      type: "video",
      enabled: true,
      order: 2,
      content: {
        title: "See it in action",
        embedUrl: videoUrl,
        caption: `How ${variant.brandName} works`,
      },
    },
    {
      id: "gallery",
      type: "gallery",
      enabled: true,
      order: 3,
      content: { title: "Built for modern teams", images: gallery },
    },
    {
      id: "testimonials",
      type: "testimonials",
      enabled: true,
      order: 4,
      content: { title: "What customers say", items: variant.testimonials },
    },
    {
      id: "offer",
      type: "offer",
      enabled: true,
      order: 5,
      content: { title: "Your offer", body: variant.offer },
    },
    {
      id: "faq",
      type: "faq",
      enabled: true,
      order: 6,
      content: { title: "Questions answered", items: variant.faqs },
    },
    {
      id: "trust_badges",
      type: "trust_badges",
      enabled: variant.angle === "trust",
      order: 7,
      content: {
        badges: ["Secure & private", "Expert support", "Proven results", "No long contracts"],
      },
    },
    {
      id: "contact_form",
      type: "contact_form",
      enabled: true,
      order: 8,
      content: {
        title: variant.angle === "urgency" ? "Claim your spot" : "Start free",
        formFields: DEFAULT_FORM_FIELDS,
      },
    },
  ];
}

function brandLabel(parsed: ParsedFunnelInput): string {
  if (parsed.kind === "url" && parsed.domain) {
    const host = parsed.domain.split(".")[0] ?? parsed.domain;
    const name = host.replace(/-/g, " ");
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return parsed.displayLabel.slice(0, 80) || "Your business";
}

function fallbackRichVariants(parsed: ParsedFunnelInput): z.infer<typeof responseSchema> {
  const brand = brandLabel(parsed);
  const location = extractLocation(parsed.raw) ?? "Nationwide";
  const industry = guessIndustry(parsed.aiPrompt);

  const angles: Array<{ angle: "trust" | "urgency" | "value"; angleLabel: string }> = [
    { angle: "trust", angleLabel: "Trust & Authority" },
    { angle: "urgency", angleLabel: "Urgency & Momentum" },
    { angle: "value", angleLabel: "Value & ROI" },
  ];

  const variants: RichVariant[] = angles.map((a, i) => ({
    ...a,
    brandName: brand,
    headline:
      a.angle === "trust" ? `${brand} — Built for serious growth teams`
      : a.angle === "urgency" ? `Launch faster with ${brand}`
      : `${brand}: More pipeline, less busywork`,
    subheadline:
      a.angle === "trust" ?
        "Enterprise-grade AI workflows with transparent pricing and human oversight."
      : a.angle === "urgency" ?
        "Limited onboarding slots — deploy agents and funnels in days, not months."
      : "Automate landing pages, ads orchestration, and follow-up in one stack.",
    offer:
      a.angle === "trust" ?
        `Free strategy session + custom funnel blueprint for ${location} teams.`
      : a.angle === "urgency" ?
        `Priority setup this week: 3 landing variants, MCP agent access, and launch checklist.`
      : `Founding-member pricing with flexible month-to-month terms.`,
    ctaText:
      a.angle === "urgency" ? "Reserve my slot" : (
        a.angle === "value" ? "Get pricing" : "Book a demo"
      ),
    location,
    benefits: [
      "AI-generated landing pages & A/B variants",
      "Agent MCP access for Hermes, OpenClaw, Cursor",
      "Full-funnel automation with approvals",
      "Analytics & lead routing built in",
    ],
    stats: [
      { value: "3×", label: "Faster launches" },
      { value: "24/7", label: "Agent availability" },
      { value: "10+", label: "Integrations" },
    ],
    testimonials: [
      {
        quote: `${brand} replaced three tools and cut our launch time in half.`,
        author: "Alex M.",
        role: "Growth lead",
      },
      {
        quote: "Finally an AI stack that respects approvals and brand voice.",
        author: "Jordan K.",
        role: "Founder",
      },
    ],
    faqs: [
      {
        question: "Do I need to code?",
        answer: "No — connect agents via MCP or use the dashboard to generate and publish funnels.",
      },
      {
        question: "Can I use my own domain?",
        answer: "Yes. Publish to Diazites-hosted pages or connect your domain in settings.",
      },
      {
        question: "Is there a free trial?",
        answer: "Start with a demo funnel and upgrade when you are ready to go live.",
      },
    ],
    heroImageUrl: pickStockHeroImage(industry, i),
    videoEmbedUrl: DEFAULT_DEMO_VIDEO_EMBED,
    theme: (["violet", "cyan", "emerald"] as const)[i],
  }));

  return {
    businessSummary: parsed.displayLabel,
    industry,
    variants,
  };
}

function extractLocation(prompt: string): string | null {
  const match = prompt.match(/\b(?:in|near|serving)\s+([A-Za-z\s,]{3,40})/i);
  return match?.[1]?.trim() ?? null;
}

function guessIndustry(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/hermes|openclaw|ai agent|autonomous|mcp|saas|software|\.ai\b|agents\.pro/.test(lower)) {
    return "Technology";
  }
  if (/\.org|nonprofit|charity|foundation|donat/.test(lower)) return "Nonprofit";
  if (/roof|hvac|plumb|electric|home service/.test(lower)) return "Home Services";
  if (/dentist|medical|clinic|spa/.test(lower)) return "Medical";
  if (/law|attorney|legal/.test(lower)) return "Legal";
  if (/real estate|realtor/.test(lower)) return "Real Estate";
  if (/agency|marketing|consult/.test(lower)) return "Agency";
  if (/gym|fitness|coach/.test(lower)) return "Fitness";
  if (/restaurant|food|cafe/.test(lower)) return "Restaurant";
  if (/\.shop|store|commerce/.test(lower)) return "E-commerce";
  return "Agency";
}

export async function generateThreeLandingPageVariants(input: {
  prompt: string;
  supabase: import("@supabase/supabase-js").SupabaseClient;
  businessId: string;
  accountBusinessName?: string | null;
}): Promise<LandingPageVariantDraft[]> {
  const parsed = parseFunnelInput(input.prompt);
  const targetBrand = brandLabel(parsed);

  let parsedResponse: z.infer<typeof responseSchema>;

  if (isOpenAiConfigured()) {
    const result = await callJsonResponses({
      supabase: input.supabase,
      businessId: input.businessId,
      purpose: "funnel_three_landing_pages",
      schema: responseSchema,
      system: `You are a senior conversion designer and copywriter for premium, modern landing pages (2025+).
Output rich, visually distinct variants — not generic roofing templates.
Use the TARGET BRAND from the user prompt (domain or description). brandName must be "${targetBrand}" or a polished expansion of it.
NEVER use "EverPeak Roofing" or other placeholder names unless they appear in the user prompt.
The Diazites account may be named "${input.accountBusinessName ?? "unknown"}" — ignore that if it conflicts with the prompt brand.`,
      prompt: `${parsed.aiPrompt}

Generate exactly 3 DISTINCT, modern landing page concepts for A/B testing:
1. trust — authority, social proof, credibility
2. urgency — scarcity, speed, limited availability  
3. value — ROI, offer stack, guarantee

Each variant MUST include:
- brandName (from prompt — "${targetBrand}")
- headline, subheadline, offer, ctaText, location
- benefits[4-6], stats[3-4] {value, label}
- testimonials[2-4] {quote, author, role}
- faqs[4-6] {question, answer}
- gallery[3-4] {url, alt} — use real https://images.unsplash.com/... URLs matching the industry
- heroImageUrl — full-width hero https://images.unsplash.com/... URL
- videoEmbedUrl — YouTube embed URL (/embed/...) for a relevant product demo, or null
- theme — one of violet | cyan | emerald | amber (different per variant)

Industry should match the business (e.g. Technology for AI agent platforms, not roofing unless prompt says roofing).
Return JSON only.`,
    });

    parsedResponse = result.success ? result.data : fallbackRichVariants(parsed);
  } else {
    parsedResponse = fallbackRichVariants(parsed);
  }

  return parsedResponse.variants.map((v, i) => ({
    angle: v.angle,
    angleLabel: v.angleLabel,
    headline: v.headline,
    subheadline: v.subheadline,
    offer: v.offer,
    ctaText: v.ctaText,
    location: v.location,
    industry: parsedResponse.industry,
    brandName: v.brandName || targetBrand,
    sections: buildRichSections({ ...v, brandName: v.brandName || targetBrand }, parsedResponse.industry, i),
  }));
}

export function variantSlug(slugBase: string, angle: string, index: number) {
  const base = slugifyFunnelInput(slugBase);
  return `${base}-${angle}-${index + 1}`;
}

export { parseFunnelInput, slugifyFunnelInput };
