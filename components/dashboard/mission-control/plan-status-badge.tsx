import type { PlanLifecycleStatus } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  PlanLifecycleStatus,
  { label: string; className: string }
> = {
  pending_review: {
    label: "Pending Review",
    className: "border-amber-500/35 bg-amber-500/12 text-amber-200",
  },
  approved: {
    label: "Approved",
    className: "border-cyan-500/35 bg-cyan-500/12 text-cyan-200",
  },
  deploying: {
    label: "Deploying",
    className: "border-violet-500/35 bg-violet-500/12 text-violet-200 mission-timeline-dot-pulse",
  },
  live: {
    label: "Live",
    className: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
  },
};

export function PlanStatusBadge({
  status,
  className,
}: {
  status: PlanLifecycleStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Plan status
      </span>
      <span
        className={cn(
          "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          meta.className,
        )}
      >
        {meta.label}
      </span>
    </div>
  );
}

export function deriveStackPlanStatus(
  agents: { agent_type: string; status: string }[],
  stackAgentTypes: string[],
): PlanLifecycleStatus {
  const relevant = agents.filter((a) => stackAgentTypes.includes(a.agent_type));
  if (relevant.length === 0) return "pending_review";
  if (relevant.some((a) => a.status === "pending")) return "deploying";
  if (relevant.every((a) => a.status === "active")) return "live";
  if (relevant.some((a) => a.status === "active")) return "approved";
  return "pending_review";
}
