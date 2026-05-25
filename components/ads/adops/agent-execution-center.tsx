"use client";

import { Bot, Loader2 } from "lucide-react";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { cn } from "@/lib/utils";

export function AgentExecutionCenter() {
  const { payload, setSelectedAgent, search, filter } = useAdops();

  let agents = payload.agents;
  if (search.trim()) {
    const q = search.toLowerCase();
    agents = agents.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.currentTask.toLowerCase().includes(q),
    );
  }
  if (filter === "agents") {
    agents = agents.filter((a) => a.status === "running");
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Agent execution center
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setSelectedAgent(a)}
            className={cn(
              "rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all",
              "hover:border-cyan-500/35 hover:shadow-[0_8px_32px_-12px_rgba(34,211,238,0.25)]",
              a.status === "running" && "ring-1 ring-cyan-500/30",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <Bot className="size-5 text-violet-400" />
              {a.status === "running" ? (
                <Loader2 className="size-4 animate-spin text-cyan-400" />
              ) : null}
            </div>
            <p className="mt-2 font-semibold">{a.label}</p>
            <p
              className={cn(
                "mt-1 text-[10px] font-bold uppercase",
                a.status === "running" ? "text-cyan-300" : "text-muted-foreground",
              )}
            >
              {a.status}
            </p>
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{a.currentTask}</p>
            <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
              {a.status === "running" ? (
                <>
                  Confidence {a.confidence}% · ETA {a.eta ?? "—"}
                </>
              ) : (
                <>Stage {a.stage}</>
              )}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
