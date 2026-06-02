import type { SupabaseClient } from "@supabase/supabase-js";

import type { LaunchPlan } from "@/lib/launch-builder/types";
import { ok, fail, type ServiceResult } from "@/lib/result";
import { createCampaign } from "@/services/campaigns/campaign.service";
import { createLandingPageWithVersions } from "@/services/landing/landing-page-editor.service";

export type MaterializeLaunchResult = {
  landingPageId?: string;
  landingSlug?: string;
  campaignIds: string[];
};

export async function materializeLaunchPlan(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  plan: LaunchPlan,
  context: {
    industry?: string;
    businessType?: string;
    services?: string;
    businessName?: string;
  },
): Promise<ServiceResult<MaterializeLaunchResult>> {
  const result: MaterializeLaunchResult = { campaignIds: [] };

  const landingStep = plan.steps.find((s) => s.kind === "landing_page");
  if (landingStep?.kind === "landing_page") {
    const d = landingStep.data;
    const slug = `${plan.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-launch`;
    const lp = await createLandingPageWithVersions(client, ownerUserId, businessId, {
      slug,
      headline: d.headline,
      subheadline: d.subheadline,
      offer: d.offer,
      location: d.location,
      ctaText: d.cta,
      audience: context.services,
      industry: context.industry,
    });
    if (lp.success) {
      result.landingPageId = lp.data.landingPageId;
      result.landingSlug = lp.data.slug;
      await client
        .from("landing_pages")
        .update({
          page_status: "draft",
          meta_title: d.seoTitle,
          meta_description: d.seoDescription,
        })
        .eq("id", lp.data.landingPageId);
    }
  }

  const campaignStep = plan.steps.find((s) => s.kind === "ad_campaign");
  if (campaignStep?.kind === "ad_campaign") {
    const d = campaignStep.data;
    const platforms = d.platformRecommendation.includes("Meta") ? ["Meta", "Google"] : ["Google", "Meta"];
    for (const platform of platforms) {
      const created = await createCampaign(client, ownerUserId, {
        businessId,
        platform,
        budget: d.dailyBudgetRecommendation,
        goal: d.objective,
        location: d.geographicSettings,
        status: "draft",
      });
      if (created.success) result.campaignIds.push(created.data.id);
    }
  }

  const creativesStep = plan.steps.find((s) => s.kind === "ad_creatives");
  if (creativesStep?.kind === "ad_creatives" && result.campaignIds[0]) {
    await client
      .from("campaigns")
      .update({
        goal: JSON.stringify({
          launchPlanCreatives: creativesStep.data,
          campaignName: campaignStep?.kind === "ad_campaign" ? campaignStep.data.campaignName : null,
        }),
      })
      .eq("id", result.campaignIds[0]);
  }

  const businesses = await client.from("businesses").select("profile").eq("id", businessId).maybeSingle();
  const profile = (businesses.data?.profile ?? {}) as Record<string, unknown>;
  await client
    .from("businesses")
    .update({
      profile: {
        ...profile,
        launchPlan: { ...plan, materializedAt: new Date().toISOString() },
        launchMaterialized: result,
      },
    })
    .eq("id", businessId);

  return ok(result);
}
