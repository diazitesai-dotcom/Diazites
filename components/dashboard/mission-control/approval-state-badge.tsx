import type { ApprovalState } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

const APPROVAL_META: Record<ApprovalState, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "border-amber-500/35 bg-amber-500/12 text-amber-200",
  },
  ai_approved: {
    label: "AI approved",
    className: "border-cyan-500/35 bg-cyan-500/12 text-cyan-200",
  },
  user_approval_required: {
    label: "User approval required",
    className: "border-violet-500/35 bg-violet-500/12 text-violet-200",
  },
};

export function ApprovalStateBadge({
  state,
  className,
}: {
  state: ApprovalState;
  className?: string;
}) {
  const meta = APPROVAL_META[state];
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Approval
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
