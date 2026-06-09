import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicAppUrl } from "@/lib/env";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createEngineRepository,
  type AssetRow,
  type EngineRunRow,
} from "@/repositories/engine.repository";
import { createLandingPageRepository } from "@/repositories/landing-page.repository";
import { loadBusinessTrackingPixels } from "@/services/integrations/tracking-connect.service";

export type QaCheck = {
  id: string;
  label: string;
  pass: boolean;
  detail?: string;
};

export type LaunchPayload = {
  status: "launched" | "qa_failed";
  landingPageId: string | null;
  slug: string | null;
  publicUrl: string | null;
  qa: {
    passed: boolean;
    checks: QaCheck[];
  };
  utm: {
    source: string;
    medium: string;
    campaign: string;
  };
  pixels: {
    metaPixelId: string;
    googleConversionId: string;
    googleConversionLabel: string;
  };
  conversionEvents: string[];
};

/**
 * Materialize the winning landing-page asset into the `landing_pages` table
 * (created in migration 002), run QA checks, build pixel + UTM defaults, and
 * return a launch payload describing the result for the engine run.
 */
export async function launchWinningLandingPage(
  client: SupabaseClient,
  run: EngineRunRow,
): Promise<ServiceResult<LaunchPayload>> {
  if (!run.winner_asset_id) {
    return fail(
      "No winning landing page yet — run the Scoring step first.",
      "no_winner",
    );
  }

  const engine = createEngineRepository(client);
  const { data: allAssets, error: assetsErr } = await engine.listAssetsForRun(run.id);
  if (assetsErr) return fail(assetsErr.message);
  const assets = (allAssets ?? []) as AssetRow[];

  const winner = assets.find((a) => a.id === run.winner_asset_id);
  if (!winner) return fail("Winning asset not found on run", "missing_asset");
  if (winner.kind !== "landing_page") {
    return fail(
      `Winning asset is of kind "${winner.kind}"; expected "landing_page".`,
      "invalid_kind",
    );
  }

  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(run.business_id);
  if (!business) return fail("Business not found", "missing_business");

  const checks = runQaChecks(winner);
  const passed = checks.every((c) => c.pass);

  const headline = typeof winner.payload.headline === "string" ? winner.payload.headline : null;
  const input = run.input_payload as Record<string, unknown>;
  const offerString =
    (typeof input.goal === "string" ? input.goal : null) ??
    headline ??
    "Get more leads";
  const location =
    (typeof input.location === "string" ? input.location : null) ??
    business.city_state ??
    null;

  const slugBase = headline ?? offerString;
  const slug = await generateUniqueSlug(client, run.business_id, slugBase);

  const utm = {
    source: deriveUtmSource(typeof input.trafficSource === "string" ? input.trafficSource : null),
    medium: "cpc",
    campaign: toSlug(slugBase).slice(0, 48) || "growth-engine",
  };

  const tracking = await loadBusinessTrackingPixels(client, run.business_id);
  const pixels = {
    metaPixelId: tracking.metaPixelId ?? "__SET_META_PIXEL_ID__",
    googleConversionId: tracking.googleConversionId ?? "__SET_GOOGLE_CONVERSION_ID__",
    googleConversionLabel: "__SET_GOOGLE_CONVERSION_LABEL__",
  };

  const conversionEvents = ["page_view", "cta_click", "lead_submit"];

  if (!passed) {
    return ok({
      status: "qa_failed",
      landingPageId: null,
      slug: null,
      publicUrl: null,
      qa: { passed, checks },
      utm,
      pixels,
      conversionEvents,
    });
  }

  const landingPages = createLandingPageRepository(client);
  const { data: lp, error: lpErr } = await landingPages.upsertBySlug({
    businessId: run.business_id,
    slug,
    headline,
    offer: offerString,
    location,
    published: true,
    engineRunId: run.id,
    engineAssetId: winner.id,
    config: {
      asset: winner.payload,
      score: winner.score,
      utm,
      pixels,
      conversionEvents,
      qa: { passed, checks },
      launchedAt: new Date().toISOString(),
    },
  });

  if (lpErr || !lp) {
    return fail(lpErr?.message ?? "Failed to write landing page");
  }

  const publicUrl = `${getPublicAppUrl()}/p/${slug}`;

  return ok({
    status: "launched",
    landingPageId: lp.id as string,
    slug,
    publicUrl,
    qa: { passed, checks },
    utm,
    pixels,
    conversionEvents,
  });
}

/**
 * 7-check QA suite gating an automatic launch.
 * Mirrors the diagram's Launch System checklist items.
 */
export function runQaChecks(asset: AssetRow): QaCheck[] {
  const p = asset.payload;
  const headline = typeof p.headline === "string" ? p.headline : "";
  const subheadline = typeof p.subheadline === "string" ? p.subheadline : "";
  const cta = typeof p.primaryCta === "string" ? p.primaryCta : "";
  const social = typeof p.socialProof === "string" ? p.socialProof : "";
  const heroBrief = typeof p.heroImageBrief === "string" ? p.heroImageBrief : "";
  const bullets = Array.isArray(p.bullets) ? p.bullets : [];

  const headlineWords = headline.trim().split(/\s+/).filter(Boolean);
  const totalCopyWords = [
    headline,
    subheadline,
    cta,
    social,
    ...bullets.filter((b): b is string => typeof b === "string"),
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return [
    {
      id: "headline_length",
      label: "Headline length (4–14 words)",
      pass: headlineWords.length >= 4 && headlineWords.length <= 14,
      detail: `${headlineWords.length} words`,
    },
    {
      id: "subheadline_present",
      label: "Subheadline present",
      pass: subheadline.length > 0,
    },
    {
      id: "bullets_count",
      label: "Between 2 and 6 bullets",
      pass: bullets.length >= 2 && bullets.length <= 6,
      detail: `${bullets.length} bullets`,
    },
    {
      id: "primary_cta_present",
      label: "Primary CTA present",
      pass: cta.length > 0 && cta.split(/\s+/).length <= 6,
    },
    {
      id: "social_proof_present",
      label: "Social proof line present",
      pass: social.length > 0,
    },
    {
      id: "hero_brief_present",
      label: "Hero image brief present",
      pass: heroBrief.length > 0,
    },
    {
      id: "mobile_friendly_length",
      label: "Mobile-friendly total length (≤ 200 words)",
      pass: totalCopyWords <= 200,
      detail: `${totalCopyWords} words total`,
    },
  ];
}

function deriveUtmSource(trafficSource: string | null): string {
  if (!trafficSource) return "direct";
  const lower = trafficSource.toLowerCase();
  if (lower.includes("meta") || lower.includes("facebook") || lower.includes("instagram")) {
    return "meta";
  }
  if (lower.includes("google")) return "google";
  if (lower.includes("tiktok")) return "tiktok";
  if (lower.includes("microsoft") || lower.includes("bing")) return "bing";
  return toSlug(lower).slice(0, 32) || "direct";
}

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function generateUniqueSlug(
  client: SupabaseClient,
  businessId: string,
  base: string,
): Promise<string> {
  const repo = createLandingPageRepository(client);
  const root = toSlug(base) || "offer";

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate =
      attempt === 0 ? `${root}-${randomToken(6)}` : `${root}-${randomToken(8)}`;
    const { data: existing } = await repo.slugExists(businessId, candidate);
    if (!existing?.id) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
}

function randomToken(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
