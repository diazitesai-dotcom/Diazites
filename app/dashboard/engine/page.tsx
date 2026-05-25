import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { GrowthEngineOsClient } from "@/components/engine/growth-engine-os/growth-engine-os-client";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getActiveEngineRun,
  listEngineRuns,
} from "@/services/engine/orchestrator.service";
import { createEngineRepository, type AssetRow } from "@/repositories/engine.repository";

export const dynamic = "force-dynamic";

export default async function EnginePage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Growth Engine"
          title="AI Marketing Operating System"
          description="The 8-stage pipeline from business input to launched campaign."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg">Finish onboarding first</CardTitle>
            <CardDescription>
              Connect your business profile so the engine has the inputs it needs to research, generate, and launch.
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

  const [activeResult, historyResult, adAccountsResult] = await Promise.all([
    getActiveEngineRun(supabase, business.id),
    listEngineRuns(supabase, business.id, 12),
    supabase.from("ad_accounts").select("platform, status").eq("business_id", business.id),
  ]);

  const activeRun = activeResult.success ? activeResult.data : null;
  const history = historyResult.success ? historyResult.data : [];

  const connectedIds: string[] = [];
  for (const acc of adAccountsResult.data ?? []) {
    const p = String(acc.platform).toLowerCase();
    if (acc.status === "connected" || acc.status === "active") {
      if (p.includes("meta") || p.includes("facebook")) connectedIds.push("meta");
      if (p.includes("google")) connectedIds.push("google_ads");
      if (p.includes("tiktok")) connectedIds.push("tiktok_ads");
    }
  }

  let assets: AssetRow[] = [];
  if (activeRun) {
    const engineRepo = createEngineRepository(supabase);
    const { data: assetRows } = await engineRepo.listAssetsForRun(activeRun.id);
    assets = (assetRows ?? []) as AssetRow[];
  }

  const hasMeta = connectedIds.includes("meta");
  const hasGoogle = connectedIds.includes("google_ads");

  return (
    <GrowthEngineOsClient
      businessName={business.name}
      businessDefaults={{
        websiteUrl: business.website,
        location: business.city_state,
        niche: business.services,
        budget: business.monthly_budget,
      }}
      connectedIds={connectedIds}
      activeRun={activeRun}
      history={history}
      assets={assets}
      missionFlags={{
        hasMeta,
        hasGoogle,
        trackingOk: hasMeta || hasGoogle,
        crmConnected: true,
        visitorsForRetargeting: 24,
      }}
      isDev={process.env.NODE_ENV !== "production"}
    />
  );
}
