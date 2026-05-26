import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Responsive KPI strip — auto-fit columns, no fixed 7-col squeeze. */
export function MissionKpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mission-kpi-strip", className)}>{children}</div>;
}

export function MissionKpiCell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mission-kpi-cell min-w-0", className)}>{children}</div>;
}

/** Auto-fit metric grid for cards (revenue command center, forecast, widgets). */
export function MissionMetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mission-metric-grid", className)}>{children}</div>;
}

export function MissionMetricTile({
  label,
  value,
  sub,
  accent,
  labelTitle,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  labelTitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mission-metric-tile flex min-h-[4.5rem] min-w-0 flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-3",
        className,
      )}
    >
      <MissionMetricLabel title={labelTitle}>{label}</MissionMetricLabel>
      <MissionMetricValue className={accent}>{value}</MissionMetricValue>
      {sub ? <MissionMetricSub>{sub}</MissionMetricSub> : null}
    </div>
  );
}

export function MissionMetricLabel({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground",
        className,
      )}
      title={title}
    >
      {children}
    </p>
  );
}

export function MissionMetricValue({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-lg font-bold tabular-nums leading-tight tracking-tight sm:text-xl",
        "break-words [overflow-wrap:anywhere]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function MissionMetricSub({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-[11px] leading-snug text-muted-foreground",
        "line-clamp-3 break-words [overflow-wrap:anywhere]",
        className,
      )}
    >
      {children}
    </p>
  );
}
