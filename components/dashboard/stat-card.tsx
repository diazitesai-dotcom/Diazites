"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { AnimatedCounter } from "@/components/dashboard/mission-control/animated-counter";
import { Card, CardContent } from "@/components/ui/card";
import { easeOutExpo } from "@/lib/motion";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  trendPercent?: number;
  numericValue?: number;
  formatValue?: (n: number) => string;
  className?: string;
  invertTrend?: boolean;
  trafficSource?: string;
  periodLabel?: string;
  microInsight?: string;
  href?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend = "neutral",
  trendPercent,
  numericValue,
  formatValue,
  className,
  invertTrend = false,
  trafficSource,
  periodLabel,
  microInsight,
  href,
}: StatCardProps) {
  const effectiveTrend =
    invertTrend && trend === "up"
      ? "down"
      : invertTrend && trend === "down"
        ? "up"
        : trend;

  const trendColor =
    effectiveTrend === "up"
      ? "text-emerald-400"
      : effectiveTrend === "down"
        ? "text-rose-400"
        : "text-muted-foreground";

  const card = (
    <Card
      className={cn(
        "group h-full overflow-hidden border-white/[0.06] bg-gradient-to-br from-card/95 to-card/60 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-violet-500/25 hover:shadow-[0_12px_40px_-12px_rgba(139,92,246,0.3)]",
        href && "cursor-pointer",
      )}
    >
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {numericValue != null && formatValue ? (
                <AnimatedCounter value={numericValue} format={formatValue} />
              ) : numericValue != null ? (
                <AnimatedCounter value={numericValue} />
              ) : (
                value
              )}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300 shadow-[0_0_24px_-8px_rgba(139,92,246,0.45)] transition-all duration-300 group-hover:border-violet-500/40 group-hover:text-cyan-300 group-hover:shadow-[0_0_28px_-6px_rgba(34,211,238,0.4)]">
            <Icon className="size-5" aria-hidden />
          </span>
        </div>

        {trafficSource || periodLabel ? (
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {periodLabel ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-muted-foreground">
                {periodLabel}
              </span>
            ) : null}
            {trafficSource ? (
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-violet-200/90">
                {trafficSource}
              </span>
            ) : null}
          </div>
        ) : null}

        {microInsight ? (
          <p className="text-[11px] leading-snug text-cyan-200/70">{microInsight}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {trendPercent != null && trend !== "neutral" ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                effectiveTrend === "up"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/25 bg-rose-500/10 text-rose-400",
              )}
            >
              {effectiveTrend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {trendPercent}% vs prior
            </span>
          ) : null}
          {hint ? <p className={cn("text-xs font-medium", trendColor)}>{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      className={cn("mission-elevate h-full", className)}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={easeOutExpo}
    >
      {href ? <Link href={href}>{card}</Link> : card}
    </motion.div>
  );
}
