"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Cpu,
  FileText,
  Megaphone,
  Radar,
  Rocket,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { AiModeCallout } from "@/components/agents/ai-mode-callout";
import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { OrchestrationStatusBadge } from "@/components/dashboard/mission-control/orchestration-status-badge";
import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { AI_MODE_BEHAVIOR } from "@/lib/agents/ai-mode-behavior";
import { Button } from "@/components/ui/button";
import { RETARGETING_DEPLOYMENT_PRESET } from "@/lib/agents/deployment-presets";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { AutonomousMode } from "@/types/agent-deployment";

const TIMELINE_ICONS = {
  asset: FileText,
  campaign: Megaphone,
  lead: Users,
  execution: Cpu,
  deployment: Rocket,
} as const;

export function RetargetingAgentDeploymentPanel() {
  const { openDeployment } = useAgentDeployment();
  const preset = RETARGETING_DEPLOYMENT_PRESET;
  const [mode, setMode] = useState<AutonomousMode>(preset.defaultMode);

  function deployRetargeting() {
    openDeployment({
      preset: "retargeting",
      agent: preset.agent,
      goal: preset.goal,
      mode,
      step: "readiness",
      source: "opportunity",
    });
  }

  function deployFullEngine() {
    openDeployment({
      goal: "deploy_full_growth_engine",
      stack: "growth_engine",
      mode,
      source: "growth_engine",
    });
  }

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title={preset.title}
        description="AI-detected recovery opportunity · one-click deploy"
        className="border-cyan-500/20 shadow-[0_12px_48px_-20px_rgba(34,211,238,0.25)]"
        headerExtra={
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
            <Radar className="size-3" />
            High intent
          </span>
        }
      >
        <motion.div
          className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 p-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Expected
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-emerald-300/95">
                {preset.expectedUplift}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Audience
              </dt>
              <dd className="mt-0.5 text-sm font-medium">{preset.audience}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Budget
              </dt>
              <dd className="mt-0.5 text-sm font-medium">{preset.budgetDaily}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Sequence
              </dt>
              <dd className="mt-0.5 text-sm font-medium">{preset.sequence}</dd>
            </div>
          </dl>

          <Button
            type="button"
            variant="gradient"
            className="mission-shimmer-btn mt-4 w-full rounded-xl"
            onClick={deployRetargeting}
          >
            <Rocket className="mr-2 size-4" />
            {AI_MODE_BEHAVIOR[mode].deployLabel}
          </Button>
        </motion.div>

        <div className="mt-5 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Why this matters
          </p>
          <ul className="space-y-2">
            {preset.whyItMatters.map((line) => (
              <li
                key={line}
                className="flex gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs leading-relaxed text-foreground/90"
              >
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-400" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <p className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Actions Today
          </p>
          {(
            [
              {
                label: "automations executed",
                value: preset.aiActionsToday.automationsExecuted,
                icon: Zap,
              },
              {
                label: "optimizations applied",
                value: preset.aiActionsToday.optimizationsApplied,
                icon: Activity,
              },
              {
                label: "opportunities deployed",
                value: preset.aiActionsToday.opportunitiesDeployed,
                icon: Target,
              },
            ] as const
          ).map((stat) => (
            <div
              key={stat.label}
              className="mission-elevate rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"
            >
              <stat.icon className="mx-auto size-3.5 text-violet-300" />
              <p className="mt-2 text-lg font-semibold tabular-nums">{stat.value}</p>
              <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Growth Engine Timeline
          </p>
          <ol className="space-y-0 border-l border-white/10 pl-3">
            {preset.growthTimeline.map((row) => {
              const Icon = TIMELINE_ICONS[row.kind] ?? Bot;
              return (
                <li key={row.label} className="relative pb-3 last:pb-0">
                  <span className="absolute -left-[15px] top-1 size-2 rounded-full bg-cyan-400/80 ring-2 ring-card" />
                  <div className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                    <Icon className="mt-0.5 size-3 text-violet-300" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] tabular-nums text-cyan-300/80">{row.time}</span>
                        <OrchestrationStatusBadge status={row.status} />
                      </div>
                      <p className="text-xs font-medium">{row.label}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Mode
          </p>
          <div className="mt-2 flex gap-1">
            {(["manual", "guided", "autonomous"] as AutonomousMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs capitalize transition-all",
                  mode === m
                    ? "border-violet-500/50 bg-violet-500/15 text-violet-100 shadow-[0_0_20px_-8px_rgba(139,92,246,0.5)]"
                    : "border-white/10 text-muted-foreground hover:border-white/20",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full border",
                    mode === m ? "border-violet-300 bg-violet-400" : "border-white/30",
                  )}
                />
                {m}
              </button>
            ))}
          </div>
          <AiModeCallout mode={mode} className="mt-3" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="mission-shimmer-btn mt-4 w-full rounded-xl border-white/10"
          onClick={deployFullEngine}
        >
          Deploy Full Growth Engine
        </Button>
      </GlassCard>
    </motion.div>
  );
}
