"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

import { agentWorkspacePath, ROSTER_TO_DEPLOYABLE_AGENT } from "@/lib/agents/agent-workspace-catalog";
import { DEFAULT_LIVE_AGENT_CARDS } from "@/lib/platform/live-agent-cards";
import type { AgentType } from "@/types/domain";
import { cn } from "@/lib/utils";

const DEPLOY_MAP: Partial<Record<string, AgentType>> = {
  landing_page: "landing_page",
  ads: "search_ads",
  lead_management: "lead_qualification",
  email: "ai_follow_up",
  optimization: "search_ads",
  ...ROSTER_TO_DEPLOYABLE_AGENT,
};

const STATUS_STYLE = {
  running: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  active: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  processing: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  inactive: "border-white/10 text-muted-foreground",
} as const;

export function LiveAgentStatusRow({
  activeAgentKeys = [],
}: {
  activeAgentKeys?: string[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Bot className="size-5 text-violet-400" />
        <h2 className="text-sm font-semibold tracking-tight">Live agent activity</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {DEFAULT_LIVE_AGENT_CARDS.map((card) => {
          const deployKey = DEPLOY_MAP[card.id];
          const isLive = deployKey ? activeAgentKeys.includes(deployKey) : false;
          const href = deployKey ? agentWorkspacePath(deployKey) : "/dashboard/agents";
          return (
            <Link
              key={card.id}
              href={href}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:border-violet-500/30"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{card.name}</p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                    isLive ? STATUS_STYLE[card.status] : STATUS_STYLE.inactive,
                  )}
                >
                  {isLive ? card.status : "inactive"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="text-foreground/80">Last: </span>
                {card.lastAction}
              </p>
              <p className="mt-1 text-sm font-semibold text-violet-200">{card.metric}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
