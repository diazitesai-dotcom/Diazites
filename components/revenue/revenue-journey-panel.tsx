"use client";

import type { RevenueJourney } from "@/types/revenue-attribution";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function RevenueJourneyPanel({ journey }: { journey: RevenueJourney }) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
      <h3 className="text-sm font-semibold">{journey.title}</h3>
      <p className="text-xs text-muted-foreground">
        {journey.source} · Spend {formatMoney(journey.spend)}
      </p>
      <div className="mt-4 space-y-2">
        {journey.steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                i === journey.steps.length - 1
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-white/10 text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <div className="flex-1 text-sm">
              <span className="font-medium tabular-nums">
                {typeof step.count === "number" && step.label === "Revenue"
                  ? formatMoney(step.count)
                  : step.count}
              </span>
              <span className="ml-2 text-muted-foreground">{step.label}</span>
            </div>
            {i < journey.steps.length - 1 ? (
              <span className="text-muted-foreground" aria-hidden>
                ↓
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="text-foreground/80">Close: </span>
          {journey.closeMethod}
        </p>
        <p>
          <span className="text-foreground/80">Profit: </span>
          {formatMoney(journey.profit)}
          {journey.roas != null ? ` · ROAS ${journey.roas}×` : ""}
        </p>
        {journey.aiActions.length > 0 ? (
          <p>
            <span className="text-foreground/80">AI: </span>
            {journey.aiActions.join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
