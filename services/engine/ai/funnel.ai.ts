import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ServiceResult } from "@/lib/result";
import type { EngineInputPayload } from "@/services/engine/orchestrator.service";

import { callJsonResponses } from "./openai-client";
import type { EngineResearch } from "./research.ai";
import type { EngineStrategy } from "./strategy.ai";

const NodeKindSchema = z.enum([
  "ad",
  "landing_page",
  "lead_capture",
  "thank_you",
  "followup_email",
  "followup_sms",
  "sales_call",
  "appointment",
]);

const FunnelNodeSchema = z.object({
  id: z.string().min(1),
  kind: NodeKindSchema,
  label: z.string().min(1),
  purpose: z.string().min(1),
  brief: z.string().min(1),
});

const FunnelEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

const FunnelSchema = z.object({
  summary: z.string().min(1),
  nodes: z.array(FunnelNodeSchema).min(3).max(12),
  edges: z.array(FunnelEdgeSchema).min(2).max(20),
  followupSequence: z.object({
    emails: z.array(
      z.object({
        sendAfterHours: z.number().nonnegative(),
        subject: z.string(),
        purpose: z.string(),
      }),
    ).min(1).max(7),
    sms: z.array(
      z.object({
        sendAfterHours: z.number().nonnegative(),
        purpose: z.string(),
      }),
    ).min(0).max(7),
  }),
});

export type EngineFunnel = z.infer<typeof FunnelSchema>;

export async function runFunnelStep(args: {
  supabase: SupabaseClient;
  businessId: string;
  runId: string;
  input: EngineInputPayload;
  research: EngineResearch;
  strategy: EngineStrategy;
}): Promise<ServiceResult<EngineFunnel>> {
  const { input, strategy } = args;

  const prompt = `Act as a senior conversion-funnel architect.
You are doing the "Funnel Blueprint" stage of an automated marketing pipeline.

Inputs:
- Goal / offer: ${input.goal ?? "(not provided)"}
- Funnel type chosen by strategy: ${strategy.funnelType}
- Offer headline: ${strategy.offer.headline}
- Primary CTA: ${strategy.cta.primary}
- Primary traffic source: ${input.trafficSource ?? strategy.trafficStrategy[0]?.channel ?? "(unspecified)"}

Return JSON with EXACTLY this shape:
{
  "summary": string — 1-2 sentence summary of the funnel,
  "nodes": [
    {
      "id": string — short kebab id (e.g. "ad", "lp", "capture", "thank-you", "email-1"),
      "kind": one of "ad" | "landing_page" | "lead_capture" | "thank_you" | "followup_email" | "followup_sms" | "sales_call" | "appointment",
      "label": string — short display label,
      "purpose": string — 1 sentence on why this step exists,
      "brief": string — 1-2 sentence creative/UX brief for the asset team
    }
  ] — between 4 and 10 nodes; must include at least one of: ad, landing_page, lead_capture, thank_you,
  "edges": [
    { "from": "<nodeId>", "to": "<nodeId>" }
  ] — directed edges; every non-root node must have an incoming edge,
  "followupSequence": {
    "emails": [
      {
        "sendAfterHours": number — non-negative, e.g. 0, 24, 72, 168,
        "subject": string,
        "purpose": string — 1 sentence on the email's job
      }
    ] — 3-5 emails,
    "sms": [
      {
        "sendAfterHours": number,
        "purpose": string
      }
    ] — 0-3 SMS messages
  }
}

The funnel must be coherent and minimal — no orphaned nodes. Match cadence to the funnelType.`;

  return callJsonResponses({
    supabase: args.supabase,
    businessId: args.businessId,
    runId: args.runId,
    purpose: "engine.funnel",
    schema: FunnelSchema,
    prompt,
    system: "You produce executable funnel blueprints that downstream agents can build directly.",
  });
}
