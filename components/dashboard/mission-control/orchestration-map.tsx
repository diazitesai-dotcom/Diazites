"use client";

import { motion } from "framer-motion";
import { ArrowDown, GitBranch } from "lucide-react";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { fadeItem } from "@/lib/motion";

const DEFAULT_FLOW = [
  { id: "traffic", label: "Traffic", sub: "Paid + organic" },
  { id: "landing", label: "Landing Agent", sub: "Convert visitors" },
  { id: "qualify", label: "Lead Qualification", sub: "Score & route" },
  { id: "followup", label: "Follow-Up Agent", sub: "Nurture pipeline" },
  { id: "crm", label: "CRM", sub: "Pipeline sync" },
  { id: "optimize", label: "Optimization Loop", sub: "AI tuning" },
];

function OrchestrationMapFlow() {
  return (
    <div className="flex flex-col items-center gap-0">
      {DEFAULT_FLOW.map((node, i) => (
        <div key={node.id} className="flex w-full max-w-xs flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="w-full rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-transparent px-4 py-3 text-center"
          >
            <p className="text-sm font-semibold">{node.label}</p>
            <p className="text-[10px] text-muted-foreground">{node.sub}</p>
          </motion.div>
          {i < DEFAULT_FLOW.length - 1 ? (
            <ArrowDown className="my-1 size-4 text-violet-400/70" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function OrchestrationMap({
  className,
  embedded = false,
}: {
  className?: string;
  embedded?: boolean;
}) {
  if (embedded) {
    return (
      <div className={className}>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Orchestration map
        </p>
        <OrchestrationMapFlow />
      </div>
    );
  }

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show" className={className}>
      <GlassCard
        title="Orchestration map"
        description="How agents chain together in your growth engine"
        headerExtra={<GitBranch className="size-4 text-violet-300" />}
      >
        <OrchestrationMapFlow />
      </GlassCard>
    </motion.div>
  );
}
