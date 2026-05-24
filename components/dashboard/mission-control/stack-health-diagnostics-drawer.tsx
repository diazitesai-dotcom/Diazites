"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Sparkles, Wrench, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StackHealthItem } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

const TRACKING_COPY: Record<string, { problem: string; detected: string; recommendation: string; eventLoss?: string }> = {
  tracking: {
    problem: "Meta Pixel missing · GA4 disconnected",
    detected: "3:12 PM",
    recommendation: "Reconnect tracking — event loss estimated at 27%",
    eventLoss: "27%",
  },
  paid: {
    problem: "Paid ads account not fully connected",
    detected: "Live",
    recommendation: "Connect Meta or Google Ads — estimated 18–32% more leads on table",
  },
  landing: {
    problem: "Landing stack agents not fully active",
    detected: "Live",
    recommendation: "Activate Landing + Qualification agents",
  },
  optimization: {
    problem: "Optimization loop idle",
    detected: "Live",
    recommendation: "Enable retargeting or paid agents to start tuning",
  },
};

export function StackHealthDiagnosticsDrawer({
  item,
  onClose,
}: {
  item: StackHealthItem | null;
  onClose: () => void;
}) {
  const copy = item ? TRACKING_COPY[item.id] : null;

  return (
    <AnimatePresence>
      {item && copy ? (
        <>
          <motion.div
            className="fixed inset-0 z-[57] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[58] flex w-full max-w-md flex-col border-l border-white/10 bg-card/98 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <header className="border-b border-white/10 px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{item.label} diagnostics</p>
                  <p className={cn("text-xs font-bold uppercase", item.status === "degraded" ? "text-rose-300" : "text-amber-300")}>
                    {item.status}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
              <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-3">
                <p className="text-[10px] font-semibold uppercase text-rose-200">Problem</p>
                <p className="mt-1">{copy.problem}</p>
              </div>
              {copy.eventLoss ? (
                <p className="text-xs text-amber-300">Event loss: {copy.eventLoss}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">Detected: {copy.detected}</p>
              <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 p-3">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-violet-200">
                  <Sparkles className="size-3" />
                  AI recommendation
                </p>
                <p className="mt-1 text-xs">{copy.recommendation}</p>
              </div>
            </div>
            <footer className="flex flex-wrap gap-2 border-t border-white/10 p-4">
              <Button type="button" variant="gradient" size="sm" className="rounded-lg">
                <Wrench className="mr-1 size-3.5" />
                Fix automatically
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-lg border-white/10">
                Manual setup
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-lg">
                View logs
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-lg">
                <RotateCcw className="mr-1 size-3.5" />
                Rollback
              </Button>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
