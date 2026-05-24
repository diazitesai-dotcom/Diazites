"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Rocket, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GrowthStackPreviewData = {
  title: string;
  included: { label: string; ok: boolean }[];
  budget?: string;
  etaMinutes: number;
  rollbackEnabled: boolean;
  expectedOutcome?: string;
};

type Props = {
  open: boolean;
  preview: GrowthStackPreviewData | null;
  onClose: () => void;
  onDeploy: () => void;
};

export function GrowthStackPreviewModal({ open, preview, onClose, onDeploy }: Props) {
  return (
    <>
      <AnimatePresence>
        {open && preview ? (
          <motion.div
            className="fixed inset-0 z-[58] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open && preview ? (
          <motion.div
            role="dialog"
            aria-label={preview.title}
            className="fixed left-1/2 top-1/2 z-[59] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-card/98 p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{preview.title}</p>
                {preview.expectedOutcome ? (
                  <p className="mt-1 text-sm text-emerald-300/90">{preview.expectedOutcome}</p>
                ) : null}
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Included
              </p>
              <ul className="mt-2 space-y-1.5">
                {preview.included.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-sm">
                    {item.ok ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <span className="size-3.5 text-center text-[10px] text-amber-400">○</span>
                    )}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <dl className="mt-5 grid gap-2 text-sm">
              {preview.budget ? (
                <div className="flex justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd className="font-medium">{preview.budget}</dd>
                </div>
              ) : null}
              <div className="flex justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3.5" />
                  ETA
                </dt>
                <dd className="mission-eta-tick font-medium tabular-nums text-cyan-200">
                  ~{preview.etaMinutes} min
                </dd>
              </div>
              {preview.rollbackEnabled ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Rollback enabled
                </div>
              ) : null}
            </dl>

            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl border-white/10" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                className={cn("mission-shimmer-btn flex-1 rounded-xl")}
                onClick={() => {
                  onDeploy();
                  onClose();
                }}
              >
                <Rocket className="mr-2 size-4" />
                Deploy
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
