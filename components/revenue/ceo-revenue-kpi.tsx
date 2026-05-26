"use client";

import { ArrowRight, Wallet } from "lucide-react";
import { motion } from "framer-motion";

import {
  MissionMetricLabel,
  MissionMetricSub,
  MissionMetricValue,
} from "@/components/dashboard/mission-control/mission-metric";
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
      className={cn(
        "flex h-full min-w-0 flex-col rounded-xl border border-white/[0.1] bg-white/[0.04] p-4",
        "overflow-hidden",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <MissionMetricLabel title="Money generated from tracked leads and closed deals">
          Revenue generated
        </MissionMetricLabel>
        <Wallet className="size-3.5 shrink-0 text-emerald-400/80" aria-hidden />
      </div>

      <MissionMetricValue className="mt-2 text-2xl text-emerald-300 sm:text-2xl">
        {formatMoney(summary.revenueGenerated)}
      </MissionMetricValue>

      <MissionMetricSub className="line-clamp-1">
        {summary.closedDeals} closed {summary.closedDeals === 1 ? "lead" : "leads"}
      </MissionMetricSub>

      <div className="mt-2 min-w-0 space-y-1 border-t border-white/[0.06] pt-2">
        <p className="text-[10px] leading-snug text-muted-foreground">
          <span className="font-medium text-violet-200/90">Source: </span>
          <span className="line-clamp-2 break-words">{summary.topSourcesLabel}</span>
        </p>
        <p className="hidden text-[10px] leading-snug text-muted-foreground sm:line-clamp-2 xl:block">
          Tracked via CRM, manual close, Stripe, Shopify
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("mt-auto h-8 w-full shrink-0 rounded-lg text-xs")}
        onClick={() => openDrawer()}
      >
        View revenue journey
        <ArrowRight className="ml-1 size-3 shrink-0" />
      </Button>
    </motion.div>
  );
}
