"use client";

import { motion } from "framer-motion";
import { ArrowDown, GitBranch } from "lucide-react";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { buildOrchestrationFlow } from "@/lib/dashboard/build-orchestration-flow";
import type {
  OrchestrationFlowStatus,
  OrchestrationFlowStep,
} from "@/lib/dashboard/build-orchestration-flow";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FLOW_BADGE: Record<OrchestrationFlowStatus, string> = {
  live: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200 mission-timeline-dot-pulse",
  active: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
  running: "border-amber-500/35 bg-amber-500/12 text-amber-200 mission-timeline-dot-pulse",
  processing: "border-sky-500/35 bg-sky-500/12 text-sky-200",
  inactive: "border-white/15 bg-white/[0.04] text-muted-foreground",
};

function FlowStatusBadge({ label, status }: { label: string; status: OrchestrationFlowStatus }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        FLOW_BADGE[status],
      )}
    >
      {label}
    </span>
  );
}

function FlowConnector({ metric }: { metric: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1.5">
      <ArrowDown className="size-4 text-violet-400/80" aria-hidden />
      <span className="text-[11px] font-medium tabular-nums text-cyan-300/90">{metric}</span>
    </div>
  );
}

function OrchestrationMapFlow({ steps }: { steps: OrchestrationFlowStep[] }) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col">
      {steps.map((step, i) => (
        <div key={step.id}>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 to-transparent px-4 py-3",
              step.status === "live" && "border-cyan-500/30 shadow-[0_0_24px_-12px_rgba(34,211,238,0.35)]",
              step.status === "running" && "border-amber-500/25",
            )}
          >
            <p className="text-sm font-semibold">{step.label}</p>
            <FlowStatusBadge label={step.statusLabel} status={step.status} />
          </motion.div>
          {step.flowMetric && i < steps.length - 1 ? (
            <FlowConnector metric={`↓ ${step.flowMetric}`} />
          ) : null}
        </div>
      ))}
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
  const steps = flow?.length ? flow : EMPTY_FLOW;

  if (embedded) {
    return (
      <div className={className}>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Orchestration map
        </p>
        <OrchestrationMapFlow steps={steps} />
      </div>
    );
  }

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show" className={className}>
      <GlassCard
        title="Orchestration map"
        description="Live flow — status and volume between agents"
        headerExtra={
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-200">
            <GitBranch className="size-3" />
            Live
          </span>
        }
      >
        <OrchestrationMapFlow steps={steps} />
      </GlassCard>
    </motion.div>
  );
}
