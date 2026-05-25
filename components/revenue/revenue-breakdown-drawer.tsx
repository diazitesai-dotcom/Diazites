"use client";

import { X } from "lucide-react";

import { ManualRevenueEntryForm } from "@/components/revenue/manual-revenue-entry-form";
import { RevenueJourneyPanel } from "@/components/revenue/revenue-journey-panel";
import { Button } from "@/components/ui/button";
import { useRevenueAttribution } from "@/components/revenue/revenue-attribution-context";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function RevenueBreakdownDrawer() {
  const { attribution, drawerOpen, journeyId, closeDrawer } = useRevenueAttribution();
  const { summary, bySource, totals, journeys } = attribution;

  if (!drawerOpen) return null;

  const activeJourney = journeyId ? journeys.find((j) => j.id === journeyId) : journeys[0];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} aria-hidden />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/10 bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="revenue-drawer-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
              Revenue journey
            </p>
            <h2 id="revenue-drawer-title" className="text-lg font-semibold">
              Money generated from tracked leads and closed deals
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={closeDrawer} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Total revenue
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-200">
              {formatMoney(summary.revenueGenerated)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Profit {formatMoney(summary.profit)} · Spend {formatMoney(summary.totalSpend)}
              {summary.blendedRoas != null ? ` · Return on ad spend ${summary.blendedRoas}×` : ""}
            </p>
            <p className="mt-1 text-[10px] text-violet-300/80">{summary.attributionModelLabel}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Revenue by source</h3>
            <ul className="mt-3 space-y-3">
              {bySource.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{row.sourceName}</p>
                    {row.isOrganic ? (
                      <span className="shrink-0 text-[9px] uppercase text-cyan-300/90">
                        {row.labelNote ?? "Organic"}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Spend: {formatMoney(row.spend)}</span>
                    <span>Revenue: {formatMoney(row.revenue)}</span>
                    <span>Profit: {formatMoney(row.profit)}</span>
                    <span>
                      {row.roas != null
                        ? `Return on ad spend: ${row.roas}×`
                        : "Return on ad spend: N/A"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {activeJourney ? <RevenueJourneyPanel journey={activeJourney} /> : null}

          <ManualRevenueEntryForm />
        </div>

        <div className="border-t border-white/10 p-4 text-center text-xs text-muted-foreground">
          Potential sales value not closed yet: {formatMoney(totals.pipelineValue)}
        </div>
      </aside>
    </>
  );
}
