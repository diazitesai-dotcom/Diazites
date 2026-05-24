"use client";

import { motion } from "framer-motion";
import { Activity, Cpu, FileText, Megaphone, Rocket, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TimelineEvent, TimelineEventKind } from "@/types/agent-deployment";

const ICONS: Record<TimelineEventKind, typeof Rocket> = {
  deployment: Rocket,
  asset: FileText,
  campaign: Megaphone,
  lead: Users,
  execution: Cpu,
};

export function AgentOrchestrationTimeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  if (events.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Activity className="size-3.5" />
        Deployment timeline
      </div>
      <ol className="relative space-y-0 border-l border-white/10 pl-4">
        {events.map((ev, i) => {
          const Icon = ICONS[ev.kind];
          return (
            <motion.li
              key={ev.id}
              className="relative pb-4 last:pb-0"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="absolute -left-[21px] top-0.5 flex size-3.5 items-center justify-center rounded-full border border-violet-500/40 bg-card">
                <span className="size-1.5 rounded-full bg-violet-400" />
              </span>
              <div className="flex gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-violet-300" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ev.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{ev.detail}</p>
                  <time className="mt-1 block text-[10px] text-muted-foreground/70">
                    {new Date(ev.at).toLocaleString()}
                  </time>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
