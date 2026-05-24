"use client";

import { motion } from "framer-motion";
import {
  BookOpenCheck,
  DollarSign,
  Gauge,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RetargetingAgentDeploymentPanel } from "@/components/agents/retargeting-agent-deployment-panel";
import { DeployableStacksPanel } from "@/components/dashboard/mission-control/deployable-stacks-panel";
import { CommandCenterBell } from "@/components/dashboard/mission-control/command-center-bell";
import {
  AccountConnectionCenter,
  AgentPerformanceBoard,
  AiCommandBriefing,
  AiDiagnosticsWidget,
  AiRecommendationsPanel,
  BusinessGoalsWidget,
  FunnelSnapshot,
  GrowthEngineHealth,
  MarketSignalsWidget,
  OpportunityFeed,
  QuickActionsRow,
  RecommendedNextActionCard,
  RevenueForecastCard,
} from "@/components/dashboard/mission-control/mission-control-panels";
import {
  CombinedAcquisitionEmpty,
  ZeroCampaignsEmpty,
  ZeroSpendEmpty,
} from "@/components/dashboard/mission-control/mission-empty-states";
import { GrowthOrchestrationTimeline } from "@/components/dashboard/mission-control/growth-orchestration-timeline";
import { CredentialVaultPanel } from "@/components/dashboard/mission-control/credential-vault-panel";
import { LandingStackManager } from "@/components/dashboard/mission-control/landing-stack-manager";
import { RevenueCommandCenterRow } from "@/components/dashboard/mission-control/revenue-command-center";
import { MissionControlAlerts } from "@/components/dashboard/mission-control/mission-control-alerts";
import { RuntimeOverview } from "@/components/dashboard/mission-control/runtime-overview";
import { InboundVelocityChart } from "@/components/dashboard/mission-control/inbound-velocity-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
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

  return {
    funnelCounts: { visitors, leads, qualified, booked, won },
    metrics: data.metrics,
    agents: data.agents,
    landingStackVersions: data.landingStackVersions,
    recommendations: data.recommendations,
    crmConnected,
    hasPaidAds,
  };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function trendForKey(data: DashboardOverviewData, key: string) {
  return data.kpiTrends.find((t) => t.key === key);
}

function insightForKey(data: DashboardOverviewData, key: string) {
  return data.kpiInsights.find((k) => k.key === key);
}

export function DashboardHomeClient({ data }: { data: DashboardOverviewData }) {
  const m = data.metrics;
  const periodHint = m ? `Last ${m.periodDays} days` : "No data yet";
  const zeroCampaigns = (m?.activeCampaigns ?? 0) === 0;
  const zeroSpend = (m?.totalSpend ?? 0) === 0;

  const metricsCards = [
    {
      key: "leads",
      label: "Leads generated",
      value: m ? String(m.totalLeads) : "—",
      numericValue: m?.totalLeads,
      icon: Target,
      hint: periodHint,
      trend: trendForKey(data, "leads")?.direction ?? "neutral",
      trendPercent: trendForKey(data, "leads")?.changePercent,
    },
    {
      key: "campaigns",
      label: "Active campaigns",
      value: m ? String(m.activeCampaigns) : "—",
      numericValue: m?.activeCampaigns,
      icon: Gauge,
      hint: zeroCampaigns ? "Launch your first campaign" : periodHint,
      trend: trendForKey(data, "campaigns")?.direction ?? "neutral",
      trendPercent: trendForKey(data, "campaigns")?.changePercent,
    },
    {
      key: "spend",
      label: "Spend (period)",
      value: m ? formatMoney(m.totalSpend) : "—",
      numericValue: m?.totalSpend,
      formatValue: formatMoney,
      icon: DollarSign,
      hint: zeroSpend ? "Connect ads to track spend" : periodHint,
      trend: trendForKey(data, "spend")?.direction ?? "neutral",
      trendPercent: trendForKey(data, "spend")?.changePercent,
    },
    {
      key: "cpl",
      label: "Cost per lead",
      value: m?.costPerLead != null ? formatMoney(m.costPerLead) : "—",
      numericValue: m?.costPerLead != null ? Math.round(m.costPerLead) : undefined,
      formatValue: formatMoney,
      icon: TrendingUp,
      hint: m?.costPerLead != null ? "Blended CPL" : periodHint,
      trend: trendForKey(data, "cpl")?.direction ?? "neutral",
      trendPercent: trendForKey(data, "cpl")?.changePercent,
      invertTrend: true,
    },
    {
      key: "booked",
      label: "Booked + won",
      value: String(data.bookedOrWonCount),
      numericValue: data.bookedOrWonCount,
      icon: BookOpenCheck,
      hint: periodHint,
      trend: trendForKey(data, "booked")?.direction ?? "neutral",
      trendPercent: trendForKey(data, "booked")?.changePercent,
    },
    {
      key: "roi",
      label: "ROI (model)",
      value: m?.roi != null ? `${m.roi.toFixed(1)}×` : "—",
      icon: Sparkles,
      hint: "Attributed vs spend",
      trend: trendForKey(data, "roi")?.direction ?? "neutral",
      trendPercent: trendForKey(data, "roi")?.changePercent,
    },
  ] as const;

  const kpiLinks: Record<string, string> = {
    leads: "/dashboard/leads",
    campaigns: "/dashboard/campaigns",
    booked: "/dashboard/leads",
  };

  return (
    <>
      <div className="relative mx-auto max-w-7xl space-y-10 pb-24">
        <RuntimeOverview
          flow={data.orchestrationFlow}
          stackHealth={data.stackHealth}
          moduleContext={buildModuleContext(data)}
        />

        <MissionControlAlerts data={data} />

        <AgentPerformanceBoard data={data} />

        <PageHeader
          eyebrow="AI Growth OS"
          title="Mission control"
          description="Your AI-powered marketing command center — what is happening, what is broken, and what to do next."
          actions={<CommandCenterBell items={data.commandCenter} />}
        />

        <AiCommandBriefing data={data} />
        <RevenueCommandCenterRow data={data.revenueCommandCenter} />
        <RecommendedNextActionCard data={data} />

        <RetargetingAgentDeploymentPanel />

        <DeployableStacksPanel />

        <QuickActionsRow />

        {zeroCampaigns && zeroSpend ? (
          <CombinedAcquisitionEmpty />
        ) : (
          <>
            {zeroCampaigns ? <ZeroCampaignsEmpty /> : null}
            {zeroSpend ? <ZeroSpendEmpty /> : null}
          </>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metricsCards.map((card) => {
            const insight = insightForKey(data, card.key);
            return (
            <StatCard
              key={card.key}
              label={card.label}
              value={card.value}
              icon={card.icon}
              hint={card.hint}
              trend={card.trend}
              trendPercent={card.trendPercent}
              numericValue={"numericValue" in card ? card.numericValue : undefined}
              formatValue={"formatValue" in card ? card.formatValue : undefined}
              invertTrend={"invertTrend" in card ? card.invertTrend : false}
              trafficSource={insight?.trafficSource}
              periodLabel={insight?.periodLabel}
              microInsight={insight?.microInsight}
              href={kpiLinks[card.key]}
            />
          );
          })}
        </section>

        <AiDiagnosticsWidget data={data} />

        <section className="grid gap-6 lg:grid-cols-2">
          <GrowthEngineHealth data={data} />
          <RevenueForecastCard data={data} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <FunnelSnapshot data={data} />
          <LandingStackManager versions={data.landingStackVersions} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <MarketSignalsWidget data={data} />
          <CredentialVaultPanel />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <BusinessGoalsWidget data={data} />
          <OpportunityFeed data={data} />
        </section>

        <GrowthOrchestrationTimeline
          events={data.orchestrationTimeline}
          autonomousPolicy={data.autonomousPolicy}
        />

        <section className="grid gap-6 lg:grid-cols-5">
          <motion.div variants={fadeItem} initial="hidden" animate="show" className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-[0_8px_32px_-12px_rgba(139,92,246,0.2)]">
              <div className="flex flex-row items-start justify-between gap-4 border-b border-border/50 p-6 pb-4">
                <div>
                  <h3 className="text-lg font-semibold">Inbound velocity</h3>
                  <p className="text-sm text-muted-foreground">
                    Seven-day lead flow with AI velocity annotations.
                  </p>
                </div>
                <span className="animate-pulse rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-cyan-200">
                  Live
                </span>
              </div>
              <div className="p-6 pt-2">
                <InboundVelocityChart data={data.sparkSeries} />
              </div>
            </div>
          </motion.div>
          <div className="lg:col-span-2">
            <ActivityFeed items={data.activity} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AiRecommendationsPanel data={data} />
          <AccountConnectionCenter data={data} />
        </section>
      </div>
    </>
  );
}
