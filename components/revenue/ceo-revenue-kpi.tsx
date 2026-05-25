"use client";

import { ArrowRight, Wallet } from "lucide-react";
import { motion } from "framer-motion";

import { useRevenueAttribution } from "@/components/revenue/revenue-attribution-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function CeoRevenueKpi({ index }: { index: number }) {
  const { attribution, openDrawer } = useRevenueAttribution();
  const { summary } = attribution;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex min-w-[160px] flex-col rounded-xl border border-white/[0.1] bg-white/[0.04] p-4 sm:min-w-[200px]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Revenue generated
        </span>
        <Wallet className="size-3.5 shrink-0 text-emerald-400/80" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-emerald-300">
        {formatMoney(summary.revenueGenerated)}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {summary.closedDeals} closed {summary.closedDeals === 1 ? "lead" : "leads"}
      </p>
      <p className="mt-2 text-[10px] leading-snug text-violet-200/80">
        <span className="text-muted-foreground">Source: </span>
        {summary.topSourcesLabel}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Tracked via: {summary.trackedViaLabel}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("mt-3 h-8 w-full rounded-lg text-xs")}
        onClick={() => openDrawer()}
      >
        View revenue journey
        <ArrowRight className="ml-1 size-3" />
      </Button>
    </motion.div>
  );
}
