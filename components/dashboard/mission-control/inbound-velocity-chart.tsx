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

import type { SparkPoint } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

function VelocityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SparkPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  const ann = point.annotation;

  return (
    <div className="max-w-[240px] rounded-xl border border-white/10 bg-card/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-md">
      <p className="font-semibold text-foreground">
        {point.d}: <span className="tabular-nums text-violet-200">{point.v} leads</span>
      </p>
      {ann ? (
        <div
          className={cn(
            "mt-2 rounded-lg border px-2 py-1.5",
            ann.kind === "spike"
              ? "border-cyan-500/30 bg-cyan-500/10"
              : ann.kind === "warning"
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-white/10 bg-white/[0.03]",
          )}
        >
          <p
            className={cn(
              "font-medium",
              ann.kind === "spike" ? "text-cyan-200" : "text-amber-200",
            )}
          >
            {ann.title}
          </p>
          <p className="mt-0.5 text-muted-foreground">{ann.detail}</p>
        </div>
      ) : (
        <p className="mt-1 text-muted-foreground">Hover points for AI velocity notes</p>
      )}
    </div>
  );
}

export function InboundVelocityChart({ data }: { data?: SparkPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-[140px] w-full animate-pulse rounded-xl bg-white/[0.04]" />
    );
  }

  const series = data && data.length > 0 ? data : [];

  return (
    <motion.div
      className="relative h-[160px] w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
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
          <Tooltip content={<VelocityTooltip />} cursor={{ stroke: "rgba(139,92,246,0.3)" }} />
          <Area
            type="monotone"
            dataKey="v"
            stroke="#818cf8"
            strokeWidth={2}
            fill="url(#velocityFill)"
            dot={(props) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: SparkPoint;
              };
              if (!payload.annotation) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={payload.annotation.kind === "warning" ? "#fbbf24" : "#22d3ee"}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6, fill: "#22d3ee", strokeWidth: 0 }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
