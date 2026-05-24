import type { LucideIcon } from "lucide-react";

import { OrchestrationStatusBadge } from "@/components/dashboard/mission-control/orchestration-status-badge";
import { cn } from "@/lib/utils";
import type { OrchestrationRunStatus } from "@/lib/dashboard/orchestration-status";

export type OrchestrationTimelineRowData = {
  time: string;
  label: string;
  status: OrchestrationRunStatus;
  durationSeconds?: number;
  system?: string;
  rollbackStatus?: "available" | "unavailable" | "used";
};

export function OrchestrationTimelineRow({
  icon: Icon,
  row,
  className,
}: {
  icon: LucideIcon;
  row: OrchestrationTimelineRowData;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2",
        className,
      )}
    >
      <Icon className="mt-0.5 size-3 shrink-0 text-violet-300" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] tabular-nums text-cyan-300/80">{row.time}</span>
          <OrchestrationStatusBadge status={row.status} />
        </div>
        <p
          className={cn(
            "text-xs font-medium",
            row.status === "running" && "mission-timeline-pulse",
          )}
        >
          {row.label}
        </p>
        {row.durationSeconds != null || row.system || row.rollbackStatus ? (
          <dl className="mt-1 grid gap-0.5 text-[10px] text-muted-foreground">
            {row.durationSeconds != null ? (
              <div className="flex gap-1">
                <dt className="uppercase tracking-wide">Duration</dt>
                <dd className="font-medium text-foreground/80">{row.durationSeconds}s</dd>
              </div>
            ) : null}
            {row.system ? (
              <div className="flex gap-1">
                <dt className="uppercase tracking-wide">System</dt>
                <dd className="font-medium text-foreground/80">{row.system}</dd>
              </div>
            ) : null}
            {row.rollbackStatus ? (
              <div className="flex gap-1">
                <dt className="uppercase tracking-wide">Rollback</dt>
                <dd
                  className={cn(
                    "font-medium capitalize",
                    row.rollbackStatus === "available" && "text-emerald-300/90",
                    row.rollbackStatus === "used" && "text-amber-300/90",
                  )}
                >
                  {row.rollbackStatus}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </div>
  );
}
