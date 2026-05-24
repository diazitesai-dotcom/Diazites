"use client";

import { motion } from "framer-motion";

import { OrchestrationMap } from "@/components/dashboard/mission-control/orchestration-map";
import { StackHealthBar } from "@/components/dashboard/mission-control/stack-health-bar";
import type { OrchestrationFlowStep } from "@/lib/dashboard/build-orchestration-flow";
import type { StackHealthItem } from "@/lib/dashboard/mission-control-types";
import { fadeItem } from "@/lib/motion";

export function RuntimeOverview({
  flow,
  stackHealth,
}: {
  flow: OrchestrationFlowStep[];
  stackHealth: StackHealthItem[];
}) {
  return (
    <motion.section variants={fadeItem} initial="hidden" animate="show" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Live system map — operational status, throughput, and conversion across the engine.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <OrchestrationMap flow={flow} />
        {stackHealth.length > 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 p-4 shadow-lg backdrop-blur-sm">
            <StackHealthBar items={stackHealth} />
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
