"use client";

import Link from "next/link";
import { Suspense } from "react";

import { AdopsAlerts } from "@/components/ads/adops/adops-alerts";
import { AdopsCommandBar } from "@/components/ads/adops/adops-command-bar";
import { AdopsProvider } from "@/components/ads/adops/adops-provider";
import { AgentExecutionCenter } from "@/components/ads/adops/agent-execution-center";
import { AgentWorkspaceDrawer } from "@/components/ads/adops/agent-workspace-drawer";
import { CampaignWorkspaceDrawer } from "@/components/ads/adops/campaign-workspace-drawer";
import { ExecutionSafetyPanel } from "@/components/ads/adops/execution-safety-panel";
import { GlobalAgentFeed } from "@/components/ads/adops/global-agent-feed";
import { LiveCampaignsCenter } from "@/components/ads/adops/live-campaigns-center";
import { PlatformGrid } from "@/components/ads/adops/platform-grid";
import { PlatformWorkspaceDrawer } from "@/components/ads/adops/platform-workspace-drawer";
import { AdsOAuthBanner } from "@/components/ads/ads-oauth-banner";
import { PushWinnerForm } from "@/components/ads/push-winner-form";
import { ZapierConnector } from "@/components/integrations/zapier-connector";
import { ZernioConnector } from "@/components/integrations/zernio-connector";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdopsPagePayload } from "@/lib/ads/adops-types";
import { ROUTES } from "@/lib/navigation/platform-nav";

type AdsCommandCenterClientProps = {
  payload: AdopsPagePayload;
  zapierEvents: { type: string; label: string; description: string }[];
  zapierRules: { id: string; name: string; triggerEvent: string; url: string; enabled: boolean }[];
  zernioConfigured: boolean;
  /** When true, parent (Campaign Ops) renders module header. */
  embedded?: boolean;
};

export function AdsCommandCenterClient({
  payload,
  zapierEvents,
  zapierRules,
  zernioConfigured,
  embedded = false,
}: AdsCommandCenterClientProps) {
  return (
    <AdopsProvider payload={payload}>
      <div className={embedded ? "mx-auto max-w-7xl space-y-8" : "mx-auto max-w-7xl space-y-8 pb-16"}>
        {!embedded ? (
          <>
            <PageHeader
              eyebrow="Campaign Ops"
              title="Live campaign operations"
              description="Connect platforms, orchestrate live campaigns, and watch agents execute with full visibility and safety controls."
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <MissionLink href={ROUTES.missionControl} label="Mission Control" />
              <MissionLink href={ROUTES.growthEngine} label="Growth Engine" />
              <MissionLink href={ROUTES.integrationsHub} label="Integrations" />
              <MissionLink href={ROUTES.approvalCenter} label="Approvals" />
              <MissionLink href={ROUTES.optimizationLab} label="Optimization Lab" />
            </div>
          </>
        ) : null}

        <Suspense fallback={null}>
          <AdsOAuthBanner />
        </Suspense>

        <AdopsAlerts />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Connected" value={String(payload.rollup.connected)} />
          <Kpi label="Live campaigns" value={String(payload.rollup.activeCampaigns)} />
          <Kpi label="Total spend" value={`$${payload.rollup.totalSpend.toFixed(2)}`} />
          <Kpi
            label="Cost / lead"
            value={payload.rollup.cpl != null ? `$${payload.rollup.cpl.toFixed(2)}` : "—"}
          />
        </section>

        <AdopsCommandBar />

        <PlatformGrid />
        <LiveCampaignsCenter />
        <AgentExecutionCenter />
        <GlobalAgentFeed />
        <ExecutionSafetyPanel />

        {payload.hasWinningAd && payload.winningAdMeta ? (
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-lg">Push winning creative live</CardTitle>
              <CardDescription>
                Deploy the Growth Engine&apos;s winning ad variant to Meta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PushWinnerForm
                engineRunId={payload.winningAdMeta.runId}
                winningAssetId={payload.winningAdMeta.assetId}
                defaultName={payload.winningAdMeta.defaultName}
              />
            </CardContent>
          </Card>
        ) : null}

        <section>
          <ZapierConnector events={zapierEvents} rules={zapierRules} />
        </section>
        <section>
          <ZernioConnector configured={zernioConfigured} />
        </section>
      </div>

      <PlatformWorkspaceDrawer />
      <CampaignWorkspaceDrawer />
      <AgentWorkspaceDrawer />
    </AdopsProvider>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-card/60 px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

function MissionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-muted-foreground transition-colors hover:border-violet-500/30 hover:text-violet-200"
    >
      {label}
    </Link>
  );
}
