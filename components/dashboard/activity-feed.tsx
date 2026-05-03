"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeItem } from "@/lib/motion";

const items = [
  {
    id: "1",
    title: "AI follow-up drafted",
    detail: "Maya Smith · Emergency Repairs",
    time: "2m ago",
  },
  {
    id: "2",
    title: "New lead captured",
    detail: "Facebook Ads · Storm Season Special",
    time: "14m ago",
  },
  {
    id: "3",
    title: "Campaign spend pacing",
    detail: "Google · 78% of monthly budget",
    time: "1h ago",
  },
  {
    id: "4",
    title: "Appointment booked",
    detail: "Nina Hall · Roof Inspection Offer",
    time: "3h ago",
  },
];

export function ActivityFeed() {
  return (
    <motion.div
      variants={fadeItem}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
    >
      <Card className="border-white/[0.06]">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold">Live activity</CardTitle>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-violet-200">
            <Sparkles className="size-3.5" aria-hidden />
            AI
          </span>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/60 px-0 pt-0">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
            >
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 shadow-[0_0_12px_rgba(167,139,250,0.6)]" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {item.time}
              </time>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
