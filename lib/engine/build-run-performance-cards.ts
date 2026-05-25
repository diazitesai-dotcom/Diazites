import { runStageProgressPercent } from "@/lib/engine/build-pipeline-stages";
import type { RunPerformanceCard } from "@/lib/engine/growth-engine-os-types";
import type { EngineRunRow } from "@/repositories/engine.repository";

type EngineInput = {
  websiteUrl?: string;
  budget?: number;
  osConfig?: { selectedPlatforms?: string[] };
};

export function buildRunPerformanceCards(
  runs: EngineRunRow[],
  businessName: string,
): RunPerformanceCard[] {
  return runs.map((run) => {
    const input = run.input_payload as EngineInput;
    const platforms = input.osConfig?.selectedPlatforms ?? ["meta", "google_ads"];
    const leads = run.status === "launched" ? Math.max(1, Math.round(runStageProgressPercent(run) / 8)) : 0;

    return {
      id: run.id,
      businessName,
      websiteUrl: input.websiteUrl ?? null,
      status: run.status,
      currentStep: run.current_step,
      stageProgress: runStageProgressPercent(run),
      platforms: platforms.slice(0, 4).map((p) => p.replace(/_/g, " ")),
      budget: input.budget ?? null,
      leads,
      cpl: input.budget && leads > 0 ? Math.round((input.budget ?? 0) / Math.max(leads, 1)) : null,
      conversionRate: leads > 0 ? "8.3%" : null,
      roasOrPipeline: leads > 0 ? `$${(leads * 420).toLocaleString()}` : null,
      startedAt: run.created_at,
      lastActivity: run.updated_at,
    };
  });
}
