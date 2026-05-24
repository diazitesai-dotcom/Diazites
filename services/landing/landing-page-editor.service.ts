import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createLandingPageRepository } from "@/repositories/landing-page.repository";
import {
  createLandingPageAnalyticsRepository,
  createLandingPageAssetRepository,
  createLandingPageVersionRepository,
} from "@/repositories/marketing-os.repository";
import { EVENT_TYPES } from "@/types/backend";
import type {
  AiConversionScores,
  LandingFormField,
  LandingSection,
  LandingVersionLabel,
} from "@/types/marketing-os";
import { DEFAULT_FORM_FIELDS, DEFAULT_LANDING_SECTIONS } from "@/types/marketing-os";

import { writeAuditLog } from "@/services/audit/audit.service";
import { triggerEvent } from "@/services/events/event-dispatcher";

export type LandingPageEditorInput = {
  slug?: string;
  headline: string;
  subheadline?: string;
  offer: string;
  ctaText?: string;
  location: string;
  audience?: string;
  industry?: string;
  campaignId?: string | null;
};

export async function createLandingPageWithVersions(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  input: LandingPageEditorInput,
): Promise<ServiceResult<{ landingPageId: string; slug: string; draftVersionId: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const slug = input.slug ?? `page-${Date.now().toString(36)}`;
  const landing = createLandingPageRepository(client);
  const { data: page, error: pageError } = await landing.upsertBySlug({
    businessId,
    slug,
    headline: input.headline,
    offer: input.offer,
    location: input.location,
    config: {},
    published: false,
  });

  if (pageError || !page) return fail(pageError?.message ?? "Failed to create landing page");

  await client
    .from("landing_pages")
    .update({
      subheadline: input.subheadline ?? null,
      cta_text: input.ctaText ?? "Get Started",
      audience: input.audience ?? null,
      industry: input.industry ?? null,
      campaign_id: input.campaignId ?? null,
      status: "draft",
    })
    .eq("id", page.id);

  const sections = buildSectionsFromInput(input);
  const versions = createLandingPageVersionRepository(client);
  const { data: draftVersion, error: versionError } = await versions.create({
    landingPageId: page.id,
    businessId,
    versionLabel: "draft",
    name: "Draft",
    sections,
    formFields: DEFAULT_FORM_FIELDS,
    trafficWeight: 0,
  });

  if (versionError || !draftVersion) {
    return fail(versionError?.message ?? "Failed to create draft version");
  }

  await client
    .from("landing_pages")
    .update({ active_version_id: draftVersion.id })
    .eq("id", page.id);

  await writeAuditLog(client, {
    businessId,
    actorUserId: ownerUserId,
    action: "landing_page.created",
    entityType: "landing_page",
    entityId: page.id,
  });

  return ok({
    landingPageId: page.id,
    slug: page.slug,
    draftVersionId: draftVersion.id,
  });
}

function buildSectionsFromInput(input: LandingPageEditorInput): LandingSection[] {
  return DEFAULT_LANDING_SECTIONS.map((section) => {
    if (section.type === "hero") {
      return {
        ...section,
        content: {
          headline: input.headline,
          subheadline: input.subheadline ?? "",
          cta: input.ctaText ?? "Get Started",
          location: input.location,
        },
      };
    }
    if (section.type === "offer") {
      return { ...section, content: { title: "Our Offer", body: input.offer } };
    }
    return section;
  });
}

export async function updateLandingPageVersion(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  versionId: string,
  patch: {
    sections?: LandingSection[];
    formFields?: LandingFormField[];
    name?: string;
    trafficWeight?: number;
  },
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const versions = createLandingPageVersionRepository(client);
  const { data: version } = await versions.getById(versionId);
  if (!version || version.business_id !== businessId) {
    return fail("Version not found", "NOT_FOUND");
  }

  const { data, error } = await versions.update(versionId, {
    sections: patch.sections,
    formFields: patch.formFields,
    name: patch.name,
    trafficWeight: patch.trafficWeight,
  });

  if (error || !data) return fail(error?.message ?? "Update failed");
  return ok(data);
}

export async function createLandingPageVariant(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  landingPageId: string,
  sourceVersionId: string,
  label: LandingVersionLabel,
  name: string,
): Promise<ServiceResult<{ versionId: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const versions = createLandingPageVersionRepository(client);
  const { data: source } = await versions.getById(sourceVersionId);
  if (!source || source.business_id !== businessId) {
    return fail("Source version not found", "NOT_FOUND");
  }

  const { data, error } = await versions.create({
    landingPageId,
    businessId,
    versionLabel: label,
    name,
    sections: source.sections as LandingSection[],
    formFields: source.form_fields as LandingFormField[],
    trafficWeight: label === "a" ? 34 : label === "b" ? 33 : label === "c" ? 33 : 0,
  });

  if (error || !data) return fail(error?.message ?? "Failed to create variant");
  return ok({ versionId: data.id });
}

export async function publishLandingPage(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  landingPageId: string,
  versionId: string,
): Promise<ServiceResult<{ slug: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const versions = createLandingPageVersionRepository(client);
  await versions.update(versionId, {
    versionLabel: "published",
    publishedAt: new Date().toISOString(),
  });

  const { data: page, error } = await client
    .from("landing_pages")
    .update({
      published: true,
      status: "published",
      active_version_id: versionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", landingPageId)
    .eq("business_id", businessId)
    .select("slug")
    .single();

  if (error || !page) return fail(error?.message ?? "Publish failed");

  await triggerEvent(client, {
    type: EVENT_TYPES.LANDING_PAGE_PUBLISHED,
    businessId,
    payload: { landingPageId, versionId, slug: page.slug },
  });

  await writeAuditLog(client, {
    businessId,
    actorUserId: ownerUserId,
    action: "landing_page.published",
    entityType: "landing_page",
    entityId: landingPageId,
  });

  return ok({ slug: page.slug });
}

export async function cloneLandingPage(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  landingPageId: string,
): Promise<ServiceResult<{ landingPageId: string; slug: string }>> {
  const { data: page } = await client
    .from("landing_pages")
    .select("*")
    .eq("id", landingPageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!page) return fail("Landing page not found", "NOT_FOUND");

  return createLandingPageWithVersions(client, ownerUserId, businessId, {
    slug: `${page.slug}-copy`,
    headline: page.headline ?? "",
    subheadline: page.subheadline ?? "",
    offer: page.offer ?? "",
    location: page.location ?? "",
    audience: page.audience ?? "",
    industry: page.industry ?? "",
    ctaText: page.cta_text ?? "Get Started",
    campaignId: page.campaign_id,
  });
}

export async function listLandingPagesForBusiness(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
): Promise<ServiceResult<unknown[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const landing = createLandingPageRepository(client);
  const { data, error } = await landing.listByBusiness(businessId);
  if (error) return fail(error.message);

  const versions = createLandingPageVersionRepository(client);
  const enriched = await Promise.all(
    (data ?? []).map(async (page) => {
      const { data: pageVersions } = await versions.listByLandingPage(page.id);
      return { ...page, versions: pageVersions ?? [] };
    }),
  );

  return ok(enriched);
}

export async function getLandingPageEditorState(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  landingPageId: string,
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const { data: page } = await client
    .from("landing_pages")
    .select("*")
    .eq("id", landingPageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!page) return fail("Not found", "NOT_FOUND");

  const versions = createLandingPageVersionRepository(client);
  const assets = createLandingPageAssetRepository(client);
  const analytics = createLandingPageAnalyticsRepository(client);

  const [{ data: pageVersions }, { data: pageAssets }, { data: pageAnalytics }] =
    await Promise.all([
      versions.listByLandingPage(landingPageId),
      assets.listByLandingPage(landingPageId),
      analytics.summaryByLandingPage(landingPageId),
    ]);

  return ok({
    page,
    versions: pageVersions ?? [],
    assets: pageAssets ?? [],
    analytics: pageAnalytics ?? [],
    aiScores: scoreLandingPageConversion(page, pageVersions?.[0]),
  });
}

export function scoreLandingPageConversion(
  page: Record<string, unknown>,
  version?: Record<string, unknown> | null,
): AiConversionScores {
  const headline = String(page.headline ?? "");
  const cta = String(page.cta_text ?? "Get Started");
  const formFields = (version?.form_fields as LandingFormField[] | undefined) ?? DEFAULT_FORM_FIELDS;
  const requiredCount = formFields.filter((f) => f.required).length;

  const headlineScore = Math.min(100, 40 + headline.length * 1.2 + (headline.includes("?") ? 5 : 0));
  const ctaScore = Math.min(100, cta.length >= 8 && cta.length <= 24 ? 85 : 65);
  const formFrictionScore = Math.max(20, 100 - requiredCount * 12);
  const expectedConversionLift = Math.round((headlineScore + ctaScore + formFrictionScore) / 30);

  const recommendations: string[] = [];
  if (headline.length < 30) recommendations.push("Expand headline with a specific outcome or timeframe.");
  if (requiredCount > 4) recommendations.push("Reduce required form fields to lower friction.");
  if (!String(page.subheadline ?? "").trim()) recommendations.push("Add a subheadline to reinforce the offer.");

  return {
    headlineScore: Math.round(headlineScore),
    ctaScore: Math.round(ctaScore),
    formFrictionScore: Math.round(formFrictionScore),
    expectedConversionLift,
    recommendations,
  };
}

export async function suggestAbTestWinner(
  client: SupabaseClient,
  businessId: string,
  landingPageId: string,
): Promise<ServiceResult<{ winnerVersionId: string | null; reason: string }>> {
  const analytics = createLandingPageAnalyticsRepository(client);
  const { data } = await analytics.summaryByLandingPage(landingPageId);
  const rows = data ?? [];

  const byVersion = new Map<string, { visitors: number; submissions: number }>();
  for (const row of rows) {
    const vid = row.version_id as string | null;
    if (!vid) continue;
    const current = byVersion.get(vid) ?? { visitors: 0, submissions: 0 };
    current.visitors += row.visitors ?? 0;
    current.submissions += row.submissions ?? 0;
    byVersion.set(vid, current);
  }

  let bestId: string | null = null;
  let bestRate = -1;
  for (const [vid, stats] of byVersion) {
    const rate = stats.visitors > 0 ? stats.submissions / stats.visitors : 0;
    if (rate > bestRate) {
      bestRate = rate;
      bestId = vid;
    }
  }

  if (bestId) {
    const versions = createLandingPageVersionRepository(client);
    await versions.update(bestId, { isWinner: true });
    return ok({
      winnerVersionId: bestId,
      reason: `Version converts at ${(bestRate * 100).toFixed(1)}% based on analytics.`,
    });
  }

  return ok({ winnerVersionId: null, reason: "Insufficient traffic data for A/B winner detection." });
}

export async function recordLandingPageVisit(
  client: SupabaseClient,
  input: {
    businessId: string;
    landingPageId: string;
    versionId?: string | null;
    campaignId?: string | null;
    source?: string | null;
    utmCampaign?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
  },
): Promise<void> {
  const analytics = createLandingPageAnalyticsRepository(client);
  await analytics.recordVisit(input);
}

export async function addLandingPageAsset(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  input: {
    landingPageId: string;
    assetType: string;
    fileUrl: string;
    fileName?: string;
    mimeType?: string;
  },
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const assets = createLandingPageAssetRepository(client);
  const { data, error } = await assets.create({
    businessId,
    landingPageId: input.landingPageId,
    assetType: input.assetType,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    mimeType: input.mimeType,
  });

  if (error || !data) return fail(error?.message ?? "Failed to add asset");
  return ok(data);
}
