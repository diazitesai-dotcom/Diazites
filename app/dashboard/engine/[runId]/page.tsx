import { notFound } from "next/navigation";

import { EngineWorkspaceClient } from "@/components/engine/growth-engine-os/engine-workspace-client";
import { GrowthEngineOsProvider } from "@/components/engine/growth-engine-os/growth-engine-os-provider";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createEngineRepository, type AssetRow } from "@/repositories/engine.repository";
import { sanitizeDashboardWebsitePreset } from "@/lib/dashboard/sanitize-preset-url";
import { getEngineRunForOwner } from "@/services/engine/run-management.service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ runId: string }> };

export default async function EngineRunDetailPage({ params }: PageProps) {
  const { runId } = await params;
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) notFound();

  const result = await getEngineRunForOwner(supabase, runId, user.id);
  if (!result.success || !result.data) notFound();

  const run = result.data;
  const engineRepo = createEngineRepository(supabase);
  const { data: assetRows } = await engineRepo.listAssetsForRun(run.id);
  const assets = (assetRows ?? []) as AssetRow[];

  const { data: adAccounts } = await supabase
    .from("ad_accounts")
    .select("platform, status")
    .eq("business_id", business.id);

  const connectedIds: string[] = [];
  for (const acc of adAccounts ?? []) {
    const p = String(acc.platform).toLowerCase();
    if (acc.status === "connected" || acc.status === "active") {
      if (p.includes("meta") || p.includes("facebook")) connectedIds.push("meta");
      if (p.includes("google")) connectedIds.push("google_ads");
    }
  }

  return (
    <GrowthEngineOsProvider
      connectedIds={connectedIds}
      defaults={{
        businessName: business.name,
        websiteUrl: sanitizeDashboardWebsitePreset(business.website),
      }}
    >
      <EngineWorkspaceClient run={run} assets={assets} businessName={business.name} />
    </GrowthEngineOsProvider>
  );
}
