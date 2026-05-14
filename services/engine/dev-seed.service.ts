import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createEngineRepository,
  type EngineRunRow,
} from "@/repositories/engine.repository";

/**
 * Build a fully-prepared engine run that is one click away from triggering
 * the real Launch System. Skips the AI stages so you can validate the launch
 * path (QA checks, landing page upsert, slug + UTM + pixel setup, run status
 * transition to `launched`, owner notification) without burning OpenAI tokens.
 *
 * Strictly a dev/QA affordance. The server action that calls this is gated to
 * `NODE_ENV !== "production"`.
 */
export async function seedReadyToLaunchRun(
  client: SupabaseClient,
  businessId: string,
): Promise<ServiceResult<EngineRunRow>> {
  const engine = createEngineRepository(client);

  // Archive any active run so the UI shows the seeded one as the single
  // active run. Dev-only path; non-destructive (data stays in history).
  const { data: existingActive } = await engine.getActiveRunForBusiness(businessId);
  if (existingActive?.id) {
    await engine.updateStatus(existingActive.id as string, "archived");
  }

  const inputPayload = {
    websiteUrl: "https://example-roofing.com",
    niche: "Roofing",
    goal: "Generate 25 storm-damage inspection leads / month",
    targetAudience: "Homeowners in Florida with storm-damaged roofs",
    location: "Tampa, FL",
    budget: 1500,
    trafficSource: "Meta Ads",
    _seed: true,
  };

  const { data: runData, error: createErr } = await engine.createRun({
    businessId,
    inputPayload,
  });
  if (createErr || !runData) {
    return fail(createErr?.message ?? "Failed to create seed run");
  }
  const runId = (runData as { id: string }).id;

  for (const step of [
    "research",
    "strategy",
    "funnel",
    "generation",
    "variants",
    "scoring",
  ] as const) {
    await engine.updateStepPayload(runId, step, STEP_PAYLOADS[step]);
  }

  const landingPages = LANDING_PAGE_VARIANTS.map((v) => ({
    runId,
    businessId,
    kind: "landing_page" as const,
    variantLabel: v.label,
    payload: v.payload,
  }));
  const { data: insertedAssets, error: insertErr } = await engine.insertAssetsBulk(landingPages);
  if (insertErr) {
    return fail(insertErr.message);
  }
  const inserted = (insertedAssets ?? []) as Array<{ id: string; variant_label: string }>;
  const winner = inserted.find((a) => a.variant_label === "A") ?? inserted[0];
  if (!winner) {
    return fail("Failed to insert seed landing-page variants");
  }

  for (const asset of inserted) {
    const isWinner = asset.id === winner.id;
    await engine.updateAssetScore(
      asset.id,
      {
        clarity: isWinner ? 95 : 80,
        trust: isWinner ? 92 : 78,
        emotionalImpact: isWinner ? 90 : 75,
        ctaStrength: isWinner ? 94 : 79,
        mobileUx: isWinner ? 91 : 76,
        conversionPotential: isWinner ? 93 : 77,
        total: isWinner ? 92.5 : 77.5,
      },
      isWinner,
    );
  }

  await engine.setWinnerAsset(runId, winner.id);

  await engine.updateStep(runId, "scoring");

  const { data: refreshed, error: refreshErr } = await engine.getRunById(runId);
  if (refreshErr || !refreshed) {
    return fail(refreshErr?.message ?? "Failed to reload seeded run");
  }
  return ok(refreshed as EngineRunRow);
}

const STEP_PAYLOADS: Record<string, Record<string, unknown>> = {
  research: {
    _seed: true,
    audienceProfile: "Florida homeowners 35-65 with storm-damaged roofs",
    painPoints: ["Insurance claim confusion", "Quote shopping fatigue", "Storm-season urgency"],
    offerAngles: ["Free 60-second storm damage check", "Insurance-claim help included"],
    keywords: ["roof inspection tampa", "storm damage roof repair", "insurance roof claim"],
    positioningHooks: ["Fastest free inspection in Tampa", "Insurance-paid roofs done right"],
    competitors: [
      { name: "Sample Roofing Co", strength: "Fast quotes" },
      { name: "Florida Roofers", strength: "Insurance expertise" },
    ],
    marketInsights: ["Hurricane season demand spikes 5x", "Insurance claim approval ~67%"],
  },
  strategy: {
    _seed: true,
    positioning: "Tampa's fastest free storm-damage roof check, insurance handled for you.",
    offer: "Free 60-second storm damage check + we handle the insurance paperwork.",
    cta: "Get my free storm check",
    funnelType: "lead_magnet_to_inspection_call",
    trafficStrategy: ["Meta Ads (storm-season urgency)", "Google Search (intent keywords)"],
    successMetrics: { cplTarget: 28, conversionTarget: 0.18, weeklyLeadTarget: 6 },
  },
  funnel: {
    _seed: true,
    summary: "Ad → Storm-check LP → form lead → calendar booking → AI follow-up SMS + email",
    nodes: [
      { id: "ad", label: "Storm-Season Meta Ad" },
      { id: "lp", label: "Landing Page" },
      { id: "capture", label: "Lead Capture Form" },
      { id: "thankyou", label: "Booking + Thank You" },
      { id: "followup", label: "AI Follow-Up Sequence" },
    ],
    edges: [
      { from: "ad", to: "lp" },
      { from: "lp", to: "capture" },
      { from: "capture", to: "thankyou" },
      { from: "thankyou", to: "followup" },
    ],
    followupSequence: {
      emails: ["t+0h confirmation", "t+24h soft nudge", "t+72h case study"],
      sms: ["t+15m text from rep", "t+24h reminder"],
    },
  },
  generation: {
    _seed: true,
    plannedAssets: [
      "landing_page",
      "ad",
      "email",
      "sms",
      "headline",
      "faq",
      "lead_magnet",
      "social_proof",
    ],
    note: "Seeded: only landing_page variants are materialized for the launch test.",
  },
  variants: {
    _seed: true,
    assetsCreated: 4,
    kinds: ["landing_page"],
    variantLabels: ["A", "B", "C", "D"],
    note: "Seeded: 4 landing_page variants inserted; A is the pre-marked winner.",
  },
  scoring: {
    _seed: true,
    rubric: [
      "clarity",
      "trust",
      "emotionalImpact",
      "ctaStrength",
      "mobileUx",
      "conversionPotential",
    ],
    winnerByKind: { landing_page: "A" },
    scores: [
      { kind: "landing_page", variantLabel: "A", total: 92.5 },
      { kind: "landing_page", variantLabel: "B", total: 78.0 },
      { kind: "landing_page", variantLabel: "C", total: 75.5 },
      { kind: "landing_page", variantLabel: "D", total: 73.0 },
    ],
  },
};

const LANDING_PAGE_VARIANTS: ReadonlyArray<{
  label: string;
  payload: Record<string, unknown>;
}> = [
  {
    label: "A",
    payload: {
      headline: "Free Storm Damage Roof Check, Done in 60 Seconds",
      subheadline:
        "Tampa homeowners: we inspect your roof for hurricane damage and handle the insurance paperwork — no out-of-pocket cost.",
      bullets: [
        "Same-week inspection slots open",
        "We deal with the insurance adjuster for you",
        "5,000+ Tampa roofs restored since 2019",
        "Licensed, bonded, and BBB A+",
      ],
      primaryCta: "Get my free storm check",
      socialProof: "Rated 4.9/5 by 1,200+ Tampa Bay homeowners",
      heroImageBrief:
        "Aerial drone shot of a sun-lit Florida home with a freshly-restored shingle roof, blue sky.",
    },
  },
  {
    label: "B",
    payload: {
      headline: "Storm Hit? Free Roof Inspection in Tampa Today",
      subheadline:
        "Most claims approved in under 14 days. Zero cost to you if covered by insurance.",
      bullets: [
        "Free 60-second inspection request",
        "Insurance claim filed for you",
        "Local crews, no subcontractors",
      ],
      primaryCta: "Book my free inspection",
      socialProof: "Featured on Bay News 9 after Hurricane Eta",
      heroImageBrief: "Close-up of a roofer in branded shirt inspecting shingles with a tablet.",
    },
  },
  {
    label: "C",
    payload: {
      headline: "Don't Pay Out of Pocket for a Storm-Damaged Roof",
      subheadline:
        "We document, file, and fight your claim — and rebuild your roof with insurance funds.",
      bullets: [
        "Free pre-claim inspection",
        "Insurance specialists on staff",
        "Done in one visit",
      ],
      primaryCta: "Claim my free inspection",
      socialProof: "$22M+ in approved roof claims for our customers",
      heroImageBrief: "Side-by-side before/after of a storm-damaged versus restored roof.",
    },
  },
  {
    label: "D",
    payload: {
      headline: "Tampa Bay Roofers: Fast, Free, Insurance-Friendly",
      subheadline:
        "We inspect, document, and file. You sign and we rebuild.",
      bullets: [
        "60-second inspection request",
        "Insurance paperwork handled",
        "Lifetime workmanship warranty",
      ],
      primaryCta: "Start my inspection",
      socialProof: "Locally owned. 5-star Google rating.",
      heroImageBrief: "Branded company truck parked beside a newly-restored Florida home.",
    },
  },
];
