"use client";

import { motion } from "framer-motion";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { CommandCenterWidgets } from "@/components/dashboard/command-center-widgets";
import { DeployableStacksPanel } from "@/components/dashboard/mission-control/deployable-stacks-panel";
import { CeoCockpitHero } from "@/components/dashboard/mission-control/ceo-cockpit-hero";
import {
  AccountConnectionCenter,
  AiRecommendationsPanel,
  BusinessGoalsWidget,
  FunnelSnapshot,
  GrowthEngineHealth,
  RevenueForecastCard,
} from "@/components/dashboard/mission-control/mission-control-panels";
import {
  CombinedAcquisitionEmpty,
  ZeroCampaignsEmpty,
  ZeroSpendEmpty,
} from "@/components/dashboard/mission-control/mission-empty-states";
import { GrowthOrchestrationTimeline } from "@/components/dashboard/mission-control/growth-orchestration-timeline";
import { LandingStackManager } from "@/components/dashboard/mission-control/landing-stack-manager";
import { LiveAgentActivityPanel } from "@/components/dashboard/mission-control/live-agent-activity-panel";
import { RevenueAttributionProvider } from "@/components/revenue/revenue-attribution-context";
import { RevenueBreakdownDrawer } from "@/components/revenue/revenue-breakdown-drawer";
import { MissionControlAlerts } from "@/components/dashboard/mission-control/mission-control-alerts";
import { RuntimeOverview } from "@/components/dashboard/mission-control/runtime-overview";
import { StackHealthSection } from "@/components/dashboard/mission-control/stack-health-section";
import { InboundVelocityChart } from "@/components/dashboard/mission-control/inbound-velocity-chart";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import type { SystemModuleContext } from "@/lib/dashboard/system-module-types";
import { fadeItem } from "@/lib/motion";

function buildModuleContext(data: DashboardOverviewData): SystemModuleContext {
  const hasPaidAds = data.connections.some(
    (c) => (c.id === "meta" || c.id === "google") && c.status === "connected",
  );
  const crmConnected = data.connections.some(
    (c) => (c.id === "crm" || c.id === "hubspot") && c.status === "connected",
  );
  const funnel = data.funnel;
  const visitors = funnel.find((s) => s.key === "visitors")?.count ?? 0;
  const leads = funnel.find((s) => s.key === "leads")?.count ?? data.metrics?.totalLeads ?? 0;
  const qualified = funnel.find((s) => s.key === "qualified")?.count ?? 0;
  const booked = funnel.find((s) => s.key === "booked")?.count ?? 0;
  const won = funnel.find((s) => s.key === "won")?.count ?? 0;

  const pixelCheck = data.healthChecks.find((c) => c.id === "pixel");
  const pixelOk = pixelCheck?.ok ?? true;
  const trackingRequired = data.connections.some(
    (c) => (c.id === "meta" || c.id === "google") && c.status !== "missing",
  );

  return {
    funnelCounts: { visitors, leads, qualified, booked, won },
    metrics: data.metrics,
    agents: data.agents,
    landingStackVersions: data.landingStackVersions,
    recommendations: data.recommendations,
    crmConnected,
    hasPaidAds,
    pixelOk,
    trackingRequired,
  };
}

export function DashboardHomeClient({ data }: { data: DashboardOverviewData }) {
  const m = data.metrics;
  const zeroCampaigns = (m?.activeCampaigns ?? 0) === 0;
  const zeroSpend = (m?.totalSpend ?? 0) === 0;

  return (
    <RevenueAttributionProvider attribution={data.revenueAttribution}>
      <RevenueBreakdownDrawer />
      <div className="relative mx-auto max-w-7xl space-y-10 pb-20">
        <CeoCockpitHero data={data} />

        <MissionControlAlerts data={data} />

        <RuntimeOverview
          flow={data.orchestrationFlow}
          stackHealth={data.stackHealth}
          moduleContext={buildModuleContext(data)}
          showStackHealthBar={false}
        />

        <CommandCenterWidgets data={data} />

        <LiveAgentActivityPanel data={data} />

        <StackHealthSection items={data.stackHealth} />

        <section className="grid gap-6 lg:grid-cols-2">
          <AiRecommendationsPanel data={data} />
          <AccountConnectionCenter data={data} />
        </section>

        <DeployableStacksPanel />

        {zeroCampaigns && zeroSpend ? (
          <CombinedAcquisitionEmpty />
        ) : (
          <>
            {zeroCampaigns ? <ZeroCampaignsEmpty /> : null}
            {zeroSpend ? <ZeroSpendEmpty /> : null}
          </>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <FunnelSnapshot data={data} />
          <LandingStackManager versions={data.landingStackVersions} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <BusinessGoalsWidget data={data} />
          <GrowthEngineHealth data={data} />
        </section>

        <RevenueForecastCard data={data} />

        <GrowthOrchestrationTimeline
          events={data.orchestrationTimeline}
          autonomousPolicy={data.autonomousPolicy}
        />

        <section className="grid gap-6 lg:grid-cols-5">
          <motion.div variants={fadeItem} initial="hidden" animate="show" className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-card/50 p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Inbound velocity</h3>
                  <p className="text-sm text-muted-foreground">7-day trend — totals are in Lead velocity KPI</p>
                </div>
              </div>
              <InboundVelocityChart data={data.sparkSeries} />
            </div>
          </motion.div>
          <div className="lg:col-span-2">
            <ActivityFeed items={data.activity} />
          </div>
        </section>
      </div>
    </RevenueAttributionProvider>
  );
}
