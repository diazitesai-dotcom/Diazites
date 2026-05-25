import Link from "next/link";
import { Suspense } from "react";

import { AdsCommandCenterClient } from "@/components/ads/adops/ads-command-center-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAdopsPayload } from "@/lib/ads/build-adops-payload";
import { isZernioConfigured } from "@/lib/zernio";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createAdAccountRepository,
  createAdCampaignRepository,
  type AdAccountRow,
  type AdCampaignRow,
} from "@/repositories/ad-account.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createEngineRepository, type AssetRow } from "@/repositories/engine.repository";
import { getActiveEngineRun } from "@/services/engine/orchestrator.service";
import {
  ZAPIER_SUBSCRIBABLE_EVENTS,
  listZapierRulesForBusiness,
} from "@/services/integrations/zapier.service";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="AdOps"
          title="AI marketing operating system"
          description="Connect ad accounts and run campaigns with agent visibility."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>
              Connect your business profile so agents can deploy and optimize ads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding" className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}>
              Go to onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accountsRepo = createAdAccountRepository(supabase);
  const campaignsRepo = createAdCampaignRepository(supabase);
  const engineRepo = createEngineRepository(supabase);

  const [accountsRes, campaignsRes, activeRunRes, zapierRulesRes] = await Promise.all([
    accountsRepo.listByBusiness(business.id),
    campaignsRepo.listByBusiness(business.id, 50),
    getActiveEngineRun(supabase, business.id),
    listZapierRulesForBusiness(supabase, business.id),
  ]);

  const accounts = (accountsRes.data ?? []) as AdAccountRow[];
  const campaigns = (campaignsRes.data ?? []) as AdCampaignRow[];
  const activeRun = activeRunRes.success ? activeRunRes.data : null;

  let winningAd: AssetRow | null = null;
  if (activeRun) {
    const { data: assets } = await engineRepo.listAssetsForRun(activeRun.id);
    winningAd =
      ((assets ?? []) as AssetRow[]).find((a) => a.kind === "ad" && a.is_winner) ?? null;
  }

  const payload = buildAdopsPayload({
    businessName: business.name,
    accounts,
    campaigns,
    hasWinningAd: Boolean(winningAd && activeRun),
    winningAdMeta:
      winningAd && activeRun
        ? {
            runId: activeRun.id,
            assetId: winningAd.id,
            defaultName: `Engine · ${business.name} · variant ${winningAd.variant_label}`,
          }
        : null,
  });

  return (
    <AdsCommandCenterClient
      payload={payload}
      zapierEvents={ZAPIER_SUBSCRIBABLE_EVENTS.map((e) => ({
        type: e.type as string,
        label: e.label,
        description: e.description,
      }))}
      zapierRules={(zapierRulesRes.success ? zapierRulesRes.data : []).map((r) => ({
        id: r.id,
        name: r.name,
        triggerEvent: r.trigger_event,
        url: r.zapierUrl,
        enabled: r.enabled,
      }))}
      zernioConfigured={isZernioConfigured()}
    />
  );
}
