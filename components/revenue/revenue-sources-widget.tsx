"use client";

import { useRevenueAttributionOptional } from "@/components/revenue/revenue-attribution-context";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function RevenueSourcesWidget({ className }: { className?: string }) {
  const ctx = useRevenueAttributionOptional();
  if (!ctx) return null;

  const rows = ctx.attribution.bySource.slice(0, 6);

  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Revenue sources</h2>
        <p className="text-xs text-muted-foreground">
          Which campaigns and channels made money — spend, revenue, and return on ad spend
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => ctx.openDrawer(`journey-${row.id}`)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
          >
            <p className="text-sm font-medium">{row.sourceName}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Spend {formatMoney(row.spend)} · Revenue {formatMoney(row.revenue)}
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-300/90">
              {row.roas != null ? `${row.roas}× return on ad spend` : row.labelNote ?? "Organic"}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
