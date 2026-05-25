"use client";

import { useRevenueAttributionOptional } from "@/components/revenue/revenue-attribution-context";
import { cn } from "@/lib/utils";

export function RevenueRecommendations({ className }: { className?: string }) {
  const ctx = useRevenueAttributionOptional();
  if (!ctx || ctx.attribution.recommendations.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-semibold">Revenue recommendations</h2>
      <ul className="space-y-2">
        {ctx.attribution.recommendations.map((r) => (
          <li
            key={r.id}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              r.priority === "high"
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-white/[0.08] bg-white/[0.02]",
            )}
          >
            <p className="font-medium">{r.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
