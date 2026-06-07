import { requireDashboardService } from "@/lib/access-control/guard";
import { requireAuth } from "@/lib/auth/session";
import { isAdAccountRowConnected } from "@/lib/integrations/ad-account-connection";
import {
  resolveLinkedIntegrationId,
  type LinkedAdAccount,
} from "@/lib/integrations/integration-connect-config";
import { ensureZernioEngineAccessToken, listBusinessAdConnections } from "@/lib/integrations/business-ad-connections";
import { markIntegrationsConnectedForUser } from "@/lib/integrations/integration-connection-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { isZernioConfigured } from "@/lib/zernio";
import { ZernioCampaignConnectClient } from "@/components/campaign-ops/zernio-campaign-connect-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CampaignOpsPage() {
  await requireDashboardService("ads_management");
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-3xl space-y-10 py-4">
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business to enable Zernio campaign connections.</CardDescription>
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

  await ensureZernioEngineAccessToken(supabase, business.id);
  const adConnections = await listBusinessAdConnections(supabase, business.id);

  let linkedAccount: LinkedAdAccount | null = null;
  for (const acc of adConnections) {
    if (!isAdAccountRowConnected(acc)) continue;
    const integrationId = resolveLinkedIntegrationId(acc);
    if (integrationId !== "zernio") continue;
    const meta = (acc.meta ?? {}) as Record<string, unknown>;
    linkedAccount = {
      id: acc.id ?? "zernio",
      accountName: typeof meta.accountLabel === "string" ? meta.accountLabel : "Zernio",
      credentialsHint:
        typeof meta.connectedAppCount === "number"
          ? `${meta.connectedAppCount} app(s) connected`
          : "API key connected",
    };
    await markIntegrationsConnectedForUser(supabase, user.id);
    break;
  }

  return (
    <ZernioCampaignConnectClient
      linkedAccount={linkedAccount}
      zernioConfigured={isZernioConfigured()}
    />
  );
}
