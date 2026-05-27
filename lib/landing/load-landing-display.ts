import type { LandingAssetPayload } from "@/components/public/landing-page-renderer";
import { buildPublicConfigFromVersion } from "@/lib/landing/build-public-config";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createLandingPageRepository } from "@/repositories/landing-page.repository";
import { createLandingPageVersionRepository } from "@/repositories/marketing-os.repository";

export async function loadLandingPageDisplay(
  slug: string,
  options: { publishedOnly?: boolean; businessId?: string } = {},
) {
  const supabase = createServiceRoleClient();
  const landingPages = createLandingPageRepository(supabase);

  const { data: page } = options.publishedOnly
    ? await landingPages.getPublishedBySlug(slug)
    : await landingPages.getBySlug(slug, options.businessId);

  if (!page) return null;

  const pageRecord = page as Record<string, unknown>;
  let config = (pageRecord.config ?? {}) as Record<string, unknown>;
  let asset = config.asset as LandingAssetPayload | undefined;

  const versionId = pageRecord.active_version_id as string | null | undefined;
  if ((!asset?.headline || !asset?.subheadline) && versionId) {
    const versions = createLandingPageVersionRepository(supabase);
    const { data: version } = await versions.getById(versionId);
    if (version) {
      config = buildPublicConfigFromVersion(pageRecord, version as Record<string, unknown>);
      asset = config.asset as LandingAssetPayload;
    }
  }

  if (!asset?.headline) {
    asset = {
      headline: String(pageRecord.headline ?? "Get a free estimate today"),
      subheadline: String(pageRecord.subheadline ?? ""),
      primaryCta: String(pageRecord.cta_text ?? "Get Started"),
      bullets: asset?.bullets ?? [],
      socialProof: String(pageRecord.offer ?? asset?.socialProof ?? ""),
    };
  }

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getById(String(pageRecord.business_id));

  return {
    landing: pageRecord,
    business,
    asset: asset ?? {},
    config,
  };
}
