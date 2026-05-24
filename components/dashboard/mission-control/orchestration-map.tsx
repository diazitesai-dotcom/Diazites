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
  healthy: "border-teal-500/35 bg-teal-500/12 text-teal-200",
  connected: "border-violet-500/35 bg-violet-500/12 text-violet-200",
  processing: "border-sky-500/35 bg-sky-500/12 text-sky-200 mission-eta-tick",
  inactive: "border-white/15 bg-white/[0.04] text-muted-foreground",
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

function FlowStatusBadge({ label, status }: { label: string; status: OrchestrationFlowStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        FLOW_BADGE[status],
      )}
    >
      {label}
    </span>
  );
}

function FlowConnector() {
  return (
    <motion.div
      className="flex justify-center py-1"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <ArrowDown className="size-4 text-violet-400/70" aria-hidden />
    </motion.div>
  );
}

function OrchestrationMapFlow({ steps }: { steps: OrchestrationFlowStep[] }) {
  return (
    <motion.div
      className="mx-auto w-full max-w-md space-y-0"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {steps.map((step, i) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
        >
          <motion.div
            className={cn(
              "rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3",
              NODE_BORDER[step.status],
            )}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <motion.div
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3"
            >
              <p className="min-w-0 truncate text-sm font-semibold">{step.label}</p>
              <span className="text-right text-[11px] font-medium tabular-nums text-cyan-300/90 sm:text-xs">
                {step.metric}
              </span>
              <FlowStatusBadge label={step.statusLabel} status={step.status} />
            </motion.div>
            {step.signal ? (
              <div className="mt-2.5 rounded-lg border border-cyan-500/25 bg-cyan-500/8 px-2.5 py-2 text-[11px] leading-relaxed">
                <p className="font-semibold text-cyan-100">{step.signal.headline}</p>
                <p className="mt-0.5 text-muted-foreground">
                  <span className="font-medium text-cyan-200/80">Source: </span>
                  {step.signal.source}
                </p>
              </div>
            ) : null}
          </motion.div>
          {i < steps.length - 1 ? <FlowConnector /> : null}
        </motion.div>
      ))}
    </motion.div>
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
      <motion.div className={className} variants={fadeItem} initial="hidden" animate="show">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live system map
        </p>
        <OrchestrationMapFlow steps={steps} />
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show" className={className}>
      <GlassCard
        title="Live system map"
        description="Operational status and volume across the growth engine"
        headerExtra={
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-200 mission-timeline-dot-pulse">
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
