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
import { AiCopilotFab } from "@/components/dashboard/mission-control/ai-copilot-fab";
import {
  AccountConnectionCenter,
  AgentPerformanceBoard,
  AiCommandBriefing,
  AiRecommendationsPanel,
  BusinessGoalsWidget,
  FunnelSnapshot,
  GrowthEngineHealth,
  OpportunityFeed,
  QuickActionsRow,
  RevenueForecastCard,
} from "@/components/dashboard/mission-control/mission-control-panels";
import { OverviewSparkChart } from "@/components/dashboard/overview-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { fadeItem, staggerContainer } from "@/lib/motion";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function DashboardHomeClient({ data }: { data: DashboardOverviewData }) {
  const m = data.metrics;
  const periodHint = m ? `Last ${m.periodDays} days` : "No data yet";

  const metricsCards = [
    {
      label: "Leads generated",
      value: m ? String(m.totalLeads) : "—",
      icon: Target,
      hint: periodHint,
      trend: "neutral" as const,
    },
    {
      label: "Active campaigns",
      value: m ? String(m.activeCampaigns) : "—",
      icon: Gauge,
      hint: periodHint,
      trend: "neutral" as const,
    },
    {
      label: "Spend (period)",
      value: m ? formatMoney(m.totalSpend) : "—",
      icon: DollarSign,
      hint: periodHint,
      trend: "neutral" as const,
    },
    {
      label: "Cost per lead",
      value: m?.costPerLead != null ? formatMoney(m.costPerLead) : "—",
      icon: TrendingUp,
      hint: m?.costPerLead != null ? "Blended CPL" : periodHint,
      trend: "neutral" as const,
    },
    {
      label: "Booked + won",
      value: String(data.bookedOrWonCount),
      icon: BookOpenCheck,
      hint: periodHint,
      trend: "neutral" as const,
    },
    {
      label: "ROI (model)",
      value: m?.roi != null ? `${m.roi.toFixed(1)}×` : "—",
      icon: Sparkles,
      hint: "Attributed vs spend",
      trend: "neutral" as const,
    },
  ];

  return (
    <>
      <div className="relative mx-auto max-w-7xl space-y-10 pb-24">
        <PageHeader
          eyebrow="AI Growth OS"
          title="Mission control"
          description="Your AI-powered marketing command center — what is happening, what is broken, and what to do next."
        />

        <AiCommandBriefing data={data} />

        <QuickActionsRow />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metricsCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <GrowthEngineHealth data={data} />
          <RevenueForecastCard data={data} />
        </section>

        <FunnelSnapshot data={data} />

        <section className="grid gap-6 lg:grid-cols-5">
          <motion.div variants={fadeItem} initial="hidden" animate="show" className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 shadow-lg backdrop-blur-sm">
              <div className="flex flex-row items-start justify-between gap-4 border-b border-border/50 p-6 pb-4">
                <div>
                  <h3 className="text-lg font-semibold">Inbound velocity</h3>
                  <p className="text-sm text-muted-foreground">
                    Seven-day lead flow — tuned for fast executive reads.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-cyan-200">
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
          <OpportunityFeed data={data} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AccountConnectionCenter data={data} />
          <BusinessGoalsWidget data={data} />
        </section>

        <AgentPerformanceBoard data={data} />
      </div>

      <AiCopilotFab />
    </>
  );
}
