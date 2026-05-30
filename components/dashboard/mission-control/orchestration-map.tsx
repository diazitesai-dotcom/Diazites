"use client";

import { motion } from "framer-motion";
import { ChevronRight, GitBranch, TrendingUp } from "lucide-react";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { MapModuleCardSkeleton } from "@/components/dashboard/mission-control/map-module-card-skeleton";
import { useSystemModuleOptional } from "@/components/dashboard/mission-control/system-module-provider";
import { buildOrchestrationFlow } from "@/lib/dashboard/build-orchestration-flow";
import type {
  OrchestrationFlowStatus,
  OrchestrationFlowStep,
} from "@/lib/dashboard/build-orchestration-flow";
import type { SystemModuleDisplayState, SystemModuleId } from "@/lib/dashboard/system-module-types";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FLOW_BADGE: Record<OrchestrationFlowStatus, string> = {
  live: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200 mission-timeline-dot-pulse",
  active: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
  running: "border-amber-500/35 bg-amber-500/12 text-amber-200 mission-timeline-dot-pulse",
  healthy: "border-teal-500/35 bg-teal-500/12 text-teal-200",
  connected: "border-violet-500/35 bg-violet-500/12 text-violet-200",
  processing: "border-sky-500/35 bg-sky-500/12 text-sky-200 mission-eta-tick",
  inactive: "border-white/15 bg-white/[0.04] text-muted-foreground",
};

const DISPLAY_BADGE: Record<SystemModuleDisplayState, string> = {
  live: FLOW_BADGE.live,
  running: FLOW_BADGE.running,
  active: FLOW_BADGE.active,
  processing: FLOW_BADGE.processing,
  failed: "border-rose-500/40 bg-rose-500/12 text-rose-300",
  needs_attention: "border-amber-500/35 bg-amber-500/12 text-amber-200",
  idle: FLOW_BADGE.inactive,
  disconnected: "border-white/20 bg-white/[0.04] text-muted-foreground",
};

const NODE_BORDER: Record<OrchestrationFlowStatus, string> = {
  live: "border-cyan-500/35 bg-gradient-to-r from-cyan-500/10 to-transparent shadow-[0_0_20px_-10px_rgba(34,211,238,0.4)]",
  active: "border-emerald-500/30 bg-gradient-to-r from-emerald-500/8 to-transparent",
  running: "border-amber-500/30 bg-gradient-to-r from-amber-500/8 to-transparent",
  healthy: "border-teal-500/30 bg-gradient-to-r from-teal-500/8 to-transparent",
  connected: "border-violet-500/30 bg-gradient-to-r from-violet-500/8 to-transparent",
  processing: "border-sky-500/30 bg-gradient-to-r from-sky-500/8 to-transparent",
  inactive: "border-white/10 bg-white/[0.02]",
};

const DISPLAY_BORDER: Partial<Record<SystemModuleDisplayState, string>> = {
  failed: "border-rose-500/35 bg-gradient-to-r from-rose-500/10 to-transparent",
  needs_attention: "border-amber-500/30 bg-gradient-to-r from-amber-500/8 to-transparent",
  live: NODE_BORDER.live,
  disconnected: "border-white/15 bg-white/[0.02] opacity-80",
};

function FlowStatusBadge({
  label,
  status,
  displayState,
}: {
  label: string;
  status: OrchestrationFlowStatus;
  displayState?: SystemModuleDisplayState;
}) {
  const badgeClass = displayState ? DISPLAY_BADGE[displayState] : FLOW_BADGE[status];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        badgeClass,
      )}
    >
      {displayState ? displayState.replace(/_/g, " ") : label}
    </span>
  );
}

function MicroSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const w = 48;
  const h = 16;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="opacity-80" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400" points={points} />
    </svg>
  );
}

function AnimatedFlowConnector({
  nextState,
}: {
  nextState?: SystemModuleDisplayState;
}) {
  const fail = nextState === "failed";
  const warn = nextState === "processing" || nextState === "needs_attention";
  return (
    <div className="relative flex h-10 justify-center" aria-hidden>
      <div
        className={cn(
          "h-full w-px bg-gradient-to-b from-violet-500/40 to-cyan-500/25",
          warn && "from-amber-500/50 to-amber-500/20",
          fail && "from-rose-500/60 to-rose-500/20",
        )}
      />
      <motion.div
        className={cn(
          "absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.5)]",
          warn && "bg-amber-400 shadow-amber-400/40",
          fail && "animate-pulse bg-rose-400 shadow-rose-400/40",
        )}
        animate={{ y: [-14, 14] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
      />
    </div>
  );
}

function OrchestrationMapFlow({
  steps,
  activeModuleId,
  onSelect,
  displayStates,
  emptyModules,
  loadingModuleId,
  moduleSummaries,
}: {
  steps: OrchestrationFlowStep[];
  activeModuleId: SystemModuleId | null;
  onSelect?: (id: SystemModuleId) => void;
  displayStates: Partial<Record<SystemModuleId, SystemModuleDisplayState>>;
  emptyModules: Partial<Record<SystemModuleId, boolean>>;
  loadingModuleId: SystemModuleId | null;
  moduleSummaries: Partial<Record<SystemModuleId, string>>;
}) {
  const interactive = Boolean(onSelect);

  return (
    <div className="mx-auto w-full max-w-md space-y-0">
      {steps.map((step, i) => {
        const moduleId = step.id as SystemModuleId;
        const displayState = displayStates[moduleId];
        const nextDisplay = steps[i + 1]
          ? displayStates[steps[i + 1].id as SystemModuleId]
          : undefined;
        const isActive = activeModuleId === moduleId;
        const isLoading = loadingModuleId === moduleId;
        const isEmpty = emptyModules[moduleId];
        const borderClass =
          (displayState && DISPLAY_BORDER[displayState]) ?? NODE_BORDER[step.status];
        const hint =
          moduleSummaries[moduleId] ??
          step.healthHint ??
          (displayState === "disconnected" ? "Integration missing." : undefined);

        const CardTag = interactive ? "button" : "div";

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <CardTag
              {...(interactive
                ? {
                    type: "button" as const,
                    onClick: () => onSelect?.(moduleId),
                    "aria-label": `Open ${step.label} details`,
                    "aria-pressed": isActive,
                  }
                : {})}
              title={hint}
              className={cn(
                "group relative w-full rounded-xl border px-3 py-2.5 text-left transition-all sm:px-4 sm:py-3",
                interactive &&
                  "cursor-pointer hover:ring-2 hover:ring-cyan-500/35 hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.35)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50",
                borderClass,
                isActive && interactive && "ring-2 ring-violet-400/60",
                displayState === "failed" && "ring-rose-500/30",
                displayState === "needs_attention" && !isActive && "ring-amber-500/20",
                isEmpty && !isLoading && "opacity-90",
              )}
            >
              {isLoading ? <MapModuleCardSkeleton /> : null}
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[1fr_auto_auto]">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="min-w-0 text-sm font-semibold group-hover:text-cyan-100">{step.label}</p>
                  {interactive ? (
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {step.sparkTrend?.length ? <MicroSparkline values={step.sparkTrend} /> : null}
                    <div>
                      <p className="text-[11px] font-medium tabular-nums text-cyan-300/90 sm:text-xs">
                        {step.throughput}
                      </p>
                      {step.trendPercent != null ? (
                        <p className="flex items-center justify-end gap-0.5 text-[10px] text-emerald-400">
                          <TrendingUp className="size-2.5" />+{step.trendPercent}%
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {step.secondaryMetric ? (
                    <p className="text-[10px] tabular-nums text-muted-foreground">{step.secondaryMetric}</p>
                  ) : null}
                  {step.runtimeMetric ? (
                    <p className="text-[10px] tabular-nums text-violet-200/80">{step.runtimeMetric}</p>
                  ) : null}
                </div>
                <FlowStatusBadge
                  label={step.statusLabel}
                  status={step.status}
                  displayState={displayState}
                />
              </div>
              {isEmpty && !isLoading ? (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  No data yet — click to set up
                </p>
              ) : null}
              {step.signal ? (
                <div className="mt-2.5 rounded-lg border border-cyan-500/25 bg-cyan-500/8 px-2.5 py-2 text-[11px] leading-relaxed">
                  <p className="font-semibold text-cyan-100">{step.signal.headline}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    <span className="font-medium text-cyan-200/80">Source: </span>
                    {step.signal.source}
                  </p>
                </div>
              ) : null}
              {interactive ? (
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-cyan-300/0 transition-colors group-hover:text-cyan-300/80">
                  Inspect module →
                </p>
              ) : null}
            </CardTag>
            {i < steps.length - 1 ? <AnimatedFlowConnector nextState={nextDisplay} /> : null}
          </motion.div>
        );
      })}
    </div>
  );
}

const EMPTY_FLOW = buildOrchestrationFlow({
  funnelCounts: { visitors: 0, leads: 0, qualified: 0, booked: 0 },
  agents: [],
});

export function OrchestrationMap({
  className,
  embedded = false,
  flow,
}: {
  className?: string;
  embedded?: boolean;
  flow?: OrchestrationFlowStep[];
}) {
  const systemModule = useSystemModuleOptional();
  const steps = flow?.length ? flow : EMPTY_FLOW;

  const moduleIds = ["traffic", "landing", "qualify", "followup", "crm", "optimize"] as SystemModuleId[];

  const displayStates = systemModule
    ? (Object.fromEntries(
        moduleIds.map((id) => [id, systemModule.details[id].displayState]),
      ) as Partial<Record<SystemModuleId, SystemModuleDisplayState>>)
    : {};

  const emptyModules = systemModule
    ? (Object.fromEntries(moduleIds.map((id) => [id, systemModule.details[id].isEmpty])) as Partial<
        Record<SystemModuleId, boolean>
      >)
    : {};

  const moduleSummaries = systemModule
    ? (Object.fromEntries(moduleIds.map((id) => [id, systemModule.details[id].summary])) as Partial<
        Record<SystemModuleId, string>
      >)
    : {};

  const loadingModuleId =
    systemModule?.loading && systemModule.activeModule ? systemModule.activeModule : null;

  const flowContent = (
    <OrchestrationMapFlow
      steps={steps}
      activeModuleId={systemModule?.activeModule ?? null}
      onSelect={systemModule?.openModule}
      displayStates={displayStates}
      emptyModules={emptyModules}
      loadingModuleId={loadingModuleId}
      moduleSummaries={moduleSummaries}
    />
  );

  if (embedded) {
    return (
      <div className={className}>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live system map · click any module
        </p>
        {flowContent}
      </div>
    );
  }

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show" className={className}>
      <GlassCard
        title="Live system map"
        description="Click any module for logs, controls, and live telemetry"
        headerExtra={
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-200 mission-timeline-dot-pulse">
            <GitBranch className="size-3" />
            Live
          </span>
        }
      >
        {flowContent}
      </GlassCard>
    </motion.div>
  );
}
