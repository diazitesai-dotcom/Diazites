"use client";

import { motion } from "framer-motion";
import { Layers, Rocket } from "lucide-react";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { Button } from "@/components/ui/button";
import { AGENT_STACKS } from "@/types/agent-deployment";
import { fadeItem } from "@/lib/motion";

const STACK_COPY: Record<(typeof AGENT_STACKS)[number]["id"], string[]> = {
  lead_engine: ["Landing", "Qualification", "Follow-Up", "CRM routing"],
  paid_ads: ["Meta", "Search", "Retargeting", "Analytics"],
  growth_engine: ["Full funnel", "All agents", "Optimization loop", "One-click launch"],
};

export function DeployableStacksPanel() {
  const { openDeployment } = useAgentDeployment();

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Deployable stacks"
        description="Primary onboarding — deploy a full agent stack in one flow"
        headerExtra={<Layers className="size-4 text-violet-300" />}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {AGENT_STACKS.map((stack) => (
            <div
              key={stack.id}
              className="mission-elevate flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <p className="text-sm font-semibold">{stack.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stack.description}</p>
              <ul className="mt-3 flex-1 space-y-1">
                {STACK_COPY[stack.id].map((item) => (
                  <li key={item} className="text-[11px] text-muted-foreground">
                    · {item}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] font-medium text-emerald-300/90">{stack.uplift}</p>
              <Button
                type="button"
                variant="gradient"
                size="sm"
                className="mission-shimmer-btn mt-3 w-full rounded-xl"
                onClick={() =>
                  openDeployment({
                    stack: stack.id,
                    goal:
                      stack.id === "growth_engine"
                        ? "deploy_full_growth_engine"
                        : stack.id === "paid_ads"
                          ? "launch_ads"
                          : "generate_leads",
                    source: "quick_action",
                  })
                }
              >
                <Rocket className="mr-1.5 size-3.5" />
                Deploy
              </Button>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
