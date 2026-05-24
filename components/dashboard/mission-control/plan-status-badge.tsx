import type { PlanLifecycleStatus } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<PlanLifecycleStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "border-white/20 bg-white/[0.06] text-muted-foreground",
  },
  reviewing: {
    label: "Reviewing",
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
  optimizing: {
    label: "Optimizing",
    className: "border-sky-500/35 bg-sky-500/12 text-sky-200 mission-eta-tick",
  },
  paused: {
    label: "Paused",
    className: "border-white/25 bg-white/[0.08] text-muted-foreground",
  },
  failed: {
    label: "Failed",
    className: "border-rose-500/35 bg-rose-500/12 text-rose-300",
  },
  rolled_back: {
    label: "Rolled Back",
    className: "border-amber-500/30 bg-amber-500/8 text-amber-200/90",
  },
};

export function PlanStatusBadge({
  status,
  className,
  label = "Plan status",
}: {
  status: PlanLifecycleStatus;
  className?: string;
  label?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
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
  if (relevant.length === 0) return "draft";
  if (relevant.some((a) => a.status === "error")) return "failed";
  if (relevant.some((a) => a.status === "pending")) return "deploying";
  if (relevant.every((a) => a.status === "active")) {
    const optimizing = relevant.some((a) =>
      ["retargeting", "social_ads", "search_ads"].includes(a.agent_type),
    );
    return optimizing ? "optimizing" : "live";
  }
  if (relevant.some((a) => a.status === "active")) return "approved";
  if (relevant.some((a) => a.status === "inactive")) return "reviewing";
  return "draft";
}
