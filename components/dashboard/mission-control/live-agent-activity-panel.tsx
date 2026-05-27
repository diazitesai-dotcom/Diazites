"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

function statusLabel(status: string) {
  if (status === "active") return { text: "Running", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" };
  return { text: "Idle", className: "border-white/10 text-muted-foreground" };
}

export function LiveAgentActivityPanel({ data }: { data: DashboardOverviewData }) {
  const agents = data.agentPerformance;

  return (
    <motion.section variants={fadeItem} initial="hidden" animate="show" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-violet-400" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Live agent activity</h2>
            <p className="text-xs text-muted-foreground">Status, current task, and last impact</p>
          </div>
        </div>
        <Link href="/dashboard/agents" className="text-xs font-medium text-violet-300 hover:text-violet-200">
          All agents →
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => {
          const badge = statusLabel(agent.status);
          return (
            <Link
              key={agent.key}
              href={agent.href}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:border-violet-500/25 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{agent.name}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                    badge.className,
                  )}
                >
                  {badge.text}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="text-foreground/80">Now: </span>
                {agent.currentTask}
              </p>
              <p className="mt-1 text-sm font-semibold text-violet-200/90">{agent.resultMetric}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Last: {agent.lastActivity}
              </p>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
