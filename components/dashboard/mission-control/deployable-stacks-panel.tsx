"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Layers, Rocket } from "lucide-react";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { GrowthStackPreviewModal, type GrowthStackPreviewData } from "@/components/agents/growth-stack-preview-modal";
import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { OrchestrationMap } from "@/components/dashboard/mission-control/orchestration-map";
import { Button } from "@/components/ui/button";
import {
  HEALTH_BADGE,
  buildDeployableStacks,
  componentIcon,
  type DeployableStackDefinition,
} from "@/lib/agents/stack-deployment-catalog";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

function stackPreviewFromDefinition(stack: DeployableStackDefinition): GrowthStackPreviewData {
  return {
    title: `${stack.label} Stack Preview`,
    included: stack.components.map((c) => ({
      label: c.label,
      ok: c.status === "ok",
    })),
    budget: stack.id === "paid_ads" ? "$5–25/day" : undefined,
    etaMinutes: stack.setupMinutes,
    rollbackEnabled: true,
    expectedOutcome: `Expected: ${stack.expectedOutcome}`,
  };
}

export function DeployableStacksPanel() {
  const { openDeployment, agents } = useAgentDeployment();
  const stacks = useMemo(() => buildDeployableStacks(agents), [agents]);
  const [preview, setPreview] = useState<GrowthStackPreviewData | null>(null);
  const [previewLaunch, setPreviewLaunch] = useState<DeployableStackDefinition | null>(null);

  function deployStack(stack: DeployableStackDefinition) {
    openDeployment({
      ...stack.launch,
      source: "quick_action",
      step: "readiness",
    });
  }

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Deployable stacks"
        description="Stack health, components, and one-click onboarding"
        headerExtra={<Layers className="size-4 text-violet-300" />}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {stacks.map((stack) => {
            const health = HEALTH_BADGE[stack.healthLabel];
            return (
              <div
                key={stack.id}
                className="mission-stack-card mission-elevate flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{stack.label}</p>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                      health.className,
                    )}
                  >
                    {health.label}
                  </span>
                </div>

                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Components
                </p>
                <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  {stack.components.map((c) => (
                    <li key={c.id}>
                      <span
                        className={cn(
                          c.status === "ok" && "text-emerald-300/90",
                          c.status === "warn" && "text-amber-300/90",
                          c.status === "missing" && "text-muted-foreground",
                        )}
                      >
                        {componentIcon(c.status)} {c.label}
                        {c.agentType && c.status === "missing" ? " missing" : ""}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">Expected</p>
                <p className="text-xs font-medium text-emerald-300/90">{stack.expectedOutcome}</p>

                <p className="mt-2 text-[10px] text-muted-foreground">
                  <span className="uppercase tracking-wide">Setup · </span>
                  <span className="mission-eta-tick font-medium text-foreground/80">
                    {stack.setupMinutes} min
                  </span>
                </p>

                <div className="mt-auto flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg border-white/10 text-xs"
                    onClick={() => {
                      setPreviewLaunch(stack);
                      setPreview(stackPreviewFromDefinition(stack));
                    }}
                  >
                    <Eye className="mr-1 size-3" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="gradient"
                    size="sm"
                    className="mission-shimmer-btn flex-1 rounded-lg text-xs"
                    onClick={() => deployStack(stack)}
                  >
                    <Rocket className="mr-1 size-3" />
                    Deploy Stack
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <OrchestrationMap embedded />
        </div>
      </GlassCard>

      <GrowthStackPreviewModal
        open={!!preview}
        preview={preview}
        onClose={() => {
          setPreview(null);
          setPreviewLaunch(null);
        }}
        onDeploy={() => {
          if (previewLaunch) deployStack(previewLaunch);
        }}
      />
    </motion.div>
  );
}
