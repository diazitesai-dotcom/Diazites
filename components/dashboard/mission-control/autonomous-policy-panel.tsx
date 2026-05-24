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
    budgetApprovalThreshold: "Require approval >$100 spend",
    autoPauseOnCplSpike: true,
    rollbackThreshold: "Auto rollback on 25% CPL spike",
    businessHoursMode: true,
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
    { label: "Marketing budget cap", value: policy.spendCap },
    { label: "Spend approval", value: policy.budgetApprovalThreshold },
    {
      label: "Campaign approval",
      value: policy.approvalRequired ? "Required for new campaigns" : "Not required",
    },
    { label: "Optimization", value: OPTIMIZATION_LABEL[policy.optimizationMode] },
    {
      label: "Auto pause on CPL spike",
      value: policy.autoPauseOnCplSpike ? "Enabled" : "Disabled",
    },
    { label: "Rollback threshold", value: policy.rollbackThreshold },
    { label: "Rollback", value: policy.rollbackEnabled ? "Enabled" : "Disabled" },
    {
      label: "Business hours mode",
      value: policy.businessHoursMode ? "Active · 9am–6pm" : "Off",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/25 to-card/40 p-4",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/80">
        Human approval policy
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Autonomy settings — guardrails for spend, rollback, and operating hours.
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
