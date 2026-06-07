"use client";

import { useState, useTransition } from "react";

import { ZernioIntegrationPanel } from "@/components/integrations/zernio-integration-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LinkedAdAccount } from "@/lib/integrations/integration-connect-config";

type ZernioCampaignConnectClientProps = {
  linkedAccount: LinkedAdAccount | null;
  zernioConfigured: boolean;
};

export function ZernioCampaignConnectClient({
  linkedAccount,
  zernioConfigured,
}: ZernioCampaignConnectClientProps) {
  const [panelMode, setPanelMode] = useState<"overview" | "connect" | "manage">(
    linkedAccount ? "manage" : "connect",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Campaigns"
        title="Zernio connection"
        description="Connect paid media through Zernio — the only campaign connection available on your plan."
      />

      {message ? (
        <p className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          {message}
        </p>
      ) : null}

      {!zernioConfigured ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-base">Zernio not configured</CardTitle>
            <CardDescription>
              Add ZERNIO_API_KEY to your environment to enable campaign connections.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-base">Connect your ad accounts</CardTitle>
          <CardDescription>
            Meta, Google, and other platforms are connected through your Zernio dashboard — not
            directly in Diazites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ZernioIntegrationPanel
            linkedAccount={linkedAccount}
            panelMode={panelMode}
            onPanelModeChange={(mode) => startTransition(() => setPanelMode(mode))}
            onMessage={setMessage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
