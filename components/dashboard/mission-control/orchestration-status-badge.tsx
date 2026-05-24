import { ORCHESTRATION_STATUS_META, type OrchestrationRunStatus } from "@/lib/dashboard/orchestration-status";
import { cn } from "@/lib/utils";

export function OrchestrationStatusBadge({
  status,
  className,
}: {
  status: OrchestrationRunStatus;
  className?: string;
}) {
  const meta = ORCHESTRATION_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
        meta.badgeClass,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} aria-hidden />
      {meta.label}
    </span>
  );
}
