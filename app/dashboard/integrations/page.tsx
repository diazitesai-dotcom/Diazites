import { GrowthIntegrationsHub } from "@/components/integrations/growth-integrations-hub";
import { requireBusinessContext } from "@/lib/auth/business-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const supabase = await createServerSupabaseClient();
  const ctxResult = await requireBusinessContext(supabase);
  if (!ctxResult.ok) redirect("/dashboard/settings");

  const { data: adAccounts } = await supabase
    .from("ad_accounts")
    .select("platform, status")
    .eq("business_id", ctxResult.ctx.businessId);

  const connectedIds: string[] = [];
  for (const acc of adAccounts ?? []) {
    const p = String(acc.platform).toLowerCase();
    if (acc.status === "connected" || acc.status === "active") {
      if (p.includes("meta") || p.includes("facebook")) connectedIds.push("meta");
      if (p.includes("google")) connectedIds.push("google_ads");
      if (p.includes("tiktok")) connectedIds.push("tiktok_ads");
      if (p.includes("linkedin")) connectedIds.push("linkedin_ads");
    }
  }

  return <GrowthIntegrationsHub connectedIds={connectedIds} />;
}
