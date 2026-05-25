"use client";

import { Bot, ChevronRight } from "lucide-react";

import { useGrowthEngineOs, ENGINE_AGENTS } from "@/components/engine/growth-engine-os/growth-engine-os-provider";
import { AgentDetailDrawer } from "@/components/engine/growth-engine-os/agent-detail-drawer";
import { cn } from "@/lib/utils";

const RISK_COLOR = {
  low: "text-emerald-300",
  medium: "text-amber-300",
  high: "text-rose-300",
} as const;

export function AgentStackSection() {
  const { config, toggleAgent, selectedAgentKey, setSelectedAgentKey } = useGrowthEngineOs();

  return (
    <>
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-violet-950/20 p-6 shadow-lg">
        <div>
          <h2 className="text-lg font-semibold">Configure agent stack</h2>
          <p className="text-sm text-muted-foreground">
            Toggle specialists — each connects to deployment targets and follows your approval policy.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ENGINE_AGENTS.map((agent) => {
            const enabled = config.enabledAgents.includes(agent.key);
            return (
              <button
                key={agent.key}
                type="button"
                onClick={() => setSelectedAgentKey(agent.key)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all hover:ring-2 hover:ring-violet-500/30",
                  enabled ? "border-violet-500/35 bg-violet-500/10" : "border-white/[0.08] bg-white/[0.02] opacity-80",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15">
                    <Bot className="size-4 text-violet-200" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                      enabled ? "border-emerald-500/30 text-emerald-200" : "border-white/15 text-muted-foreground",
                    )}
                  >
                    {enabled ? "On" : "Off"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{agent.label}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{agent.purpose}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {agent.tools.join(" · ")} · ~${agent.estimatedCostUsd.toFixed(2)}/run
                </p>
                <p className={cn("mt-1 text-[10px] font-medium uppercase", RISK_COLOR[agent.riskLevel])}>
                  {agent.riskLevel} risk
                </p>
                <ChevronRight className="mt-2 size-3.5 text-muted-foreground/40" />
              </button>
            );
          })}
        </div>
      </section>
      <AgentDetailDrawer
        agentKey={selectedAgentKey}
        onClose={() => setSelectedAgentKey(null)}
        onToggle={toggleAgent}
        enabled={selectedAgentKey ? config.enabledAgents.includes(selectedAgentKey) : false}
        autonomyMode={config.autonomyMode}
      />
    </>
  );
}
