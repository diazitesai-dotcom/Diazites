"use client";

import { Bot } from "lucide-react";

import { PLATFORM_AGENT_ROSTER } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

export function PlatformAgentRoster() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Autonomous agent stack
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_AGENT_ROSTER.map((a) => (
          <div
            key={a.key}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5",
              "transition-colors hover:border-violet-500/25",
            )}
          >
            <Bot className="size-4 shrink-0 text-violet-400" />
            <span className="text-sm font-medium">{a.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Future: Agent Marketplace with prebuilt stacks (roofing, law, nonprofit, real estate, ecommerce).
      </p>
    </section>
  );
}
