import type { BusinessOutcomeProjection } from "@/lib/dashboard/mission-control-types";

export function BusinessOutcomeBlock({
  outcome,
  className,
}: {
  outcome: BusinessOutcomeProjection;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Projected
      </p>
      <ul className="mt-1.5 space-y-1 text-sm">
        <li className="font-medium text-emerald-300/95">{outcome.leadsPerMonth}</li>
        <li className="font-medium text-cyan-200/90">{outcome.pipelineValue}</li>
      </ul>
    </div>
  );
}
