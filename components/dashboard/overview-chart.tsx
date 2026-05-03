"use client";

import { useEffect, useState } from "react";
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
    return <div className="h-[140px] w-full animate-pulse rounded-xl bg-muted/30" />;
  }

  const series = data && data.length > 0 ? data : defaultSeries;

  return (
    <div className="h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
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
            activeDot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
