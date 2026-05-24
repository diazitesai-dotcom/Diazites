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

import { useState } from "react";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { OpportunityDeployPreview } from "@/components/dashboard/mission-control/opportunity-deploy-preview";
import { BusinessOutcomeBlock } from "@/components/dashboard/mission-control/business-outcome-block";
import { PlanIntelligenceMeta, resolvePlanIntelligence } from "@/components/dashboard/mission-control/plan-intelligence-meta";
import { AnimatedCounter, AnimatedMoney } from "@/components/dashboard/mission-control/animated-counter";
import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { inferGoalFromHref } from "@/lib/agents/deployment-catalog";
import { HealthRadialChart } from "@/components/dashboard/mission-control/health-radial-chart";
import { FunnelEmptyHint } from "@/components/dashboard/mission-control/mission-empty-states";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import type {
  BusinessGoal,
  ConnectionStatus,
  OpportunityItem,
} from "@/lib/dashboard/mission-control-types";
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
        <Badge
          variant="success"
          className="shadow-[0_0_16px_-2px_rgba(52,211,153,0.6)] ring-1 ring-emerald-400/40"
        >
          <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-300" />
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

const pacingStyles = {
  ahead: "text-emerald-300",
  on_track: "text-cyan-300",
  behind: "text-amber-300",
};

function GoalDiagnosticRow({ goal }: { goal: BusinessGoal }) {
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const display =
    goal.unit === "currency"
      ? `${formatMoney(goal.current)} / ${formatMoney(goal.target)}`
      : `${goal.current} / ${goal.target}`;

  return (
    <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{goal.label}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{display}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="grid gap-1 text-[11px]">
        <p className="text-muted-foreground">
          Forecast pacing:{" "}
          <span className={cn("font-semibold", pacingStyles[goal.pacingStatus])}>
            {goal.pacingLabel}
          </span>
        </p>
        {goal.projectedLabel ? (
          <p className="text-muted-foreground">
            Projected: <span className="font-medium text-foreground">{goal.projectedLabel}</span>
          </p>
        ) : null}
        {goal.pacePerDay != null ? (
          <p className="text-muted-foreground">
            Current pace:{" "}
            <span className="font-medium text-foreground">{goal.pacePerDay}/day</span>
          </p>
        ) : null}
        {goal.etaDays != null && goal.etaDays > 0 ? (
          <p className="text-muted-foreground">
            ETA: <span className="font-medium text-violet-200">{goal.etaDays} days remaining</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AiCommandBriefing({ data }: { data: DashboardOverviewData }) {
  const { openDeployment } = useAgentDeployment();
  const b = data.briefing;
  const riskStyles = {
    low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };
  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="AI Command Briefing"
        description="Executive snapshot — what matters right now"
        className="border-violet-500/15 shadow-[0_12px_48px_-20px_rgba(139,92,246,0.35)]"
        headerExtra={
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
              <Sparkles className="size-3" />
              Live
            </span>
            <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-cyan-200">
              {b.aiConfidence}% AI confidence
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                riskStyles[b.riskLevel],
              )}
            >
              {b.riskLevel} risk
            </span>
          </div>
        }
      >
        <motion.div className="mb-5 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 p-4">
          {b.trafficSignal ? (
            <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5">
              <p className="text-sm font-semibold text-cyan-100">{b.trafficSignal.headline}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-cyan-200/90">Source: </span>
                {b.trafficSignal.source}
              </p>
            </div>
          ) : null}
          <p className="text-sm leading-relaxed text-foreground/95">{b.aiInsight}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Expected uplift (model)
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-300/95">{b.expectedUplift}</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Highest leverage
              </p>
              <p className="mt-1 text-sm font-semibold text-violet-200">{b.leverageRecommendation}</p>
              <p className="mt-1 text-xs text-cyan-200/80">{b.expectedImpact}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end border-t border-white/[0.06] pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl border-white/10"
              onClick={() =>
                openDeployment({
                  goal: inferGoalFromHref(data.nextAction.href),
                  step: "plan",
                  source: "command_briefing",
                })
              }
            >
              Review AI Plan
            </Button>
          </div>
        </motion.div>

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
        <div className="mt-5 flex justify-end">
          <Link
            href="/dashboard/engine"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-xs text-muted-foreground hover:text-foreground",
            )}
          >
            Open engine workspace →
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function RecommendedNextActionCard({ data }: { data: DashboardOverviewData }) {
  const { openDeployment } = useAgentDeployment();
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
            <BusinessOutcomeBlock outcome={action.businessOutcome} />
            <PlanIntelligenceMeta
              confidence={action.confidence}
              risk={action.risk}
              deployEtaSeconds={action.deployEtaSeconds}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="shrink-0 rounded-xl border-white/10"
            onClick={() =>
              openDeployment({
                goal: inferGoalFromHref(action.href),
                step: "plan",
                source: "recommended_action",
              })
            }
          >
            Review Plan
            <ArrowRight className="size-4" />
          </Button>
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
    <GlassCard
      title="Revenue Forecast"
      description="AI-modeled pipeline outlook"
      headerExtra={
        <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-violet-200">
          {r.confidence}% model confidence
        </span>
      }
    >
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{r.explanation}</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="mission-elevate rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
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

const diagnosticStyles = {
  healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-400 animate-pulse",
};

export function AiDiagnosticsWidget({ data }: { data: DashboardOverviewData }) {
  return (
    <GlassCard title="AI Diagnostics" description="Subsystem health at a glance">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {data.diagnostics.map((d) => (
          <div
            key={d.id}
            className={cn(
              "mission-elevate rounded-xl border p-3 text-center transition-all",
              diagnosticStyles[d.status],
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide">{d.label}</p>
            <p className="mt-1 text-[11px] capitalize opacity-90">{d.status}</p>
            <p className="mt-1 text-[10px] leading-snug opacity-80">{d.detail}</p>
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
    {
      label: "Agent workspace",
      href: "/dashboard/agents",
      icon: Bot,
    },
    { label: "Import Leads", href: "/dashboard/leads", icon: Import },
    { label: "Connect Ad Account", href: "/dashboard/ads", icon: Plug },
    { label: "View reports", href: "/dashboard/reports", icon: LineChart },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl border-white/10 bg-white/[0.03] transition-all hover:border-violet-500/40 hover:bg-violet-500/10",
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
  const { openDeployment } = useAgentDeployment();
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
              <PlanIntelligenceMeta
                confidence={rec.confidence}
                risk={rec.risk}
                deployEtaSeconds={rec.deployEtaSeconds}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl border-white/10"
              onClick={() =>
                openDeployment({
                  goal: inferGoalFromHref(rec.href),
                  step: "plan",
                  source: "recommendation",
                })
              }
            >
              Review Plan
            </Button>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function OpportunityFeed({ data }: { data: DashboardOverviewData }) {
  const { openDeployment } = useAgentDeployment();
  const [previewOpp, setPreviewOpp] = useState<OpportunityItem | null>(null);
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
                <PlanIntelligenceMeta {...resolvePlanIntelligence(item)} className="pt-0.5" />
                {item.reasoning ? (
                  <p className="text-[11px] leading-relaxed text-muted-foreground/90">
                    <span className="font-medium text-violet-300/90">Why this surfaced: </span>
                    {item.reasoning}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl border-white/10"
                onClick={() => {
                  if (item.deployPreview) {
                    setPreviewOpp(item);
                    return;
                  }
                  openDeployment(
                    item.id === "retargeting"
                      ? {
                          preset: "retargeting",
                          agent: "retargeting",
                          goal: "improve_conversion",
                          mode: "autonomous",
                          step: "plan",
                          source: "opportunity",
                        }
                      : {
                          goal: inferGoalFromHref(item.href),
                          step: "plan",
                          source: "opportunity",
                        },
                  );
                }}
              >
                Review Plan
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <OpportunityDeployPreview opportunity={previewOpp} onClose={() => setPreviewOpp(null)} />
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
        {data.agentPerformance.map((agent) => {
          const isActive = agent.status === "active";
          return (
          <motion.div
            key={agent.key}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className={cn(isActive && "rounded-2xl p-[1px] bg-gradient-to-br from-emerald-400/50 via-violet-500/30 to-cyan-400/40")}
          >
            <div className={cn(isActive && "agent-active-glow rounded-2xl bg-card/95")}>
            <GlassCard
              title={agent.name}
              contentClassName="space-y-3"
              className={cn(isActive && "border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-card/90")}
              headerExtra={
                isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                    </span>
                    Running
                  </span>
                ) : undefined
              }
            >
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
                  "mission-shimmer-btn w-full rounded-xl transition-all hover:border-violet-500/30",
                )}
              >
                View Results
              </Link>
            </GlassCard>
            </div>
          </motion.div>
          );
        })}
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
  const coaching = data.goalCoaching;
  return (
    <GlassCard title="Business Goals" description="Diagnostics, pacing, and AI coaching">
      <div className="space-y-3">
        {data.goals.map((goal) => (
          <GoalDiagnosticRow key={goal.id} goal={goal} />
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">
          AI Insight
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Highest blocker:{" "}
          <span className="font-medium text-foreground">{coaching.blocker}</span>
        </p>
        <p className="mt-1 text-xs text-cyan-200/90">
          Suggested move: {coaching.suggestedMove}
        </p>
      </div>
    </GlassCard>
  );
}
