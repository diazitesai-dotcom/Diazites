import { GrowthIntegrationsHub } from "@/components/integrations/growth-integrations-hub";
import { isAdsConfigured } from "@/lib/ads-env";
import { requireBusinessContext } from "@/lib/auth/business-context";
import {
  isAdAccountConnected,
  resolveLinkedIntegrationId,
  type LinkedAdAccount,
} from "@/lib/integrations/integration-connect-config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const supabase = await createServerSupabaseClient();
  const ctxResult = await requireBusinessContext(supabase);
  if (!ctxResult.ok) redirect("/dashboard/organization?tab=settings");

  const { data: adAccounts } = await supabase
    .from("ad_accounts")
    .select("id, platform, external_account_id, account_name, credentials_hint, connection_status")
    .eq("business_id", ctxResult.ctx.businessId);

  const connectedIds: string[] = [];
  const linkedAccounts: Record<string, LinkedAdAccount> = {};

  for (const acc of adAccounts ?? []) {
    if (!isAdAccountConnected(acc)) continue;
    const integrationId = resolveLinkedIntegrationId(acc);
    if (!integrationId) continue;
    connectedIds.push(integrationId);
    linkedAccounts[integrationId] = {
      id: acc.id,
      accountName: acc.account_name,
      credentialsHint: acc.credentials_hint,
    };
  }

  return (
    <GrowthIntegrationsHub
      connectedIds={connectedIds}
      linkedAccounts={linkedAccounts}
      adsOAuthConfigured={{
        meta: isAdsConfigured("meta"),
        google: isAdsConfigured("google"),
      }}
    />
  );
}
