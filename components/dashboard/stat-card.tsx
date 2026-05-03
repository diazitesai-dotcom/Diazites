"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { easeOutExpo } from "@/lib/motion";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend = "neutral",
  className,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-rose-400"
        : "text-muted-foreground";

  return (
    <motion.div
      className={cn("h-full", className)}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={easeOutExpo}
    >
      <Card className="group h-full overflow-hidden border-white/[0.06] bg-gradient-to-br from-card/95 to-card/60 transition-transform duration-300 hover:-translate-y-0.5">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {value}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300 shadow-[0_0_24px_-8px_rgba(139,92,246,0.45)] transition-colors group-hover:border-violet-500/30 group-hover:text-cyan-300">
              <Icon className="size-5" aria-hidden />
            </span>
          </div>
          {hint ? (
            <p className={cn("text-xs font-medium", trendColor)}>{hint}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
