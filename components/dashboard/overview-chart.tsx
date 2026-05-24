"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const defaultSeries = [
  { d: "Mon", v: 0 },
  { d: "Tue", v: 0 },
  { d: "Wed", v: 0 },
  { d: "Thu", v: 0 },
  { d: "Fri", v: 0 },
  { d: "Sat", v: 0 },
  { d: "Sun", v: 0 },
];

export function OverviewSparkChart({ data }: { data?: { d: string; v: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-[140px] w-full space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-[120px] w-full animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  const series = data && data.length > 0 ? data : defaultSeries;

  return (
    <motion.div
      className="relative h-[140px] w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-violet-500/5 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="d"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)" }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke="#818cf8"
            strokeWidth={2}
            fill="url(#sparkFill)"
            dot={false}
            activeDot={{ r: 5, fill: "#22d3ee", strokeWidth: 0 }}
            isAnimationActive
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
