"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import { OrchestrationStatusBadge } from "@/components/dashboard/mission-control/orchestration-status-badge";
import type { OrchestrationTimelineDetail } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";
import type { OrchestrationRunStatus } from "@/lib/dashboard/orchestration-status";

export type OrchestrationTimelineRowData = {
  time: string;
  label: string;
  status: OrchestrationRunStatus;
  durationSeconds?: number;
  system?: string;
  rollbackStatus?: "available" | "unavailable" | "used";
  details?: OrchestrationTimelineDetail[];
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
  const [expanded, setExpanded] = useState(false);
  const hasDetails = (row.details?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2",
        hasDetails && "cursor-pointer transition-colors hover:border-violet-500/25 hover:bg-white/[0.04]",
        className,
      )}
      {...(hasDetails
        ? {
            role: "button",
            tabIndex: 0,
            onClick: () => setExpanded((v) => !v),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded((v) => !v);
              }
            },
          }
        : {})}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-3 shrink-0 text-violet-300" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] tabular-nums text-cyan-300/80">{row.time}</span>
            <OrchestrationStatusBadge status={row.status} />
            {hasDetails ? (
              <ChevronDown
                className={cn(
                  "ml-auto size-3.5 text-muted-foreground transition-transform",
                  expanded && "rotate-180",
                )}
              />
            ) : null}
          </div>
          <p
            className={cn(
              "text-xs font-medium",
              row.status === "running" && "mission-timeline-pulse",
            )}
          >
            {row.label}
          </p>
          {!expanded && (row.durationSeconds != null || row.system) ? (
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
            </dl>
          ) : null}
          {expanded && row.details?.length ? (
            <dl className="mt-2 grid gap-1 rounded-md border border-white/[0.06] bg-black/20 p-2 text-[10px]">
              {row.details.map((d) => (
                <div key={d.label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{d.label}</dt>
                  <dd className="font-medium text-foreground/90">{d.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}
