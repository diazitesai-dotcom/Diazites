import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ServiceResult } from "@/lib/result";
import type { EngineInputPayload } from "@/services/engine/orchestrator.service";

import { callJsonResponses } from "./openai-client";
import type { EngineResearch } from "./research.ai";
import type { EngineStrategy } from "./strategy.ai";
import type { EngineFunnel } from "./funnel.ai";

/**
 * Asset kinds the Generation + Variants steps will produce in Phase 3.
 * Matches the `assets.kind` check constraint in migration 006.
 */
export const PHASE3_ASSET_KINDS = ["landing_page", "ad", "email", "headline"] as const;
export type Phase3AssetKind = (typeof PHASE3_ASSET_KINDS)[number];

const GenerationPlanSchema = z.object({
  creativeDirection: z.string().min(1),
  brandVoice: z.string().min(1),
  variantThemes: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  assetKindsToBuild: z
    .array(z.enum(PHASE3_ASSET_KINDS))
    .min(1)
    .max(PHASE3_ASSET_KINDS.length),
  doNotSay: z.array(z.string()).min(0).max(8),
  mustInclude: z.array(z.string()).min(0).max(8),
});

export type EngineGenerationPlan = z.infer<typeof GenerationPlanSchema>;

export async function runGenerationStep(args: {
  supabase: SupabaseClient;
  businessId: string;
  runId: string;
  input: EngineInputPayload;
  research: EngineResearch;
  strategy: EngineStrategy;
  funnel: EngineFunnel;
}): Promise<ServiceResult<EngineGenerationPlan>> {
  const { input, research, strategy, funnel } = args;

  const prompt = `Act as a senior creative director.
You are doing the "AI Generation Suite" planning stage of an automated marketing pipeline.
You will NOT write asset copy here. Instead, define the creative direction and four
distinct variant themes that the Variant Engine will use to produce A/B/C/D versions
of each asset kind.

Inputs:
- Goal / offer: ${input.goal ?? "(not provided)"}
- Offer headline (from strategy): ${strategy.offer.headline}
- Primary CTA: ${strategy.cta.primary}
- Funnel type: ${strategy.funnelType}
- Funnel summary: ${funnel.summary}
- Audience: ${research.audienceProfile}
- Top pain points: ${research.painPoints.slice(0, 4).join("; ")}
- Top positioning hooks: ${research.positioningHooks.slice(0, 4).join("; ")}

Return JSON with EXACTLY this shape:
{
  "creativeDirection": string — 2-3 sentence overall creative direction for this campaign,
  "brandVoice": string — 1 sentence describing the tone (e.g. "warm, expert, no-nonsense"),
  "variantThemes": {
    "A": string — short distinct theme (e.g. "trust-led, authority-first"),
    "B": string — short distinct theme (e.g. "urgency / scarcity, time-bound"),
    "C": string — short distinct theme (e.g. "emotional / community / local"),
    "D": string — short distinct theme (e.g. "data / ROI / proof-driven")
  },
  "assetKindsToBuild": array of ${JSON.stringify(PHASE3_ASSET_KINDS)} — the kinds we should produce variants for; typically include all,
  "doNotSay": string[] — 2-6 phrases or claims to avoid (compliance, accuracy, brand-safety),
  "mustInclude": string[] — 2-6 elements every asset must reference (location, guarantee, offer term)
}

The four variantThemes MUST be genuinely distinct angles — not rephrasings of the same idea.`;

  return callJsonResponses({
    supabase: args.supabase,
    businessId: args.businessId,
    runId: args.runId,
    purpose: "engine.generation",
    schema: GenerationPlanSchema,
    prompt,
    system:
      "You produce tight, distinct creative directions for downstream variant generators.",
  });
}
