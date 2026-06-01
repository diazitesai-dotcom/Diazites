import { Suspense } from "react";

import { GrowthIntegrationsHub } from "@/components/integrations/growth-integrations-hub";
import { isAdsConfigured } from "@/lib/ads-env";
import { getCurrentUserAccess } from "@/lib/access-control/access-control.service";
import { requireBusinessContext } from "@/lib/auth/business-context";
import { requireAuth } from "@/lib/auth/session";
import {
  isAdAccountConnected,
  resolveLinkedIntegrationId,
  type LinkedAdAccount,
} from "@/lib/integrations/integration-connect-config";
import {
  ensureZernioEngineAccessToken,
  listBusinessAdConnections,
} from "@/lib/integrations/business-ad-connections";
import { markIntegrationsConnectedForUser } from "@/lib/integrations/integration-connection-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const accessResult = await getCurrentUserAccess(supabase, user.id, user.email ?? null);
  const isOwnerAdmin = accessResult.success ? accessResult.data.isOwnerAdmin : false;

  const ctxResult = await requireBusinessContext(supabase);
  if (!ctxResult.ok) redirect("/dashboard/organization?tab=settings");

  await ensureZernioEngineAccessToken(supabase, ctxResult.ctx.businessId);
  const adConnections = await listBusinessAdConnections(
    supabase,
    ctxResult.ctx.businessId,
  );

  const connectedIds: string[] = [];
  const linkedAccounts: Record<string, LinkedAdAccount> = {};

  for (const acc of adConnections) {
    if (!isAdAccountConnected(acc)) continue;
    const integrationId = resolveLinkedIntegrationId(acc);
    if (!integrationId) continue;
    connectedIds.push(integrationId);
    const meta = (acc.meta ?? {}) as Record<string, unknown>;
    const label =
      typeof meta.accountLabel === "string" ? meta.accountLabel : integrationId.replace(/_/g, " ");
    const connectedAppCount =
      typeof meta.connectedAppCount === "number" ? meta.connectedAppCount : null;

    linkedAccounts[integrationId] = {
      id: acc.id ?? integrationId,
      accountName: label,
      credentialsHint:
        integrationId === "zernio"
          ? connectedAppCount != null
            ? `${connectedAppCount} app(s) via Zernio`
            : "API key connected"
          : acc.status === "connected"
            ? "OAuth connected"
            : acc.status === "pending"
              ? "OAuth pending"
              : null,
    };
  }

  if (connectedIds.length > 0) {
    await markIntegrationsConnectedForUser(supabase, user.id);
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground">
          Loading integrations…
        </div>
      }
    >
      <GrowthIntegrationsHub
        connectedIds={connectedIds}
        linkedAccounts={linkedAccounts}
        oauthConfigured={{ meta: isAdsConfigured("meta"), google: isAdsConfigured("google") }}
        starterOnly={!isOwnerAdmin}
      />
    </Suspense>
  );
}
