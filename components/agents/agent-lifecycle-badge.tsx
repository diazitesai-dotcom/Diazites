"use client";

import { cn } from "@/lib/utils";
import type { AgentLifecycleState } from "@/types/agent-deployment";

const STYLES: Record<AgentLifecycleState, string> = {
  draft: "border-white/15 bg-white/[0.04] text-muted-foreground",
  configuring: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  ready: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  deploying: "border-violet-500/40 bg-violet-500/15 text-violet-200 mission-shimmer-btn",
  live: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200 agent-active-glow",
  learning: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  error: "border-red-500/35 bg-red-500/10 text-red-300",
};

const LABELS: Record<AgentLifecycleState, string> = {
  draft: "Draft",
  configuring: "Configuring",
  ready: "Ready",
  deploying: "Deploying",
  live: "Live",
  learning: "Learning",
  error: "Error",
};

export function AgentLifecycleBadge({
  state,
  className,
}: {
  state: AgentLifecycleState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        STYLES[state],
        className,
      )}
    >
      {state === "deploying" ? (
        <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-violet-400" />
      ) : null}
      {LABELS[state]}
    </span>
  );
}
