"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACTIVITY_FEED_FILTERS,
  inferActivityCategory,
  type ActivityFeedCategory,
  type ActivityFeedFilter,
} from "@/lib/dashboard/activity-feed";
import type { ActivitySeverity } from "@/lib/dashboard/mission-control-types";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type ActivityFeedItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  severity?: ActivitySeverity;
  category?: ActivityFeedCategory;
};

const severityStyles: Record<
  ActivitySeverity,
  { dot: string; border: string; badge: string; label: string }
> = {
  success: {
    dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]",
    border: "border-l-emerald-500/50",
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    label: "Success",
  },
  warning: {
    dot: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]",
    border: "border-l-amber-500/50",
    badge: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    label: "Warning",
  },
  critical: {
    dot: "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.6)] animate-pulse",
    border: "border-l-rose-500/60",
    badge: "border-rose-500/30 bg-rose-500/15 text-rose-400",
    label: "Critical",
  },
  info: {
    dot: "bg-gradient-to-br from-violet-400 to-cyan-400 shadow-[0_0_12px_rgba(167,139,250,0.6)]",
    border: "border-l-violet-500/40",
    badge: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    label: "Info",
  },
};

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  const [filter, setFilter] = useState<ActivityFeedFilter>("all");

  const enriched = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        resolvedCategory: item.category ?? inferActivityCategory(item),
      })),
    [items],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return enriched;
    return enriched.filter((item) => item.resolvedCategory === filter);
  }, [enriched, filter]);

  const counts = useMemo(() => {
    const tally: Record<ActivityFeedFilter, number> = {
      all: enriched.length,
      deployments: 0,
      agents: 0,
      errors: 0,
      ai_actions: 0,
    };
    for (const item of enriched) {
      if (item.resolvedCategory) tally[item.resolvedCategory] += 1;
    }
    return tally;
  }, [enriched]);

  return (
    <motion.div
      variants={fadeItem}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
    >
      <Card className="border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-[0_8px_32px_-12px_rgba(139,92,246,0.2)]">
        <CardHeader className="space-y-3 border-b border-border/50 pb-4">
          <motion.div className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">Live activity</CardTitle>
            <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-violet-200">
              <Sparkles className="size-3.5" aria-hidden />
              Live
            </span>
          </motion.div>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_FEED_FILTERS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilter(pill.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                  filter === pill.id
                    ? "border-violet-500/45 bg-violet-500/15 text-violet-100 shadow-[0_0_16px_-6px_rgba(139,92,246,0.45)]"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground",
                )}
              >
                {pill.label}
                {pill.id !== "all" && counts[pill.id] > 0 ? (
                  <span className="ml-1 tabular-nums opacity-70">{counts[pill.id]}</span>
                ) : null}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/60 px-0 pt-0">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              {items.length === 0
                ? "No recent events yet. Capture a lead or run a campaign to populate this feed."
                : `No ${ACTIVITY_FEED_FILTERS.find((p) => p.id === filter)?.label.toLowerCase()} events in this window.`}
            </div>
          ) : null}
          {filtered.map((item) => {
            const sev = item.severity ?? "info";
            const style = severityStyles[sev];
            return (
              <div
                key={item.id}
                className={cn(
                  "flex gap-4 border-l-2 px-5 py-4 transition-colors hover:bg-white/[0.03]",
                  style.border,
                )}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", style.dot)} />
                <motion.div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <span
                      className={cn(
                        "rounded-full border px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide",
                        style.badge,
                      )}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </motion.div>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {item.time}
                </time>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
