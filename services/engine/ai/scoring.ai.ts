import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ServiceResult } from "@/lib/result";

import { callJsonResponses } from "./openai-client";
import { PHASE3_ASSET_KINDS, type Phase3AssetKind } from "./generation.ai";
import { VARIANT_LABELS, type VariantLabel } from "./variants.ai";

/**
 * The 6-axis rubric shown in the AIWORKERS diagram.
 * Each axis is scored 0..100; total is the average across axes.
 */
export const SCORING_AXES = [
  "clarity",
  "trust",
  "emotionalImpact",
  "ctaStrength",
  "mobileUx",
  "conversionPotential",
] as const;

export type ScoringAxis = (typeof SCORING_AXES)[number];

const AxesScoreSchema = z.object({
  clarity: z.number().min(0).max(100),
  trust: z.number().min(0).max(100),
  emotionalImpact: z.number().min(0).max(100),
  ctaStrength: z.number().min(0).max(100),
  mobileUx: z.number().min(0).max(100),
  conversionPotential: z.number().min(0).max(100),
});

const VariantScoreSchema = z.object({
  kind: z.enum(PHASE3_ASSET_KINDS),
  variantLabel: z.enum(VARIANT_LABELS),
  axes: AxesScoreSchema,
  totalScore: z.number().min(0).max(100),
  rationale: z.string().min(1),
});

const ScoringResultSchema = z.object({
  scores: z.array(VariantScoreSchema).min(1).max(64),
  winnerByKind: z.object({
    landing_page: z.enum(VARIANT_LABELS),
    ad: z.enum(VARIANT_LABELS),
    email: z.enum(VARIANT_LABELS),
    headline: z.enum(VARIANT_LABELS),
  }),
});

export type EngineScoringResult = z.infer<typeof ScoringResultSchema>;

/**
 * Shape for the in-memory subset of an asset we send to the scoring model.
 * We deliberately strip the DB ids before serializing.
 */
export type ScorableVariant = {
  kind: Phase3AssetKind;
  variantLabel: VariantLabel;
  payload: Record<string, unknown>;
};

export async function runScoringStep(args: {
  supabase: SupabaseClient;
  businessId: string;
  runId: string;
  variants: ScorableVariant[];
}): Promise<ServiceResult<EngineScoringResult>> {
  if (args.variants.length === 0) {
    return {
      success: false,
      error: "No variants to score",
      code: "no_variants",
    };
  }

  const grouped: Record<string, Record<string, Record<string, unknown>>> = {};
  for (const v of args.variants) {
    grouped[v.kind] ??= {};
    grouped[v.kind][v.variantLabel] = v.payload;
  }

  const prompt = `Act as a senior conversion analytics & UX evaluator.
You are doing the "AI Scoring Engine" stage of an automated marketing pipeline.
Score every variant on the rubric below, then pick a single winner for each asset kind.

Rubric (each axis 0..100):
- clarity: is the value & action obvious in < 5 seconds?
- trust: does it feel credible (proof, specificity, professionalism)?
- emotionalImpact: does it hit the audience's pain or desire emotionally?
- ctaStrength: is the CTA explicit, low-friction, and benefit-led?
- mobileUx: does the copy length & structure work well on mobile?
- conversionPotential: holistic likelihood of converting cold traffic.

The "totalScore" must be the rounded average of the 6 axes for that variant.
Pick the winner per kind as the variant with the highest totalScore (break ties by
conversionPotential, then ctaStrength).

Variants to score (grouped by kind, then by A/B/C/D):
${JSON.stringify(grouped, null, 2)}

Return JSON with EXACTLY this shape:
{
  "scores": [
    {
      "kind": "landing_page" | "ad" | "email" | "headline",
      "variantLabel": "A" | "B" | "C" | "D",
      "axes": {
        "clarity": number 0-100,
        "trust": number 0-100,
        "emotionalImpact": number 0-100,
        "ctaStrength": number 0-100,
        "mobileUx": number 0-100,
        "conversionPotential": number 0-100
      },
      "totalScore": number 0-100 (rounded average of the axes),
      "rationale": string (1 sentence on why this variant scored as it did)
    }
  ],
  "winnerByKind": {
    "landing_page": "A" | "B" | "C" | "D",
    "ad": "A" | "B" | "C" | "D",
    "email": "A" | "B" | "C" | "D",
    "headline": "A" | "B" | "C" | "D"
  }
}

You MUST return one score entry for every variant in the input. Do not score variants that don't exist.`;

  return callJsonResponses({
    supabase: args.supabase,
    businessId: args.businessId,
    runId: args.runId,
    purpose: "engine.scoring",
    schema: ScoringResultSchema,
    prompt,
    system:
      "You produce objective, calibrated scores across creative variants on a fixed 6-axis rubric.",
  });
}
