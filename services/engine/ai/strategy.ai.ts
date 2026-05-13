import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ServiceResult } from "@/lib/result";
import type { EngineInputPayload } from "@/services/engine/orchestrator.service";

import { callJsonResponses } from "./openai-client";
import type { EngineResearch } from "./research.ai";

const StrategySchema = z.object({
  positioning: z.string().min(1),
  offer: z.object({
    headline: z.string(),
    description: z.string(),
    valueProps: z.array(z.string()).min(1).max(6),
    riskReversal: z.string().optional(),
  }),
  cta: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
  }),
  funnelType: z.enum(["lead_form", "calendar_book", "quiz", "callback", "estimate"]),
  trafficStrategy: z.array(
    z.object({
      channel: z.string(),
      angle: z.string(),
      budgetSharePct: z.number().min(0).max(100),
    }),
  ).min(1).max(6),
  successMetrics: z.object({
    targetLeadsPerMonth: z.number().int().positive(),
    targetCostPerLeadUsd: z.number().positive(),
    targetConversionRatePct: z.number().positive().max(100),
  }),
});

export type EngineStrategy = z.infer<typeof StrategySchema>;

export async function runStrategyStep(args: {
  supabase: SupabaseClient;
  businessId: string;
  runId: string;
  input: EngineInputPayload;
  research: EngineResearch;
}): Promise<ServiceResult<EngineStrategy>> {
  const { input, research } = args;

  const prompt = `Act as a senior performance marketing strategist.
You are doing the "Campaign Creative" stage of an automated marketing pipeline.

Inputs:
- Goal / offer: ${input.goal ?? "(not provided)"}
- Niche: ${input.niche ?? "(not provided)"}
- Location: ${input.location ?? "(not provided)"}
- Monthly budget (USD): ${input.budget ?? "(not provided)"}
- Primary traffic source preference: ${input.trafficSource ?? "(not provided)"}

Research findings:
- Audience: ${research.audienceProfile}
- Pain points: ${research.painPoints.join("; ")}
- Offer angles: ${research.offerAngles.join("; ")}
- Positioning hooks: ${research.positioningHooks.join("; ")}

Return JSON with EXACTLY this shape:
{
  "positioning": string — 1-2 sentence positioning statement,
  "offer": {
    "headline": string — primary offer headline (≤ 12 words),
    "description": string — 1-2 sentence offer description,
    "valueProps": string[] — 3-5 concrete value props (≤ 8 words each),
    "riskReversal"?: string — optional guarantee or risk reversal
  },
  "cta": {
    "primary": string — primary CTA copy (≤ 4 words),
    "secondary"?: string — optional secondary CTA
  },
  "funnelType": one of "lead_form" | "calendar_book" | "quiz" | "callback" | "estimate",
  "trafficStrategy": [
    {
      "channel": string — e.g. "Meta Ads", "Google Search", "Local SEO",
      "angle": string — 1 sentence on the creative angle for this channel,
      "budgetSharePct": number — share of monthly budget (0-100); total across entries should sum to ~100
    }
  ] — 2-5 entries,
  "successMetrics": {
    "targetLeadsPerMonth": integer,
    "targetCostPerLeadUsd": number,
    "targetConversionRatePct": number — landing page lead conversion percentage (0-100)
  }
}

Make targets realistic given the budget. Choose the funnelType that best matches the goal & offer.`;

  return callJsonResponses({
    supabase: args.supabase,
    businessId: args.businessId,
    runId: args.runId,
    purpose: "engine.strategy",
    schema: StrategySchema,
    prompt,
    system: "You convert research into a tight, executable campaign strategy.",
  });
}
