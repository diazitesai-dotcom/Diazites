import type { SupabaseClient } from "@supabase/supabase-js";

import type { CommandCenterLaunchPayload } from "@/lib/onboarding/command-center-payload";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { markIntegrationsConnectedForUser } from "@/lib/integrations/integration-connection-status";
import { persistZernioConnectedPlatforms } from "@/lib/integrations/load-zernio-accounts-for-adops";
import { createAdAccountRepository } from "@/repositories/ad-account.repository";
import { createPipelineRepository } from "@/repositories/pipeline.repository";
import { createLandingPageWithVersions } from "@/services/landing/landing-page-editor.service";
import type { BusinessProfileFields, OfferGoalsFields } from "@/types/ceo-command-center";

export async function materializeCommandCenterLaunch(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  profile: BusinessProfileFields,
  offerGoals: OfferGoalsFields,
  launch: CommandCenterLaunchPayload,
): Promise<ServiceResult<{ landingPageId?: string; pipelineId?: string }>> {
  const out: { landingPageId?: string; pipelineId?: string } = {};

  if (launch.logoUrl?.startsWith("http")) {
    await client
      .from("businesses")
      .update({ logo_url: launch.logoUrl })
      .eq("id", businessId);
  }

  const slug =
    launch.landingSettings.pageSlug.trim() ||
    `${profile.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "launch"}-page`;

  const lp = await createLandingPageWithVersions(client, ownerUserId, businessId, {
    slug,
    headline: launch.landingDraft.heroHeadline || profile.businessName,
    subheadline: launch.landingDraft.subheadline || profile.mainOffer,
    offer: launch.landingDraft.offerDetails || profile.mainOffer,
    location: profile.address || profile.targetCustomer,
    ctaText: launch.landingSettings.buttonText || launch.landingDraft.ctaText,
    audience: profile.targetCustomer,
    industry: profile.industry,
  });

  if (lp.success) {
    out.landingPageId = lp.data.landingPageId;
    const config: Record<string, unknown> = {
      benefits: launch.landingDraft.benefits,
      faq: launch.landingDraft.faq,
      socialProof: launch.landingDraft.socialProof,
      formFields: launch.landingDraft.formFields,
      thankYouMessage: launch.landingDraft.thankYouMessage,
      ctaType: launch.landingSettings.ctaType,
      brandTone: launch.landingSettings.brandTone,
      templateId: launch.landingTemplateId,
    };
    if (launch.logoUrl) {
      config.logoUrl = launch.logoUrl;
    }
    await client
      .from("landing_pages")
      .update({
        page_status: "draft",
        meta_title: profile.seoMetaTitle || launch.landingDraft.heroHeadline,
        meta_description: profile.seoMetaDescription || launch.landingDraft.subheadline,
        config,
      })
      .eq("id", lp.data.landingPageId);
  }

  const pipelines = createPipelineRepository(client);
  const pipelineName = `${profile.businessName || "Main"} — ${launch.pipelineWorkflow.pipelineType}`;
  const { data: pipeline, error: pipeErr } = await pipelines.createPipeline({
    businessId,
    name: pipelineName,
    description: `Onboarding pipeline for ${offerGoals.primaryGoal}`,
    isDefault: true,
  });

  if (!pipeErr && pipeline) {
    out.pipelineId = pipeline.id as string;
    for (let i = 0; i < launch.pipelineWorkflow.stages.length; i++) {
      const stageName = launch.pipelineWorkflow.stages[i]!;
      await pipelines.createStage({
        businessId,
        pipelineId: pipeline.id as string,
        name: stageName,
        sortOrder: i,
      });
    }

    const enabledAutomations = launch.pipelineWorkflow.automations.filter((a) => a.enabled);
    const { data: stages } = await pipelines.listStages(pipeline.id as string, businessId);
    const firstStage = stages?.[0];
    if (firstStage && enabledAutomations.length > 0) {
      for (let i = 0; i < enabledAutomations.length; i++) {
        const auto = enabledAutomations[i]!;
        await pipelines.createStageAutomation({
          businessId,
          pipelineId: pipeline.id as string,
          pipelineStageId: firstStage.id as string,
          name: auto.label,
          automationType: "workflow_trigger",
          config: { onboardingAutomationId: auto.id, sortOrder: i },
        });
      }
    }
  }

  const businesses = await client.from("businesses").select("profile").eq("id", businessId).maybeSingle();
  const existingProfile = (businesses.data?.profile ?? {}) as Record<string, unknown>;
  await client
    .from("businesses")
    .update({
      profile: {
        ...existingProfile,
        onboardingPipeline: launch.pipelineWorkflow,
        onboardingLanding: {
          draft: launch.landingDraft,
          settings: launch.landingSettings,
          templateId: launch.landingTemplateId,
        },
        pipelineTestPassed: launch.pipelineTestPassed,
      },
    })
    .eq("id", businessId);

  if (launch.zernioApiKey?.trim()) {
    const zernioResult = await connectZernioAtLaunch(
      client,
      ownerUserId,
      businessId,
      launch.zernioApiKey.trim(),
    );
    if (!zernioResult.success) {
      return fail(`Business created but Zernio failed: ${zernioResult.error}`);
    }
  }

  return ok(out);
}

async function connectZernioAtLaunch(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  apiKey: string,
): Promise<ServiceResult<{ accountCount: number }>> {
  const { verifyApiKey, listAccounts } = await import("@/lib/zernio");
  let accountCount = 0;
  let connectedPlatforms: string[] = [];
  try {
    const verified = await verifyApiKey(apiKey);
    accountCount = verified.accountCount;
    const accounts = await listAccounts(apiKey);
    accountCount = Math.max(accountCount, accounts.length);
    connectedPlatforms = accounts.map((a) => a.platform);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Invalid Zernio API key");
  }

  const accounts = createAdAccountRepository(client);
  const { error } = await accounts.upsert({
    businessId,
    platform: "zernio",
    externalAccountId: "zernio",
    accountName: "Zernio",
    accessToken: apiKey,
    status: "connected",
    meta: {
      accountLabel: "Zernio",
      connectedAppCount: accountCount,
      connectedPlatforms,
      lastVerifiedAt: new Date().toISOString(),
      connectedAt: new Date().toISOString(),
    },
  });
  if (error) return fail(error.message);

  await markIntegrationsConnectedForUser(client, ownerUserId);
  await persistZernioConnectedPlatforms(client, businessId, connectedPlatforms, accountCount);

  return ok({ accountCount });
}
