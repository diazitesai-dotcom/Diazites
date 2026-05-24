"use client";

import { useMemo } from "react";

import { MissionCommandPalette } from "@/components/dashboard/mission-control/command-palette";
import { OrchestrationMap } from "@/components/dashboard/mission-control/orchestration-map";
import { StackHealthBar } from "@/components/dashboard/mission-control/stack-health-bar";
import { SystemModuleProvider } from "@/components/dashboard/mission-control/system-module-provider";
import { SystemModuleDrawer } from "@/components/dashboard/mission-control/system-module-drawer";
import { SystemReplayBar } from "@/components/dashboard/mission-control/system-replay-bar";
import type { OrchestrationFlowStep } from "@/lib/dashboard/build-orchestration-flow";
import type { StackHealthItem } from "@/lib/dashboard/mission-control-types";
import type { SystemModuleContext } from "@/lib/dashboard/system-module-types";

function LiveTimestamp() {
  const now = new Date();
  const label = now.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-cyan-200 mission-timeline-dot-pulse">
      Live · {label}
    </span>
  );
}

export function RuntimeOverview({
  flow,
  stackHealth,
  moduleContext,
}: {
  flow: OrchestrationFlowStep[];
  stackHealth: StackHealthItem[];
  moduleContext: SystemModuleContext;
}) {
  const context = useMemo(() => moduleContext, [moduleContext]);

  return (
    <SystemModuleProvider context={context}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Live system map</h2>
            <p className="text-sm text-muted-foreground">
              Interactive AI operations graph — click any node for the System Inspector.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LiveTimestamp />
            <kbd className="hidden rounded border border-white/10 px-2 py-1 text-[10px] text-muted-foreground sm:inline">
              ⌘K commands
            </kbd>
          </div>
        </div>

        <SystemReplayBar />

        <OrchestrationMap flow={flow} />

        {stackHealth.length > 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 p-4 shadow-lg backdrop-blur-sm">
            <StackHealthBar items={stackHealth} />
          </div>
        ) : null}
      </section>
      <SystemModuleDrawer />
      <MissionCommandPalette />
    </SystemModuleProvider>
  );
}
