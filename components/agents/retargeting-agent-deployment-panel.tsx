"use client";

import { useMemo, useState } from "react";
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

import { AiModeSelector } from "@/components/agents/ai-mode-selector";
import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import {
  GrowthStackPreviewModal,
  type GrowthStackPreviewData,
} from "@/components/agents/growth-stack-preview-modal";
import { OrchestrationMap } from "@/components/dashboard/mission-control/orchestration-map";
import { OrchestrationTimelineRow } from "@/components/dashboard/mission-control/orchestration-timeline-row";
import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { Button } from "@/components/ui/button";
import { buildGrowthStackPreview } from "@/lib/agents/stack-deployment-catalog";
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
  const { openDeployment, agents } = useAgentDeployment();
  const preset = RETARGETING_DEPLOYMENT_PRESET;
  const [mode, setMode] = useState<AutonomousMode>(preset.defaultMode);
  const [growthPreviewOpen, setGrowthPreviewOpen] = useState(false);
  const growthPreview = useMemo(() => buildGrowthStackPreview(agents), [agents]);

  function reviewAiPlan() {
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
      step: "readiness",
    });
  }

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Growth execution stack"
        description="Recommendation → plan review → deployment → live orchestration"
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
          <p className="text-sm font-semibold">{preset.title}</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
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
            variant="outline"
            className="mt-4 w-full rounded-xl border-white/10"
            onClick={reviewAiPlan}
          >
            Review AI Plan
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
                  <span
                    className={cn(
                      "absolute -left-[15px] top-1 size-2 rounded-full ring-2 ring-card",
                      row.status === "running" ? "mission-timeline-dot-pulse bg-amber-400/90" : "bg-cyan-400/80",
                    )}
                  />
                  <OrchestrationTimelineRow icon={Icon} row={row} />
                </li>
              );
            })}
          </ol>
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <OrchestrationMap embedded />
          </div>
        </div>

        <AiModeSelector mode={mode} onChange={setMode} className="mt-5" />

        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="mission-shimmer-btn mt-5 w-full rounded-xl py-6 text-base shadow-[0_12px_40px_-12px_rgba(99,102,241,0.55)]"
          onClick={() => setGrowthPreviewOpen(true)}
        >
          <Rocket className="mr-2 size-5" />
          Deploy Full Growth Engine
        </Button>
      </GlassCard>

      <GrowthStackPreviewModal
        open={growthPreviewOpen}
        preview={growthPreview}
        onClose={() => setGrowthPreviewOpen(false)}
        onDeploy={deployFullEngine}
      />
    </motion.div>
  );
}
