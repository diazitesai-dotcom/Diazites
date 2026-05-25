import { ENGINE_STEPS } from "@/lib/engine-steps";
import type { PipelineStageStatus, PipelineStageView } from "@/lib/engine/growth-engine-os-types";
import { STAGE_ACTIONS } from "@/lib/engine/growth-engine-os-catalog";
import type { EngineRunRow, EngineStep } from "@/repositories/engine.repository";
import { stepIndex } from "@/lib/engine-steps";

function previewForStep(run: EngineRunRow | null, step: EngineStep): string {
  if (!run) return "Awaiting run start — configure stack and launch.";
  switch (step) {
    case "input":
      return "Business context captured.";
    case "research":
      return run.research_payload ? "Competitors, pain points, and hooks ready." : "Pending research.";
    case "strategy":
      return run.strategy_payload ? "Positioning, offer, and traffic plan ready." : "Pending strategy.";
    case "funnel":
      return run.funnel_payload ? "Funnel nodes and capture flow mapped." : "Pending funnel.";
    case "generation":
      return run.generation_payload ? "Creative suite plan generated." : "Pending generation.";
    case "variants":
      return run.variants_payload ? "A/B/C/D variants across assets." : "Pending variants.";
    case "scoring":
      return run.scoring_payload ? "Winner selected with confidence scores." : "Pending scoring.";
    case "launch":
      return run.launched_at ? "Live with tracking." : run.launch_payload ? "Ready to publish." : "Pending launch.";
    default:
      return "Pending prior stages.";
  }
}

function statusForStep(
  run: EngineRunRow | null,
  step: EngineStep,
): PipelineStageStatus {
  if (!run) return "not_started";
  const idx = stepIndex(step);
  const currentIdx = stepIndex(run.current_step);
  if (run.status === "failed" && idx >= currentIdx) return "failed";
  if (run.status === "needs_approval" && idx === currentIdx) return "needs_approval";
  if (run.status === "launched" || idx < currentIdx) return "complete";
  if (idx === currentIdx && run.status === "running") return "running";
  if (idx === currentIdx) return "running";
  return "not_started";
}

function durationFor(status: PipelineStageStatus): string | null {
  if (status === "not_started") return null;
  if (status === "running") return "~2m remaining";
  return "1m 24s";
}

function confidenceFor(status: PipelineStageStatus, idx: number): number | null {
  if (status === "not_started") return null;
  if (status === "running") return 62 + idx * 4;
  if (status === "needs_approval") return 78;
  if (status === "failed") return 41;
  return 88 + (idx % 3) * 3;
}

export function buildPipelineStages(run: EngineRunRow | null): PipelineStageView[] {
  return ENGINE_STEPS.map((stage) => {
    const status = statusForStep(run, stage.key);
    return {
      step: stage.key,
      index: stage.index,
      title: stage.title,
      subtitle: stage.subtitle,
      status,
      duration: durationFor(status),
      confidence: confidenceFor(status, stage.index),
      outputPreview: previewForStep(run, stage.key),
      actions: STAGE_ACTIONS.map((a) => ({ id: a.id, label: a.label })),
    };
  });
}

export function runStageProgressPercent(run: EngineRunRow): number {
  const idx = stepIndex(run.current_step);
  const base = ((idx + (run.status === "launched" ? 1 : 0.5)) / ENGINE_STEPS.length) * 100;
  return Math.min(100, Math.round(base));
}
