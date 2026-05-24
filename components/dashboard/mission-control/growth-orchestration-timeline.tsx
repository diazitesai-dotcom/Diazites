"use client";

import { motion } from "framer-motion";
import { Activity, Cpu, FileText, Megaphone, Rocket, Users } from "lucide-react";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import type { OrchestrationTimelineEvent } from "@/lib/dashboard/mission-control-types";
import { fadeItem } from "@/lib/motion";

const ICONS = {
  asset: FileText,
  campaign: Megaphone,
  lead: Users,
  execution: Cpu,
  deployment: Rocket,
} as const;

export function GrowthOrchestrationTimeline({
  events,
}: {
  events: OrchestrationTimelineEvent[];
}) {
  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Growth Engine Timeline"
        description="AI operations execution history"
        headerExtra={
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-200">
            <Activity className="size-3" />
            Live
          </span>
        }
      >
        <ol className="relative border-l border-white/10 pl-4">
          {events.map((ev, i) => {
            const Icon = ICONS[ev.kind];
            return (
              <motion.li
                key={ev.id}
                className="relative pb-4 last:pb-0"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="absolute -left-[21px] top-1 flex size-3.5 items-center justify-center rounded-full border border-violet-500/40 bg-card">
                  <span className="size-1.5 rounded-full bg-violet-400" />
                </span>
                <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-violet-500/20">
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-violet-300" />
                  <div>
                    <span className="text-[10px] tabular-nums text-cyan-300/80">{ev.time}</span>
                    <p className="text-sm font-medium">{ev.label}</p>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </GlassCard>
    </motion.div>
  );
}
