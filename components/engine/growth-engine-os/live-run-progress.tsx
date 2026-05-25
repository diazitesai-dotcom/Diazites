"use client";

import Link from "next/link";
import { Pause, Sparkles, Square, XCircle } from "lucide-react";

import { AdvanceRunButton } from "@/components/engine/advance-run-button";
import { RunFullEngineButton } from "@/components/engine/run-full-engine-button";
import { buildPipelineStages, runStageProgressPercent } from "@/lib/engine/build-pipeline-stages";
import { labelForEngineStep } from "@/lib/engine-steps";
import { isLaunchReadyStep } from "@/lib/engine-steps";
import type { EngineRunRow } from "@/repositories/engine.repository";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROGRESS_LABELS: Record<string, string> = {
  research: "Research",
  strategy: "Strategy",
  funnel: "Funnel",
  generation: "Creative",
  variants: "Variants",
  scoring: "Scoring",
  launch: "Launch",
};

function stagePercent(run: EngineRunRow, stepKey: string): number {
  const stages = buildPipelineStages(run);
  const stage = stages.find((s) => s.step === stepKey);
  if (!stage) return 0;
  if (stage.status === "complete") return 100;
  if (stage.status === "running" || stage.status === "needs_approval") return 65;
  if (stage.status === "failed") return 100;
  return 0;
}

export function LiveRunProgress({
  run,
  businessName,
}: {
  run: EngineRunRow;
  businessName: string;
}) {
  const overall = runStageProgressPercent(run);
  const bars = ["research", "strategy", "funnel", "generation"] as const;

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/25 to-card/80 p-6 shadow-[0_8px_40px_-16px_rgba(34,211,238,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90">Live run</p>
          <h2 className="text-xl font-semibold">{businessName}</h2>
          <p className="text-sm text-muted-foreground">
            {labelForEngineStep(run.current_step)} · {overall}% complete · ETA ~12m
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/engine/${run.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg border-white/10")}
          >
            Open workspace
          </Link>
          {run.status === "running" ? <RunFullEngineButton runId={run.id} /> : null}
          <AdvanceRunButton runId={run.id} launchReady={isLaunchReadyStep(run.current_step)} />
          <Button type="button" variant="ghost" size="sm" className="rounded-lg" disabled>
            <Pause className="mr-1 size-3.5" />
            Pause
          </Button>
          <Button type="button" variant="ghost" size="sm" className="rounded-lg text-rose-300" disabled>
            <Square className="mr-1 size-3.5" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500"
          style={{ width: `${overall}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bars.map((key) => {
          const pct = stagePercent(run, key);
          return (
            <div key={key}>
              <div className="flex justify-between text-xs">
                <span>{PROGRESS_LABELS[key]}</span>
                <span className="tabular-nums text-cyan-300">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-500/70" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {run.status === "needs_approval" ? (
        <div className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm">
          <XCircle className="size-4 text-violet-300" />
          Approval checkpoint — review stage output before continuing.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/[0.06] bg-black/25 p-3 font-mono text-[10px]">
          <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Live logs</p>
          <p className="text-cyan-200/90">09:12 — {labelForEngineStep(run.current_step)} executing</p>
          <p className="text-muted-foreground">09:10 — Guardrails: daily cap active</p>
          <p className="text-muted-foreground">09:08 — Agent stack synchronized</p>
        </div>
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-xs leading-relaxed">
          <p className="flex items-center gap-1 font-semibold text-violet-200">
            <Sparkles className="size-3.5" />
            AI reasoning
          </p>
          <p className="mt-2 text-muted-foreground">
            Prioritizing high-intent funnel path with retargeting-ready pixel setup. Budget held until
            tracking validation completes.
          </p>
        </div>
      </div>
    </section>
  );
}
