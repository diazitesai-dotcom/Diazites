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
import { AiCopilotFab } from "@/components/dashboard/mission-control/ai-copilot-fab";
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
import { OverviewSparkChart } from "@/components/dashboard/overview-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { fadeItem } from "@/lib/motion";

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

  return (
    <>
      <div className="relative mx-auto max-w-7xl space-y-10 pb-24">
        <PageHeader
          eyebrow="AI Growth OS"
          title="Mission control"
          description="Your AI-powered marketing command center — what is happening, what is broken, and what to do next."
          actions={<CommandCenterBell items={data.commandCenter} />}
        />

        <AiCommandBriefing data={data} />
        <RecommendedNextActionCard data={data} />

        <RetargetingAgentDeploymentPanel />

        <QuickActionsRow />

        {zeroCampaigns && zeroSpend ? (
          <CombinedAcquisitionEmpty />
        ) : (
          <>
            {zeroCampaigns ? <ZeroCampaignsEmpty /> : null}
            {zeroSpend ? <ZeroSpendEmpty /> : null}
          </>
        )}

        <AgentPerformanceBoard data={data} />

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
          <MarketSignalsWidget data={data} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <BusinessGoalsWidget data={data} />
          <OpportunityFeed data={data} />
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <motion.div variants={fadeItem} initial="hidden" animate="show" className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-[0_8px_32px_-12px_rgba(139,92,246,0.2)]">
              <div className="flex flex-row items-start justify-between gap-4 border-b border-border/50 p-6 pb-4">
                <div>
                  <h3 className="text-lg font-semibold">Inbound velocity</h3>
                  <p className="text-sm text-muted-foreground">
                    Seven-day lead flow — tuned for fast executive reads.
                  </p>
                </div>
                <span className="animate-pulse rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-cyan-200">
                  Live
                </span>
              </div>
              <div className="p-6 pt-2">
                <OverviewSparkChart data={data.sparkSeries} />
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

      <AiCopilotFab />
    </>
  );
}
