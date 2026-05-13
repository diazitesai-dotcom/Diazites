import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ServiceResult } from "@/lib/result";
import type { EngineInputPayload } from "@/services/engine/orchestrator.service";

import { callJsonResponses } from "./openai-client";

const CompetitorSchema = z.object({
  name: z.string(),
  why: z.string(),
});

const ResearchSchema = z.object({
  audienceProfile: z.string().min(1),
  painPoints: z.array(z.string()).min(1).max(8),
  offerAngles: z.array(z.string()).min(1).max(8),
  keywords: z.array(z.string()).min(1).max(20),
  positioningHooks: z.array(z.string()).min(1).max(6),
  competitors: z.array(CompetitorSchema).min(0).max(8),
  marketInsights: z.array(z.string()).min(1).max(8),
});

export type EngineResearch = z.infer<typeof ResearchSchema>;

export async function runResearchStep(args: {
  supabase: SupabaseClient;
  businessId: string;
  runId: string;
  input: EngineInputPayload;
  businessContext?: {
    name?: string | null;
    services?: string | null;
    cityState?: string | null;
  };
}): Promise<ServiceResult<EngineResearch>> {
  const ctx = args.businessContext ?? {};

  const prompt = `Act as a senior direct-response marketing strategist with deep expertise in the user's niche.
You are doing the "AI Research Engine" stage of an automated marketing pipeline for a small business.

Business profile:
- Name: ${ctx.name ?? "(unknown)"}
- Services offered: ${ctx.services ?? "(unspecified)"}
- City / state: ${ctx.cityState ?? args.input.location ?? "(unspecified)"}

User-supplied campaign inputs:
- Website URL: ${args.input.websiteUrl ?? "(not provided)"}
- Niche / industry: ${args.input.niche ?? "(not provided)"}
- Goal / offer: ${args.input.goal ?? "(not provided)"}
- Target audience: ${args.input.targetAudience ?? "(not provided)"}
- Location: ${args.input.location ?? "(not provided)"}
- Monthly ad budget (USD): ${args.input.budget ?? "(not provided)"}
- Primary traffic source: ${args.input.trafficSource ?? "(not provided)"}

Return a JSON object with EXACTLY this shape:
{
  "audienceProfile": string — 2-3 sentence description of the ideal customer (demographics, psychographics, decision triggers),
  "painPoints": string[] — 4-8 concrete pains this audience feels right now,
  "offerAngles": string[] — 4-8 distinct positioning angles for the offer,
  "keywords": string[] — 8-15 high-intent search keywords/phrases,
  "positioningHooks": string[] — 3-6 short hook lines (≤ 12 words each) suitable for ad headlines,
  "competitors": [{ "name": string, "why": string — 1 sentence on what they do well or poorly }] — 3-6 likely local/regional competitors,
  "marketInsights": string[] — 3-6 observations about market timing, seasonality, or recent shifts
}

Be specific to the business's niche and location. Avoid generic marketing platitudes.`;

  return callJsonResponses({
    supabase: args.supabase,
    businessId: args.businessId,
    runId: args.runId,
    purpose: "engine.research",
    schema: ResearchSchema,
    prompt,
    system: "You produce concise, structured marketing research suitable for downstream AI agents.",
  });
}
