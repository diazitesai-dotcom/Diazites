"use client";

import { ChevronRight } from "lucide-react";

import { useGrowthEngineOs } from "@/components/engine/growth-engine-os/growth-engine-os-provider";
import { PipelineStageDrawer } from "@/components/engine/growth-engine-os/pipeline-stage-drawer";
import { buildPipelineStages } from "@/lib/engine/build-pipeline-stages";
import type { PipelineStageView } from "@/lib/engine/growth-engine-os-types";
import type { EngineRunRow } from "@/repositories/engine.repository";
import { cn } from "@/lib/utils";

const STATUS_BORDER: Record<PipelineStageView["status"], string> = {
  not_started: "border-white/10 hover:border-white/20",
  running: "border-amber-500/40 bg-amber-500/5 shadow-[0_0_24px_-10px_rgba(245,158,11,0.35)]",
  complete: "border-emerald-500/35 bg-emerald-500/5",
  failed: "border-rose-500/40 bg-rose-500/8 animate-pulse",
  needs_approval: "border-violet-500/40 bg-violet-500/8",
};

const STATUS_LABEL: Record<PipelineStageView["status"], string> = {
  not_started: "Not started",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
  needs_approval: "Needs approval",
};

export function PipelineWorkflow({ run }: { run: EngineRunRow | null }) {
  const { selectedStage, setSelectedStage } = useGrowthEngineOs();
  const stages = buildPipelineStages(run);

  return (
    <>
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">8-stage pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Click any stage for findings, assets, logs, and AI reasoning.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => (
            <button
              key={stage.step}
              type="button"
              onClick={() => setSelectedStage(stage)}
              className={cn(
                "group rounded-xl border px-4 py-3 text-left transition-all",
                "hover:ring-2 hover:ring-cyan-500/30 hover:shadow-[0_8px_32px_-12px_rgba(34,211,238,0.25)]",
                STATUS_BORDER[stage.status],
                selectedStage?.step === stage.step && "ring-2 ring-violet-400/50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-xs font-bold text-violet-200">
                  {stage.index}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                  {STATUS_LABEL[stage.status]}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold group-hover:text-cyan-100">{stage.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{stage.outputPreview}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] tabular-nums text-muted-foreground">
                <span>{stage.duration ?? "—"}</span>
                <span>{stage.confidence != null ? `${stage.confidence}%` : "—"} conf.</span>
              </div>
              <ChevronRight className="mt-2 size-3.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </section>
      <PipelineStageDrawer stage={selectedStage} onClose={() => setSelectedStage(null)} />
    </>
  );
}
