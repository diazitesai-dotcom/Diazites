import type { AutonomousMode } from "@/types/agent-deployment";
import type { AutonomousPolicy } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

export function buildAutonomousPolicy(
  mode: AutonomousMode = "guided",
  spendCap = "$25/day",
): AutonomousPolicy {
  return {
    spendCap,
    approvalRequired: mode !== "autonomous",
    optimizationMode:
      mode === "autonomous"
        ? "auto-approved"
        : mode === "guided"
          ? "guided"
          : "manual",
    rollbackEnabled: true,
  };
}

const OPTIMIZATION_LABEL: Record<AutonomousPolicy["optimizationMode"], string> = {
  "auto-approved": "Auto-approved",
  guided: "Guided approval",
  manual: "Manual only",
};

export function AutonomousPolicyPanel({
  policy,
  className,
}: {
  policy: AutonomousPolicy;
  className?: string;
}) {
  const rows = [
    { label: "Spend cap", value: policy.spendCap },
    {
      label: "Approval",
      value: policy.approvalRequired ? "Required for new campaigns" : "Not required",
    },
    { label: "Optimization", value: OPTIMIZATION_LABEL[policy.optimizationMode] },
    { label: "Rollback", value: policy.rollbackEnabled ? "Enabled" : "Disabled" },
  ];

  return (
    <div
      className={cn(
        "rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/25 to-card/40 p-4",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/80">
        Autonomous policy
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium text-foreground/90">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
