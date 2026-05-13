import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ServiceResult } from "@/lib/result";
import type { EngineInputPayload } from "@/services/engine/orchestrator.service";

import { callJsonResponses } from "./openai-client";
import type { EngineResearch } from "./research.ai";
import type { EngineStrategy } from "./strategy.ai";
import type { EngineFunnel } from "./funnel.ai";
import type { EngineGenerationPlan, Phase3AssetKind } from "./generation.ai";
import { PHASE3_ASSET_KINDS } from "./generation.ai";

export const VARIANT_LABELS = ["A", "B", "C", "D"] as const;
export type VariantLabel = (typeof VARIANT_LABELS)[number];

const LandingPageVariantSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  heroImageBrief: z.string(),
  bullets: z.array(z.string()).min(2).max(6),
  primaryCta: z.string(),
  socialProof: z.string(),
});

const AdVariantSchema = z.object({
  primaryText: z.string(),
  headline: z.string(),
  description: z.string(),
  imagePrompt: z.string(),
  cta: z.string(),
});

const EmailVariantSchema = z.object({
  subject: z.string(),
  previewText: z.string(),
  body: z.string(),
});

const HeadlineVariantSchema = z.object({
  text: z.string(),
  framing: z.string(),
});

const VariantQuadSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({
    A: inner,
    B: inner,
    C: inner,
    D: inner,
  });

const VariantOutputSchema = z.object({
  landing_page: VariantQuadSchema(LandingPageVariantSchema),
  ad: VariantQuadSchema(AdVariantSchema),
  email: VariantQuadSchema(EmailVariantSchema),
  headline: VariantQuadSchema(HeadlineVariantSchema),
});

export type EngineVariantsOutput = z.infer<typeof VariantOutputSchema>;

export type FlattenedVariant = {
  kind: Phase3AssetKind;
  variantLabel: VariantLabel;
  payload: Record<string, unknown>;
};

export function flattenVariants(output: EngineVariantsOutput): FlattenedVariant[] {
  const rows: FlattenedVariant[] = [];
  for (const kind of PHASE3_ASSET_KINDS) {
    const quad = output[kind];
    for (const label of VARIANT_LABELS) {
      rows.push({
        kind,
        variantLabel: label,
        payload: quad[label] as unknown as Record<string, unknown>,
      });
    }
  }
  return rows;
}

export async function runVariantsStep(args: {
  supabase: SupabaseClient;
  businessId: string;
  runId: string;
  input: EngineInputPayload;
  research: EngineResearch;
  strategy: EngineStrategy;
  funnel: EngineFunnel;
  plan: EngineGenerationPlan;
}): Promise<ServiceResult<EngineVariantsOutput>> {
  const { input, research, strategy, funnel, plan } = args;

  const prompt = `Act as a senior conversion copywriter and creative team.
You are doing the "Variant Engine" stage of an automated marketing pipeline.
Produce FOUR variants (A, B, C, D) for FOUR asset kinds (landing_page, ad, email, headline).
Each variant must follow its assigned theme distinctly.

Campaign context:
- Goal / offer: ${input.goal ?? "(not provided)"}
- Location: ${input.location ?? "(not provided)"}
- Audience: ${research.audienceProfile}
- Offer headline (strategy): ${strategy.offer.headline}
- Offer description: ${strategy.offer.description}
- Value props: ${strategy.offer.valueProps.join("; ")}
- Primary CTA: ${strategy.cta.primary}
- Funnel type: ${strategy.funnelType}
- Funnel summary: ${funnel.summary}

Creative direction: ${plan.creativeDirection}
Brand voice: ${plan.brandVoice}
Variant themes (must be reflected distinctly across A/B/C/D for every kind):
- A: ${plan.variantThemes.A}
- B: ${plan.variantThemes.B}
- C: ${plan.variantThemes.C}
- D: ${plan.variantThemes.D}
Must include in every asset: ${plan.mustInclude.join("; ") || "(none specified)"}
Do not say: ${plan.doNotSay.join("; ") || "(none specified)"}

Return JSON with EXACTLY this shape:
{
  "landing_page": {
    "A": { "headline": string, "subheadline": string, "heroImageBrief": string, "bullets": string[] (3-5), "primaryCta": string, "socialProof": string },
    "B": { same shape },
    "C": { same shape },
    "D": { same shape }
  },
  "ad": {
    "A": { "primaryText": string, "headline": string, "description": string, "imagePrompt": string, "cta": string },
    "B": { same shape },
    "C": { same shape },
    "D": { same shape }
  },
  "email": {
    "A": { "subject": string, "previewText": string, "body": string },
    "B": { same shape },
    "C": { same shape },
    "D": { same shape }
  },
  "headline": {
    "A": { "text": string (≤ 12 words), "framing": string (1 sentence on the angle) },
    "B": { same shape },
    "C": { same shape },
    "D": { same shape }
  }
}

Rules:
- Each variant must clearly express its assigned theme — do NOT produce 4 paraphrases of the same idea.
- Keep ad primaryText under 90 words. Keep email body under 200 words. Keep headlines under 12 words.
- Use specifics (numbers, locations, named guarantees) wherever appropriate.`;

  return callJsonResponses({
    supabase: args.supabase,
    businessId: args.businessId,
    runId: args.runId,
    purpose: "engine.variants",
    schema: VariantOutputSchema,
    prompt,
    system:
      "You produce four genuinely distinct, ready-to-test ad / landing-page / email / headline variants per kind.",
  });
}
