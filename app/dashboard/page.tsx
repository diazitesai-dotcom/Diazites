import { Suspense } from "react";

import { SetupAssistant } from "@/components/dashboard/mission-control/setup-assistant";

import type { MissionControlIntegrationProps } from "@/components/dashboard/mission-control/mission-control-inline-workspace";

import { PageHeader } from "@/components/layout/page-header";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { loadDashboardOverview } from "@/lib/dashboard/load-dashboard-overview";

import { requireAuth } from "@/lib/auth/session";

import { getCurrentUserAccess } from "@/lib/access-control/access-control.service";

import { requireBusinessContext } from "@/lib/auth/business-context";

import { isAdsConfigured } from "@/lib/ads-env";

import { isAdAccountRowConnected } from "@/lib/integrations/ad-account-connection";

import {

  resolveLinkedIntegrationId,

  type LinkedAdAccount,

} from "@/lib/integrations/integration-connect-config";

import {

  ensureZernioEngineAccessToken,

  listBusinessAdConnections,

} from "@/lib/integrations/business-ad-connections";

import {

  businessHasConnectedIntegration,

  markIntegrationsConnectedForUser,

} from "@/lib/integrations/integration-connection-status";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import { loadPostSetupChecklist } from "@/services/onboarding/draft.service";

import Link from "next/link";



export default async function DashboardPage() {

  const data = await loadDashboardOverview();



  if (!data) {

    return (

      <div className="mx-auto max-w-4xl space-y-10 py-4">

        <PageHeader

          eyebrow="Mission Control"

          title="Growth Command Center"

          description="Connect your business profile to unlock revenue, campaigns, leads, AI agents, and growth opportunities in one central hub."

        />

        <Card className="border-white/[0.06]">

          <CardHeader>

            <CardTitle className="text-lg">No business on file</CardTitle>

            <CardDescription>

              Finish onboarding so we can attach campaigns, leads, and billing to your workspace.

            </CardDescription>

          </CardHeader>

          <CardContent>

            <Link

              href="/onboarding"

              className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}

            >

              Go to onboarding

            </Link>

          </CardContent>

        </Card>

      </div>

    );

  }



  const user = await requireAuth();

  const supabase = await createServerSupabaseClient();

  const accessResult = await getCurrentUserAccess(supabase, user.id, user.email ?? null);

  const isOwnerAdmin = accessResult.success ? accessResult.data.isOwnerAdmin : false;



  if (await businessHasConnectedIntegration(supabase, data.businessId)) {

    await markIntegrationsConnectedForUser(supabase, user.id);

  }



  const checklistItems = await loadPostSetupChecklist(supabase, user.id, data.businessId);



  let integrationProps: MissionControlIntegrationProps | undefined;

  const ctxResult = await requireBusinessContext(supabase);

  if (ctxResult.ok) {

    await ensureZernioEngineAccessToken(supabase, ctxResult.ctx.businessId);

    const adConnections = await listBusinessAdConnections(supabase, ctxResult.ctx.businessId);

    const connectedIds: string[] = [];

    const linkedAccounts: Record<string, LinkedAdAccount> = {};



    for (const acc of adConnections) {

      if (!isAdAccountRowConnected(acc)) continue;

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



    integrationProps = {

      connectedIds,

      linkedAccounts,

      oauthConfigured: { meta: isAdsConfigured("meta"), google: isAdsConfigured("google") },

      starterOnly: !isOwnerAdmin,

    };

  }



  const setupComplete = checklistItems.every((item) => item.done);



  return (

    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-4">

      <PageHeader

        eyebrow="Mission Control"

        title={setupComplete ? "Your AI growth workspace" : "Let's set up your growth workspace"}

        description={

          setupComplete

            ? "Everything happens here — connect ads, build funnels, launch campaigns, and run agents without leaving this page."

            : "Your AI specialist will get everything launched. Answer a few prompts or let it set everything up for you."

        }

      />

      <Suspense
        fallback={
          <div className="rounded-2xl border border-white/10 bg-background/40 p-8 text-center text-sm text-muted-foreground">
            Loading Mission Control…
          </div>
        }
      >
        <SetupAssistant
          items={checklistItems}
          businessName={data.workspace.businessName}
          focused
          integrationProps={integrationProps}
        />
      </Suspense>

    </div>

  );

}

