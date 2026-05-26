"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  ClipboardList,
  Gauge,
  LineChart,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { MissionKpiCell, MissionKpiGrid } from "@/components/dashboard/mission-control/mission-metric";
import { CeoRevenueKpi } from "@/components/revenue/ceo-revenue-kpi";
import { CommandCenterBell } from "@/components/dashboard/mission-control/command-center-bell";
import { ApprovalStateBadge } from "@/components/dashboard/mission-control/approval-state-badge";
import { buttonVariants } from "@/components/ui/button";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const QUICK_MODULES = [
  { label: "Campaign Ops", href: ROUTES.campaignOps },
  { label: "Leads OS", href: ROUTES.leadsOs },
  { label: "Growth Engine", href: ROUTES.growthEngine },
  { label: "Approvals", href: ROUTES.approvalCenter },
  { label: "Reports", href: ROUTES.reportsIntelligence },
] as const;

const RISK_STYLE = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-200",
} as const;

function leadVelocity7d(data: DashboardOverviewData) {
  const total = data.sparkSeries.reduce((s, p) => s + p.v, 0);
  const trend = data.kpiTrends.find((t) => t.key === "leads");
  return { total, trend };
}

function agentHealthScore(data: DashboardOverviewData) {
  if (data.agentPerformance.length > 0) {
    const avg =
      data.agentPerformance.reduce((s, a) => s + a.performanceScore, 0) /
      data.agentPerformance.length;
    return Math.round(avg);
  }
  const active = data.agents.filter((a) => a.status === "active").length;
  const total = Math.max(data.agents.length, 1);
  return Math.round((active / total) * 100);
}

function approvalQueueCount(data: DashboardOverviewData) {
  let count = data.commandCenter.filter((c) => c.kind === "alert" || c.kind === "warning").length;
  if (
    data.nextAction.approvalState === "pending" ||
    data.nextAction.approvalState === "user_approval_required"
  ) {
    count += 1;
  }
  return count;
}

type TopKpi = {
  label: string;
  value: string;
  sub: string;
  href: string;
  icon: typeof LineChart;
  accent?: string;
  trend?: "up" | "down" | "neutral";
  trendPercent?: number;
};

function TopKpiCard({ kpi, index }: { kpi: TopKpi; index: number }) {
  const Icon = kpi.icon;
  const TrendIcon =
    kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={kpi.href}
        className={cn(
          "flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.04] p-4 transition-all",
          "hover:border-violet-500/35 hover:bg-violet-500/10 hover:shadow-[0_8px_28px_-12px_rgba(139,92,246,0.35)]",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground"
            title={kpi.label}
          >
            {kpi.label}
          </span>
          <Icon className="size-3.5 shrink-0 text-violet-400/80" aria-hidden />
        </div>
        <p
          className={cn(
            "mt-2 text-xl font-bold tabular-nums leading-tight tracking-tight sm:text-2xl",
            "break-words [overflow-wrap:anywhere]",
            kpi.accent,
          )}
        >
          {kpi.value}
        </p>
        <div className="mt-auto space-y-1 pt-2">
          <p className="line-clamp-3 text-[10px] leading-snug text-muted-foreground">{kpi.sub}</p>
          {TrendIcon && kpi.trendPercent != null && kpi.trendPercent > 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums",
                kpi.trend === "up" ? "text-emerald-400" : "text-rose-400",
              )}
            >
              <TrendIcon className="size-2.5 shrink-0" />
              {kpi.trendPercent}%
            </span>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}

export function CeoCockpitHero({ data }: { data: DashboardOverviewData }) {
  const m = data.metrics;
  const rev = data.revenueCommandCenter;
  const b = data.briefing;
  const action = data.nextAction;
  const opportunities = data.opportunities.slice(0, 2);

  const velocity = leadVelocity7d(data);
  const agentHealth = agentHealthScore(data);
  const approvals = approvalQueueCount(data);
  const leadsTrend = data.kpiTrends.find((t) => t.key === "leads");

  const topKpis: TopKpi[] = [
    {
      label: "Pipeline",
      value: formatMoney(rev.pipeline),
      sub: "Potential sales · not closed yet",
      href: ROUTES.leadsOs,
      icon: LineChart,
      accent: "text-cyan-300",
    },
    {
      label: "Spend",
      value: formatMoney(rev.spend),
      sub: rev.cpl != null ? `CPL ${formatMoney(rev.cpl)}` : m ? `Last ${m.periodDays}d` : "Period",
      href: ROUTES.campaignOps,
      icon: Gauge,
    },
    {
      label: "ROAS",
      value:
        rev.roas != null ? `${rev.roas.toFixed(1)}×` : m?.roi != null ? `${m.roi.toFixed(1)}×` : "—",
      sub: "Return on ad spend",
      href: ROUTES.reportsIntelligence,
      icon: TrendingUp,
      accent: "text-cyan-200",
      trend: m?.roi != null && m.roi >= 1 ? "up" : "neutral",
    },
    {
      label: "Lead velocity",
      value: String(velocity.total),
      sub: "Leads · last 7 days",
      href: ROUTES.leadsOs,
      icon: Target,
      accent: "text-violet-300",
      trend: leadsTrend?.direction,
      trendPercent: leadsTrend?.changePercent,
    },
    {
      label: "Agent health",
      value: `${agentHealth}%`,
      sub: `${data.agents.filter((a) => a.status === "active").length} agents running`,
      href: ROUTES.agents,
      icon: Bot,
      accent: agentHealth >= 70 ? "text-emerald-300" : agentHealth >= 40 ? "text-amber-300" : "text-rose-300",
    },
    {
      label: "Approval queue",
      value: String(approvals),
      sub: approvals ? "Awaiting decision" : "Queue clear",
      href: ROUTES.approvalCenter,
      icon: ClipboardList,
      accent: approvals ? "text-amber-300" : "text-emerald-300",
    },
  ];

  return (
    <motion.section
      variants={fadeItem}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-violet-950/40 via-card/95 to-cyan-950/30 shadow-[0_24px_80px_-32px_rgba(139,92,246,0.45)]"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.25),transparent)]"
        aria-hidden
      />

      <div className="relative border-b border-white/[0.08] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-300/90">
              Mission Control
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              Growth Command Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitor revenue, campaigns, leads, AI agents, and growth opportunities from one
              central hub.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-cyan-200 mission-timeline-dot-pulse">
              <span className="size-1.5 rounded-full bg-cyan-400" />
              Live
            </span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
                RISK_STYLE[b.riskLevel],
              )}
            >
              {b.riskLevel} risk · {data.healthScore}% health
            </span>
            <CommandCenterBell items={data.commandCenter} />
          </div>
        </div>
      </div>

      <div className="relative border-b border-white/[0.08] px-4 py-4 sm:px-6">
        <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400/80">
          Top KPIs
        </p>
        <MissionKpiGrid className="pb-1">
          <MissionKpiCell>
            <CeoRevenueKpi index={0} />
          </MissionKpiCell>
          {topKpis.map((kpi, i) => (
            <MissionKpiCell key={kpi.label}>
              <TopKpiCard kpi={kpi} index={i + 1} />
            </MissionKpiCell>
          ))}
        </MissionKpiGrid>
      </div>

      <div className="relative grid gap-4 px-6 py-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-300" />
            <h2 className="text-sm font-semibold">Executive summary</h2>
          </div>
          {b.trafficSignal ? (
            <p className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100">
              {b.trafficSignal.headline}
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-foreground/90">{b.aiInsight}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-violet-200">Leverage: </span>
            {b.leverageRecommendation}
            {b.expectedImpact ? (
              <>
                {" "}
                · <span className="text-emerald-300/90">{b.expectedImpact}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-violet-950/20 p-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-amber-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/90">
              Priority decision
            </p>
          </div>
          <p className="mt-2 text-lg font-semibold leading-snug">{action.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-cyan-100/80">{action.impact}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ApprovalStateBadge state={action.approvalState} />
            <Link
              href={action.href}
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "rounded-lg")}
            >
              {action.cta}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {opportunities.length > 0 ? (
        <div className="relative border-t border-white/[0.08] px-6 pb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Scale opportunities
          </p>
          <ul className="flex flex-wrap gap-2">
            {opportunities.map((o) => (
              <li key={o.id}>
                <Link
                  href={o.href ?? ROUTES.optimizationLab}
                  className="inline-flex max-w-xs flex-col rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs transition-colors hover:bg-violet-500/15"
                >
                  <span className="font-medium text-violet-100">{o.title}</span>
                  <span className="text-muted-foreground">{o.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="relative flex flex-wrap gap-2 border-t border-white/[0.08] px-6 py-4">
        {QUICK_MODULES.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/30 hover:text-foreground"
          >
            {mod.label}
          </Link>
        ))}
        <Link
          href={ROUTES.reportsIntelligence}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "ml-auto h-8 text-xs",
          )}
        >
          Full intelligence →
        </Link>
      </div>
    </motion.section>
  );
}
