"use client";

import { motion } from "framer-motion";

import { StackHealthBar } from "@/components/dashboard/mission-control/stack-health-bar";
import type { StackHealthItem } from "@/lib/dashboard/mission-control-types";
import { fadeItem } from "@/lib/motion";

export function StackHealthSection({ items }: { items: StackHealthItem[] }) {
  if (!items.length) return null;

  return (
    <motion.section variants={fadeItem} initial="hidden" animate="show" className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Stack health</h2>
        <p className="text-xs text-muted-foreground">Infrastructure diagnostics — click a stack to troubleshoot</p>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-card/40 p-4">
        <StackHealthBar items={items} />
      </div>
    </motion.section>
  );
}
