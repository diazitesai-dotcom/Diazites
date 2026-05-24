"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Circle,
  Import,
  Megaphone,
  Plug,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import type { ConnectionStatus } from "@/lib/dashboard/mission-control-types";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function connectionBadge(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return <Badge variant="success">Connected</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Missing</Badge>;
  }
}

function agentBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="outline">Inactive</Badge>;
  }
}

function GoalBar({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  unit: "currency" | "count";
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const display =
    unit === "currency"
      ? `${formatMoney(current)} / ${formatMoney(target)}`
      : `${current} / ${target}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AiCommandBriefing({ data }: { data: DashboardOverviewData }) {
  const b = data.briefing;
  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="AI Command Briefing"
        description="Executive snapshot — what matters right now"
        className="border-violet-500/15 shadow-[0_12px_48px_-20px_rgba(139,92,246,0.35)]"
        headerExtra={
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
            <Sparkles className="size-3" />
            Live
          </span>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Leads captured", value: String(b.leadsCaptured), icon: Target },
            { label: "Campaign status", value: b.campaignStatus, icon: Megaphone },
            { label: "Agent status", value: b.agentStatus, icon: Bot },
            { label: "Missed opportunity", value: b.missedOpportunity, icon: AlertCircle },
            { label: "Recommended next", value: b.recommendedNextAction, icon: Zap },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <item.icon className="size-3.5 text-violet-400" />
                {item.label}
              </div>
              <p className="text-sm font-medium leading-snug text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard/engine" className={cn(buttonVariants({ variant: "gradient" }), "rounded-xl")}>
            Generate Strategy
          </Link>
          <Link href="/dashboard/campaigns" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
            Launch Campaign
          </Link>
          <Link href="/dashboard/agents" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
            Ask AI
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function GrowthEngineHealth({ data }: { data: DashboardOverviewData }) {
  return (
    <GlassCard title="Growth Engine Health" description="System readiness score">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative flex size-28 shrink-0 items-center justify-center rounded-full border border-violet-500/25 bg-gradient-to-br from-violet-600/20 to-cyan-500/10">
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums text-foreground">{data.healthScore}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">/ 100</p>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2.5">
          {data.healthChecks.map((check) => (
            <li key={check.id} className="flex items-start gap-2.5 text-sm">
              {check.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-amber-400" />
              )}
              <div>
                <span className="font-medium text-foreground">{check.label}</span>
                <span className="text-muted-foreground"> — {check.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}

export function RevenueForecastCard({ data }: { data: DashboardOverviewData }) {
  const r = data.revenue;
  const items = [
    { label: "Today forecast", value: r.today },
    { label: "7-day forecast", value: r.sevenDay },
    { label: "30-day forecast", value: r.thirtyDay },
    { label: "Pipeline value", value: r.pipelineValue },
  ];
  return (
    <GlassCard title="Revenue Forecast" description="AI-modeled pipeline outlook">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(item.value)}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function FunnelSnapshot({ data }: { data: DashboardOverviewData }) {
  const max = Math.max(...data.funnel.map((s) => s.count), 1);
  return (
    <GlassCard title="Funnel Snapshot" description="Visitors → Won">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-2">
        {data.funnel.map((stage, i) => (
          <div key={stage.key} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums">{stage.count.toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{stage.label}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                  style={{ width: `${Math.max(8, (stage.count / max) * 100)}%` }}
                />
              </div>
            </div>
            {i < data.funnel.length - 1 ? (
              <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground lg:block" />
            ) : null}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function QuickActionsRow() {
  const actions = [
    { label: "Create Campaign", href: "/dashboard/engine", icon: Rocket },
    { label: "Build Landing Page", href: "/dashboard/funnel", icon: Megaphone },
    { label: "Activate Agent", href: "/dashboard/agents", icon: Bot },
    { label: "Import Leads", href: "/dashboard/leads", icon: Import },
    { label: "Connect Ad Account", href: "/dashboard/ads", icon: Plug },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl border-white/10 bg-white/[0.03] hover:border-violet-500/30 hover:bg-violet-500/10",
          )}
        >
          <a.icon className="size-3.5" />
          {a.label}
        </Link>
      ))}
    </div>
  );
}

export function AiRecommendationsPanel({ data }: { data: DashboardOverviewData }) {
  return (
    <GlassCard title="AI Recommendations" description="Highest-impact next moves">
      <ul className="space-y-3">
        {data.recommendations.map((rec) => (
          <li
            key={rec.id}
            className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-foreground">{rec.title}</p>
              <p className="text-xs text-cyan-200/80">{rec.impact}</p>
            </div>
            <Link
              href={rec.href}
              className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "shrink-0 rounded-xl")}
            >
              {rec.cta}
            </Link>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function OpportunityFeed({ data }: { data: DashboardOverviewData }) {
  const priorityColor = {
    high: "border-rose-500/20 bg-rose-500/5",
    medium: "border-amber-500/20 bg-amber-500/5",
    low: "border-white/[0.06] bg-white/[0.02]",
  };
  return (
    <GlassCard
      title="Opportunity Feed"
      description="Intelligent insights — separate from system events"
      headerExtra={<TrendingUp className="size-4 text-cyan-400" />}
    >
      <ul className="space-y-2">
        {data.opportunities.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-xl border p-3 transition-colors hover:bg-white/[0.03]",
              priorityColor[item.priority],
            )}
          >
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function AgentPerformanceBoard({ data }: { data: DashboardOverviewData }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Agent Performance Board</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.agentPerformance.map((agent) => (
          <GlassCard key={agent.key} title={agent.name} contentClassName="space-y-3">
            <div className="flex items-center justify-between gap-2">
              {agentBadge(agent.status)}
              <span className="text-xs text-muted-foreground">{agent.lastActivity}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">Task:</span> {agent.currentTask}
            </p>
            <p className="text-sm font-medium text-cyan-200/90">{agent.resultMetric}</p>
            <Link
              href={agent.href}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full rounded-xl")}
            >
              View Results
            </Link>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

export function AccountConnectionCenter({ data }: { data: DashboardOverviewData }) {
  return (
    <GlassCard title="Account Connection Center" description="Integrations at a glance">
      <div className="grid gap-2 sm:grid-cols-2">
        {data.connections.map((conn) => (
          <Link
            key={conn.id}
            href={conn.href}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-violet-500/25 hover:bg-white/[0.04]"
          >
            <span className="text-sm font-medium">{conn.name}</span>
            {connectionBadge(conn.status)}
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}

export function BusinessGoalsWidget({ data }: { data: DashboardOverviewData }) {
  return (
    <GlassCard title="Business Goals" description="Monthly progress">
      <div className="space-y-4">
        {data.goals.map((goal) => (
          <GoalBar
            key={goal.id}
            label={goal.label}
            current={goal.current}
            target={goal.target}
            unit={goal.unit}
          />
        ))}
      </div>
    </GlassCard>
  );
}
