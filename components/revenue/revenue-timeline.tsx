"use client";

import { useRevenueAttributionOptional } from "@/components/revenue/revenue-attribution-context";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function RevenueTimeline({ className }: { className?: string }) {
  const ctx = useRevenueAttributionOptional();
  if (!ctx || ctx.attribution.timeline.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-semibold">Revenue timeline</h2>
      <ul className="space-y-2">
        {ctx.attribution.timeline.map((ev) => (
          <li
            key={ev.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{ev.label}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(ev.at).toLocaleString()} · {ev.source}
                {ev.leadName ? ` · ${ev.leadName}` : ""}
                {ev.agent ? ` · ${ev.agent}` : ""}
              </p>
            </div>
            <span className="font-bold tabular-nums text-emerald-300">+{formatMoney(ev.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
