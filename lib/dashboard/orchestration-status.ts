export type OrchestrationRunStatus = "completed" | "running" | "processing" | "failed";

export const ORCHESTRATION_STATUS_META: Record<
  OrchestrationRunStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  completed: {
    label: "Completed",
    dotClass: "bg-emerald-400",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  running: {
    label: "Running",
    dotClass: "bg-amber-400",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  processing: {
    label: "Processing",
    dotClass: "bg-sky-400",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-red-400",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-200",
  },
};
