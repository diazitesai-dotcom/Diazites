"use client";

import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

import { useRevenueAttribution } from "@/components/revenue/revenue-attribution-context";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/** Compact KPI tile — same footprint as other CEO Cockpit cards (details live in revenue drawer). */
export function CeoRevenueKpi({ index }: { index: number }) {
  const { attribution, openDrawer } = useRevenueAttribution();
  const { summary } = attribution;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="min-w-0 max-w-full"
    >
      <button
        type="button"
        onClick={() => openDrawer()}
        className={cn(
          "flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.04] p-4 text-left transition-all",
          "hover:border-violet-500/35 hover:bg-violet-500/10 hover:shadow-[0_8px_28px_-12px_rgba(139,92,246,0.35)]",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground"
            title="Money generated from tracked leads and closed deals"
          >
            Revenue generated
          </span>
          <Wallet className="size-3.5 shrink-0 text-emerald-400/80" aria-hidden />
        </div>
        <p className="mt-2 text-xl font-bold tabular-nums leading-tight tracking-tight text-emerald-300 sm:text-2xl">
          {formatMoney(summary.revenueGenerated)}
        </p>
        <div className="mt-auto space-y-1 pt-2">
          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {summary.closedDeals} closed {summary.closedDeals === 1 ? "lead" : "leads"}
          </p>
          <span className="text-[10px] font-medium text-violet-300/90">View revenue journey →</span>
        </div>
      </button>
    </motion.div>
  );
}
