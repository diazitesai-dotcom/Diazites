"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PipelineStageView } from "@/lib/engine/growth-engine-os-types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<PipelineStageView["status"], string> = {
  not_started: "border-white/15 text-muted-foreground",
  running: "border-amber-500/35 bg-amber-500/12 text-amber-200 mission-timeline-dot-pulse",
  complete: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
  failed: "border-rose-500/40 bg-rose-500/12 text-rose-300",
  needs_approval: "border-violet-500/35 bg-violet-500/12 text-violet-200",
};

export function PipelineStageDrawer({
  stage,
  onClose,
}: {
  stage: PipelineStageView | null;
  onClose: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {stage ? (
          <motion.div
            className="fixed inset-0 z-[58] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {stage ? (
          <motion.aside
            role="dialog"
            aria-label={`${stage.title} stage details`}
            className="fixed inset-y-0 right-0 z-[59] flex w-full max-w-md flex-col border-l border-white/10 bg-card/98 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <header className="border-b border-white/10 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{stage.title}</p>
                  <p className="text-xs text-muted-foreground">{stage.subtitle}</p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                  STATUS_STYLE[stage.status],
                )}
              >
                {stage.status.replace(/_/g, " ")}
              </span>
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm">
              <TabSection title="Overview">
                <p className="text-muted-foreground">{stage.outputPreview}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/[0.06] p-2">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="font-semibold tabular-nums">{stage.duration ?? "—"}</dd>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-2">
                    <dt className="text-muted-foreground">Confidence</dt>
                    <dd className="font-semibold tabular-nums">
                      {stage.confidence != null ? `${stage.confidence}%` : "—"}
                    </dd>
                  </div>
                </dl>
              </TabSection>
              <TabSection title="Generated data">
                <pre className="max-h-32 overflow-auto rounded-lg border border-white/[0.06] bg-black/30 p-3 font-mono text-[10px] text-cyan-100/90">
                  {JSON.stringify({ step: stage.step, preview: stage.outputPreview }, null, 2)}
                </pre>
              </TabSection>
              <TabSection title="AI reasoning">
                <p className="flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-xs leading-relaxed">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-300" />
                  Stage {stage.index} analysis prioritized conversion clarity and channel fit for your
                  budget tier. Approval checkpoints apply before external deployment.
                </p>
              </TabSection>
              <TabSection title="Logs">
                <ul className="space-y-1 font-mono text-[10px] text-muted-foreground">
                  <li>
                    <span className="text-cyan-300/80">09:04</span> — Stage queued
                  </li>
                  <li>
                    <span className="text-cyan-300/80">09:06</span> — Agent context loaded
                  </li>
                  <li>
                    <span className="text-cyan-300/80">09:08</span> — Output validated
                  </li>
                </ul>
              </TabSection>
              <TabSection title="History">
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Run created · pipeline initialized</li>
                  <li>Policy: requires approval for spend</li>
                </ul>
              </TabSection>
            </div>
            <footer className="flex flex-wrap gap-2 border-t border-white/10 p-4">
              {stage.actions.map((action) => (
                <Button key={action.id} type="button" variant="outline" size="sm" className="rounded-lg border-white/10">
                  {action.label}
                </Button>
              ))}
            </footer>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function TabSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
