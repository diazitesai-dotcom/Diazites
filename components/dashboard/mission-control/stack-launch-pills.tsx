"use client";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { cn } from "@/lib/utils";
import type { DeploymentLaunchParams } from "@/types/agent-deployment";

const STACK_PILLS: {
  label: string;
  launch: DeploymentLaunchParams;
}[] = [
  {
    label: "Lead Stack",
    launch: { stack: "lead_engine", goal: "generate_leads", source: "quick_action" },
  },
  {
    label: "Ads Stack",
    launch: { stack: "paid_ads", goal: "launch_ads", source: "quick_action" },
  },
  {
    label: "Landing Stack",
    launch: { goal: "build_landing_page", source: "quick_action" },
  },
];

export function StackLaunchPills({ className }: { className?: string }) {
  const { openDeployment } = useAgentDeployment();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {STACK_PILLS.map((pill) => (
        <button
          key={pill.label}
          type="button"
          onClick={() => openDeployment(pill.launch)}
          className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-100"
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}
