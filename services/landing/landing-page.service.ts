import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createLandingPageRepository } from "@/repositories/landing-page.repository";

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

  const slug = opts.slug ?? `biz-${businessId.slice(0, 8)}`;
  const landing = createLandingPageRepository(client);
  const { data, error } = await landing.upsertBySlug({
    businessId,
    slug,
    headline: opts.headline,
    offer: opts.offer,
    location: opts.location,
    config: { generatedAt: new Date().toISOString() },
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
