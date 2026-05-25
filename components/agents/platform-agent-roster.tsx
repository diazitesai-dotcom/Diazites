"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

import {
  agentWorkspacePath,
  ROSTER_TO_DEPLOYABLE_AGENT,
} from "@/lib/agents/agent-workspace-catalog";
import { PLATFORM_AGENT_ROSTER } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

export function PlatformAgentRoster() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Autonomous agent stack
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_AGENT_ROSTER.map((a) => {
          const deployable = ROSTER_TO_DEPLOYABLE_AGENT[a.key];
          const href = deployable ? agentWorkspacePath(deployable) : "/dashboard/agents";
          return (
            <Link
              key={a.key}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5",
                "transition-colors hover:border-violet-500/25 hover:bg-violet-500/5",
              )}
            >
              <Bot className="size-4 shrink-0 text-violet-400" />
              <span className="text-sm font-medium">{a.label}</span>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Mapped agents open a full workspace (queue, logs, reasoning, approvals). Deploy stacks from
        the roster below.
      </p>
    </section>
  );
}
