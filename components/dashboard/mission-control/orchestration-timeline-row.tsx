"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Sparkles } from "lucide-react";

import { OrchestrationStatusBadge } from "@/components/dashboard/mission-control/orchestration-status-badge";
import { Button } from "@/components/ui/button";
import type {
  OrchestrationTimelineDetail,
  TimelineAction,
} from "@/lib/dashboard/mission-control-types";
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
  failureReason?: string;
  aiReasoning?: string;
  actions?: TimelineAction[];
};

export function OrchestrationTimelineRow({
  icon: Icon,
  row,
  className,
  onAction,
}: {
  icon: LucideIcon;
  row: OrchestrationTimelineRowData;
  className?: string;
  onAction?: (actionId: TimelineAction["id"], row: OrchestrationTimelineRowData) => void;
}) {
  const [expanded, setExpanded] = useState(row.status === "failed");
  const hasDetails = (row.details?.length ?? 0) > 0 || !!row.aiReasoning;
  const hasActions = (row.actions?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2",
        row.status === "failed" && "border-rose-500/25 bg-rose-500/5",
        hasDetails && "transition-colors hover:border-violet-500/25 hover:bg-white/[0.04]",
        className,
      )}
    >
      <div
        className={cn(hasDetails && "cursor-pointer")}
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
            {row.failureReason ? (
              <p className="mt-1 text-[11px] text-rose-300/90">
                <span className="font-medium">Reason: </span>
                {row.failureReason}
              </p>
            ) : null}
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
            {expanded && row.aiReasoning ? (
              <div className="mt-2 rounded-md border border-violet-500/20 bg-violet-500/8 p-2 text-[11px] leading-relaxed">
                <p className="flex items-center gap-1 font-semibold text-violet-200">
                  <Sparkles className="size-3" />
                  Why did AI do this?
                </p>
                <p className="mt-1 text-muted-foreground">{row.aiReasoning}</p>
              </div>
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
      {hasActions ? (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-2">
          {row.actions!.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-lg border-white/10 px-2 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.(action.id, row);
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
