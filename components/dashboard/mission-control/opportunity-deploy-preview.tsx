"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Rocket, X } from "lucide-react";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { Button } from "@/components/ui/button";
import type { OpportunityItem } from "@/lib/dashboard/mission-control-types";
import { inferGoalFromHref } from "@/lib/agents/deployment-catalog";

type Props = {
  opportunity: OpportunityItem | null;
  onClose: () => void;
};

export function OpportunityDeployPreview({ opportunity, onClose }: Props) {
  const { openDeployment } = useAgentDeployment();
  const preview = opportunity?.deployPreview;

  function confirmDeploy() {
    if (!opportunity) return;
    onClose();
    if (opportunity.deployPreset === "retargeting") {
      openDeployment({
        preset: "retargeting",
        agent: "retargeting",
        goal: "improve_conversion",
        mode: "autonomous",
        step: "readiness",
        source: "opportunity",
      });
      return;
    }
    openDeployment({
      goal: inferGoalFromHref(opportunity.href),
      source: "opportunity",
    });
  }

  return (
    <>
      <AnimatePresence>
        {opportunity ? (
          <motion.div
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {opportunity && preview ? (
          <motion.aside
            role="dialog"
            aria-label="Deployment preview"
            className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-sm flex-col border-l border-white/10 bg-card/98 shadow-[-16px_0_60px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold">{preview.title}</p>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <dl className="space-y-3 text-sm">
                {preview.audience ? (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Audience</dt>
                    <dd className="mt-0.5 font-medium">{preview.audience}</dd>
                  </div>
                ) : null}
                {preview.budget ? (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</dt>
                    <dd className="mt-0.5 font-medium">{preview.budget}</dd>
                  </div>
                ) : null}
                {preview.followUp ? (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Follow-up</dt>
                    <dd className="mt-0.5 font-medium">{preview.followUp}</dd>
                  </div>
                ) : null}
                {preview.expected ? (
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
                    <dt className="text-[10px] uppercase tracking-wider text-emerald-300/80">Expected</dt>
                    <dd className="mt-0.5 font-semibold text-emerald-200">{preview.expected}</dd>
                  </div>
                ) : null}
              </dl>

              {opportunity.reasoning ? (
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">
                    Why this surfaced
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {opportunity.reasoning}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="border-t border-white/10 p-4">
              <Button
                type="button"
                variant="gradient"
                className="mission-shimmer-btn w-full rounded-xl"
                onClick={confirmDeploy}
              >
                <Rocket className="mr-2 size-4" />
                Deploy
              </Button>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
