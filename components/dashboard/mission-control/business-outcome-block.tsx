import type { BusinessOutcomeProjection } from "@/lib/dashboard/mission-control-types";
import {
  MissionMetricLabel,
  MissionMetricSub,
  MissionMetricValue,
} from "@/components/dashboard/mission-control/mission-metric";
import { cn } from "@/lib/utils";

export function BusinessOutcomeBlock({
  outcome,
  className,
}: {
  outcome: BusinessOutcomeProjection;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-white/[0.02] p-4",
        "grid gap-4 sm:grid-cols-2",
        className,
      )}
    >
      <p className="col-span-full text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/90">
        Projected outcome
      </p>

      <div className="min-w-0 space-y-1">
        <MissionMetricLabel>Lead volume</MissionMetricLabel>
        <MissionMetricValue className="text-base font-semibold text-foreground sm:text-lg">
          {outcome.leadsPerMonth}
        </MissionMetricValue>
      </div>

      <div className="min-w-0 space-y-1 border-t border-white/[0.06] pt-4 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
        <MissionMetricLabel title="Modeled pipeline from projected closes">
          Revenue impact
        </MissionMetricLabel>
        <MissionMetricValue className="text-base font-semibold text-emerald-300/95 sm:text-lg">
          {outcome.pipelineValue}
        </MissionMetricValue>
        <MissionMetricSub className="line-clamp-2">Modeled pipeline — not closed revenue yet</MissionMetricSub>
      </div>
    </div>
  );
}
