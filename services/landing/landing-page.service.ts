import type { SupabaseClient } from "@supabase/supabase-js";

import {
  generateThreeLandingPageVariants,
  slugifyFunnelInput,
} from "@/lib/funnel/generate-three-landing-pages";
import { buildPublicConfigFromVersion } from "@/lib/landing/build-public-config";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createLandingPageRepository } from "@/repositories/landing-page.repository";
import type { LandingSection } from "@/types/marketing-os";

const LANDING_THEMES = ["violet", "cyan", "emerald", "amber", "rose", "indigo"] as const;
const LANDING_DESIGNS = ["aurora", "spotlight", "editorial", "minimal"] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export async function generateLandingPage(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  opts: { slug?: string; headline: string; offer: string; location: string },
): Promise<ServiceResult<{ id: string; slug: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const businessName = String(business.name ?? "Your business");

  // Generate AI-written, visually distinct content. A random theme + layout is
  // chosen on every call so no two generated pages share the same look.
  let sections: LandingSection[] = [];
  let asset: Record<string, unknown> = {};
  const theme = pickRandom(LANDING_THEMES);
  const design = pickRandom(LANDING_DESIGNS);

  try {
    const prompt = [
      businessName,
      opts.offer ? `Offer: ${opts.offer}.` : "",
      opts.location ? `Location: ${opts.location}.` : "",
      opts.headline ? `Focus: ${opts.headline}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const variants = await generateThreeLandingPageVariants({
      prompt,
      supabase: client,
      businessId,
      accountBusinessName: businessName,
    });
    const variant = pickRandom(variants);

    if (variant) {
      // Stamp the chosen theme + design onto the hero so the renderer varies.
      sections = variant.sections.map((s) =>
        s.type === "hero"
          ? { ...s, content: { ...s.content, theme, design } }
          : s,
      );
      const built = buildPublicConfigFromVersion(
        { headline: opts.headline, offer: opts.offer, location: opts.location },
        { sections },
      );
      asset = { ...(built.asset as Record<string, unknown>), theme, design };
    }
  } catch {
    // Fall back to a minimal config below if generation fails.
  }

  const slug =
    opts.slug ?? `${slugifyFunnelInput(businessName).slice(0, 24) || "page"}-${randomSuffix()}`;

  const landing = createLandingPageRepository(client);
  const { data, error } = await landing.upsertBySlug({
    businessId,
    slug,
    headline: opts.headline,
    offer: opts.offer,
    location: opts.location,
    config: {
      generatedAt: new Date().toISOString(),
      theme,
      design,
      asset,
      sections,
    },
    published: false,
  });

  if (error || !data) return fail(error?.message ?? "Landing page save failed");
  return ok({ id: data.id, slug: data.slug });
}

export async function updateLandingPage(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  slug: string,
  patch: Partial<{ headline: string; offer: string; location: string; published: boolean; config: Record<string, unknown> }>,
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const landing = createLandingPageRepository(client);
  const { data: existing } = await client
    .from("landing_pages")
    .select("*")
    .eq("business_id", businessId)
    .eq("slug", slug)
    .maybeSingle();

  if (!existing) return fail("Landing page not found", "NOT_FOUND");

  const { data, error } = await client
    .from("landing_pages")
    .update({
      headline: patch.headline ?? existing.headline,
      offer: patch.offer ?? existing.offer,
      location: patch.location ?? existing.location,
      published: patch.published ?? existing.published,
      config: patch.config ?? existing.config,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) return fail(error?.message ?? "Update failed");
  return ok(data);
}

export async function getLandingPageBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<ServiceResult<Record<string, unknown>>> {
  const landing = createLandingPageRepository(client);
  const { data, error } = await landing.getPublishedBySlug(slug);
  if (error) return fail(error.message);
  if (!data) return fail("Not found", "NOT_FOUND");
  return ok(data as Record<string, unknown>);
}
