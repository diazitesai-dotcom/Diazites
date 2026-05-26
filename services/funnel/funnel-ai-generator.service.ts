import type { SupabaseClient } from "@supabase/supabase-js";

import {
  generateThreeLandingPageVariants,
  variantSlug,
  type LandingPageVariantDraft,
} from "@/lib/funnel/generate-three-landing-pages";
import { isOpenAiConfigured } from "@/services/engine/ai/openai-client";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createLandingPageWithVersions } from "@/services/landing/landing-page-editor.service";

export type GeneratedLandingPage = {
  landingPageId: string;
  slug: string;
  draftVersionId: string;
  angle: string;
  angleLabel: string;
  headline: string;
  subheadline: string;
  published: boolean;
};

export async function generateAndSaveThreeLandingPages(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  prompt: string,
): Promise<ServiceResult<{ pages: GeneratedLandingPage[]; usedAi: boolean }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  let variants: LandingPageVariantDraft[];
  try {
    variants = await generateThreeLandingPageVariants({
      prompt,
      supabase: client,
      businessId,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Generation failed");
  }

  const created: GeneratedLandingPage[] = [];
  const usedAi = isOpenAiConfigured();

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]!;
    const slug = variantSlug(prompt, v.angle, i);
    const result = await createLandingPageWithVersions(client, ownerUserId, businessId, {
      slug,
      headline: v.headline,
      subheadline: v.subheadline,
      offer: v.offer,
      ctaText: v.ctaText,
      location: v.location,
      industry: v.industry,
      audience: prompt.slice(0, 200),
      sections: v.sections,
      versionName: v.angleLabel,
    });

    if (!result.success) {
      return fail(result.error ?? `Failed to create page ${i + 1}`);
    }

    created.push({
      landingPageId: result.data.landingPageId,
      slug: result.data.slug,
      draftVersionId: result.data.draftVersionId,
      angle: v.angle,
      angleLabel: v.angleLabel,
      headline: v.headline,
      subheadline: v.subheadline,
      published: false,
    });
  }

  return ok({ pages: created, usedAi });
}
