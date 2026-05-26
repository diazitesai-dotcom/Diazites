"use client";

import Link from "next/link";

import { useRevenueAttributionOptional } from "@/components/revenue/revenue-attribution-context";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function AgentRevenueCards({ className }: { className?: string }) {
  const ctx = useRevenueAttributionOptional();
  if (!ctx) return null;

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Money AI helped recover or influence</h2>
        <Link href={ROUTES.agents} className="text-xs text-violet-300 underline">
          All agents
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ctx.attribution.agentContributions.map((a) => (
          <Link
            key={a.agentKey}
            href={`${ROUTES.agents}/${a.agentKey}`}
            className="min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:border-violet-500/30"
          >
            <p className="text-sm font-medium leading-snug">{a.agentName}</p>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Cost: {formatMoney(a.cost)}</span>
              <span>Revenue influenced: {formatMoney(a.revenueInfluenced)}</span>
              <span>Deals assisted: {a.dealsAssisted}</span>
              <span>Closed: {a.closedDeals}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-emerald-300/90">
              {a.roi != null ? `ROI ${a.roi}×` : a.roas != null ? `ROAS ${a.roas}×` : a.highlight}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
