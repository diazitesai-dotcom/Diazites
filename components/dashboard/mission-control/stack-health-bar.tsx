import type { StackHealthItem, StackHealthStatus } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<StackHealthStatus, string> = {
  healthy: "text-emerald-400",
  warning: "text-amber-400",
  degraded: "text-rose-400",
  active: "text-cyan-400",
};

const STATUS_LABEL: Record<StackHealthStatus, string> = {
  healthy: "HEALTHY",
  warning: "WARNING",
  degraded: "DEGRADED",
  active: "ACTIVE",
};

export function StackHealthBar({
  items,
  className,
}: {
  items: StackHealthItem[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Stack health
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs"
          >
            <span className="font-medium text-foreground/90">{item.label}</span>
            <span
              className={cn(
                "shrink-0 text-[10px] font-bold uppercase tracking-wide",
                STATUS_STYLE[item.status],
              )}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
