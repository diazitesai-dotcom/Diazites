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
  LineChart,
  Megaphone,
  Plug,
  Rocket,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { AnimatedCounter, AnimatedMoney } from "@/components/dashboard/mission-control/animated-counter";
import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { HealthRadialChart } from "@/components/dashboard/mission-control/health-radial-chart";
import { FunnelEmptyHint } from "@/components/dashboard/mission-control/mission-empty-states";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
      return (
        <Badge variant="success" className="animate-none">
          Connected
        </Badge>
      );
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "error":
      return <Badge variant="destructive" className="animate-pulse">
        Error
      </Badge>;
    default:
      return <Badge variant="outline">Missing</Badge>;
  }
}

function agentBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge variant="success" className="shadow-[0_0_12px_-4px_rgba(52,211,153,0.5)]">
          Active
        </Badge>
      );
    case "pending":
      return <Badge variant="warning" className="animate-pulse">
        Pending
      </Badge>;
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
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
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
          <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
            <Sparkles className="size-3" />
            Live
          </span>
        }
      >
        <div className="mb-5 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 p-4">
          <p className="text-sm leading-relaxed text-foreground/95">{b.aiInsight}</p>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Highest leverage
              </p>
              <p className="text-sm font-semibold text-violet-200">{b.leverageRecommendation}</p>
              <p className="mt-1 text-xs text-cyan-200/80">Expected impact: {b.expectedImpact}</p>
            </div>
            <Link
              href={data.nextAction.href}
              className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "shrink-0 rounded-xl")}
            >
              Take action
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Leads captured", value: b.leadsCaptured, icon: Target, animate: true },
            { label: "Campaign status", value: b.campaignStatus, icon: Megaphone, animate: false },
            { label: "Agent status", value: b.agentStatus, icon: Bot, animate: false },
            { label: "Missed opportunity", value: b.missedOpportunity, icon: AlertCircle, animate: false },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all duration-300 hover:border-violet-500/25 hover:bg-white/[0.04] hover:shadow-[0_4px_20px_-10px_rgba(139,92,246,0.3)]"
            >
              <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <item.icon className="size-3.5 text-violet-400" />
                {item.label}
              </div>
              <p className="text-sm font-medium leading-snug text-foreground">
                {item.animate ? (
                  <AnimatedCounter value={item.value as number} />
                ) : (
                  item.value
                )}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/dashboard/engine"
            className={cn(buttonVariants({ variant: "gradient" }), "rounded-xl")}
          >
            Generate Strategy
          </Link>
          <Link
            href="/dashboard/campaigns"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Launch Campaign
          </Link>
          <Link
            href="/dashboard/agents"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Ask AI
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function RecommendedNextActionCard({ data }: { data: DashboardOverviewData }) {
  const action = data.nextAction;
  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Recommended Next Action"
        description="Highest-leverage move right now"
        className="border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-card/80 to-violet-950/20"
        headerExtra={<Zap className="size-4 text-amber-400" />}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight text-foreground">{action.title}</p>
            <p className="text-sm text-cyan-200/90">{action.impact}</p>
          </div>
          <Link
            href={action.href}
            className={cn(
              buttonVariants({ variant: "gradient", size: "lg" }),
              "shrink-0 rounded-xl shadow-[0_8px_32px_-12px_rgba(99,102,241,0.5)]",
            )}
          >
            {action.cta}
            <ArrowRight className="size-4" />
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
        <HealthRadialChart score={data.healthScore} />
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
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-violet-500/20"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              <AnimatedMoney value={item.value} />
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function MarketSignalsWidget({ data }: { data: DashboardOverviewData }) {
  return (
    <GlassCard
      title="Market Signals"
      description="External demand & cost intelligence"
      headerExtra={<LineChart className="size-4 text-cyan-400" />}
    >
      <ul className="space-y-3">
        {data.marketSignals.map((signal) => (
          <li
            key={signal.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {signal.label}
                </p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0 text-[9px] font-semibold tabular-nums text-violet-300">
                  {signal.confidence}% conf.
                </span>
              </div>
              <p className="font-semibold text-foreground">{signal.value}</p>
              <p className="text-xs text-muted-foreground">{signal.detail}</p>
              <p className="text-[10px] text-muted-foreground/80">Source: {signal.source}</p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                signal.direction === "up"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                  : signal.direction === "down"
                    ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-white/[0.04] text-muted-foreground",
              )}
            >
              {signal.direction === "up" ? (
                <TrendingUp className="size-3" />
              ) : signal.direction === "down" ? (
                <TrendingDown className="size-3" />
              ) : null}
              {signal.change}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function FunnelSnapshot({ data }: { data: DashboardOverviewData }) {
  const hasLeads = data.funnel.some((s) => s.key === "leads" && s.count > 0);
  const dx = data.funnelDiagnosis;
  return (
    <GlassCard title="Funnel Snapshot" description="Visitors → Won with step conversion">
      <div className="mb-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-violet-500/5 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
          AI bottleneck diagnosis
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{dx.summary}</p>
        {dx.dropoffPercent > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Drop-off at <span className="font-medium text-amber-200">{dx.dropoffStage}</span>:{" "}
            <span className="tabular-nums font-semibold text-amber-300">{dx.dropoffPercent}%</span>{" "}
            lost vs previous stage
          </p>
        ) : null}
        <p className="mt-2 text-xs text-cyan-200/80">{dx.recommendation}</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
        {data.funnel.map((stage, i) => (
          <div key={stage.key} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "w-full rounded-xl border p-4 text-center transition-all duration-300 hover:-translate-y-0.5",
                stage.isBottleneck
                  ? "border-amber-500/40 bg-amber-500/10 shadow-[0_0_24px_-8px_rgba(251,191,36,0.35)]"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-violet-500/25",
              )}
            >
              {stage.isBottleneck ? (
                <span className="mb-2 inline-block animate-pulse rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                  Bottleneck
                </span>
              ) : null}
              <p className="text-2xl font-semibold tabular-nums">
                <AnimatedCounter value={stage.count} format={(n) => n.toLocaleString()} />
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{stage.label}</p>
              {stage.conversionRate != null ? (
                <p
                  className={cn(
                    "mt-2 text-[11px] font-semibold tabular-nums",
                    stage.isBottleneck ? "text-amber-300" : "text-cyan-300/90",
                  )}
                >
                  {stage.conversionRate}% convert
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">Top of funnel</p>
              )}
              {stage.dropoffPercent != null && stage.dropoffPercent > 0 ? (
                <p className="mt-1 text-[10px] tabular-nums text-rose-300/80">
                  −{stage.dropoffPercent}% drop-off
                </p>
              ) : null}
            </div>
            {i < data.funnel.length - 1 ? (
              <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground lg:block" />
            ) : null}
          </div>
        ))}
      </div>
      {!hasLeads ? <FunnelEmptyHint /> : null}
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
            "rounded-xl border-white/10 bg-white/[0.03] transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-[0_4px_20px_-8px_rgba(139,92,246,0.35)]",
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
            className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-violet-500/20 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
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
    high: "border-rose-500/25 bg-rose-500/5",
    medium: "border-amber-500/20 bg-amber-500/5",
    low: "border-white/[0.06] bg-white/[0.02]",
  };
  return (
    <GlassCard
      title="Opportunity Feed"
      description="AI-detected opportunities with one-click deploy"
      headerExtra={
        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-200">
          AI
        </span>
      }
    >
      <ul className="space-y-3">
        {data.opportunities.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-xl border p-4 transition-all hover:shadow-[0_4px_20px_-10px_rgba(139,92,246,0.25)]",
              priorityColor[item.priority],
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.priority === "high" ? (
                    <Badge variant="destructive" className="animate-pulse text-[10px]">
                      High
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                <p className="text-xs font-medium text-cyan-200/80">{item.impact}</p>
              </div>
              <Link
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "gradient", size: "sm" }),
                  "shrink-0 rounded-xl",
                )}
              >
                {item.cta}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function AgentPerformanceBoard({ data }: { data: DashboardOverviewData }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="size-5 text-violet-400" />
        <h2 className="text-lg font-semibold tracking-tight">Agent Performance Board</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.agentPerformance.map((agent) => (
          <motion.div
            key={agent.key}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
          >
            <GlassCard title={agent.name} contentClassName="space-y-3">
              <div className="flex items-center justify-between gap-2">
                {agentBadge(agent.status)}
                <span className="text-xs text-muted-foreground">{agent.lastActivity}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                  <p className="text-[9px] uppercase text-muted-foreground">Score</p>
                  <p className="text-sm font-bold tabular-nums text-violet-200">
                    {agent.status === "active" ? (
                      <AnimatedCounter value={agent.performanceScore} format={(n) => `${n}`} />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                  <p className="text-[9px] uppercase text-muted-foreground">Runs</p>
                  <p className="text-sm font-bold tabular-nums">
                    {agent.status === "active" ? (
                      <AnimatedCounter value={agent.executionCount} />
                    ) : (
                      "0"
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                  <p className="text-[9px] uppercase text-muted-foreground">Rate</p>
                  <p className="text-sm font-bold tabular-nums text-cyan-200/90">
                    {agent.status === "active" ? `${agent.resultRate}%` : "—"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground">Task:</span> {agent.currentTask}
              </p>
              <p className="text-sm font-medium text-cyan-200/90">{agent.resultMetric}</p>
              <p className="text-[11px] text-muted-foreground">
                Last execution: <span className="text-foreground">{agent.lastExecutedAt}</span>
              </p>
              <Link
                href={agent.href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full rounded-xl transition-all hover:border-violet-500/30",
                )}
              >
                View Results
              </Link>
            </GlassCard>
          </motion.div>
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
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-violet-500/30 hover:bg-white/[0.05] hover:shadow-[0_4px_16px_-8px_rgba(139,92,246,0.3)]"
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
    <GlassCard title="Business Goals" description="Monthly progress toward targets">
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
