import type { PlanIntelligence, PlanRisk } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

export function formatDeployEta(seconds: number): string {
  const mins = Math.max(1, Math.ceil(seconds / 60));
  return `${mins}m deploy`;
}

export function resolvePlanIntelligence(
  item: PlanIntelligence & { deployPreview?: { estimatedLaunchSeconds?: number } },
): PlanIntelligence {
  const deployEtaSeconds =
    item.deployPreview?.estimatedLaunchSeconds ?? item.deployEtaSeconds;
  return {
    confidence: item.confidence,
    risk: item.risk,
    deployEtaSeconds,
  };
}

const riskStyles: Record<PlanRisk, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-rose-400",
};

export function PlanIntelligenceMeta({
  confidence,
  risk,
  deployEtaSeconds,
  className,
}: PlanIntelligence & { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-[11px] leading-relaxed tracking-wide",
        className,
      )}
    >
      <span>
        <span className="text-muted-foreground">Confidence: </span>
        <span className="font-semibold tabular-nums text-cyan-200/90">{confidence}%</span>
      </span>
      <span>
        <span className="text-muted-foreground">Risk: </span>
        <span className={cn("font-semibold uppercase", riskStyles[risk])}>{risk}</span>
      </span>
      <span>
        <span className="text-muted-foreground">ETA: </span>
        <span className="font-medium text-foreground/90">{formatDeployEta(deployEtaSeconds)}</span>
      </span>
    </div>
  );
}
