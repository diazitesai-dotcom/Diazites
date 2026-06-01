"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "@/components/charts/chart-container";

const demoMonthly = [
  { month: "Jan", leads: 32, spend: 2800, cpl: 87, roi: 2.3, conversions: 8 },
  { month: "Feb", leads: 37, spend: 3100, cpl: 84, roi: 2.5, conversions: 10 },
];

const gridStroke = "rgba(255,255,255,0.06)";
const axisStroke = "rgba(163,163,163,0.35)";

export type PerformanceSeriesRow = {
  month: string;
  leads: number;
  spend: number;
  cpl: number;
  roi: number;
  conversions: number;
};

export function PerformanceChart({ data }: { data?: PerformanceSeriesRow[] }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 w-full animate-pulse rounded-2xl border border-border/60 bg-muted/20" />
        <div className="h-72 w-full animate-pulse rounded-2xl border border-border/60 bg-muted/20" />
      </div>
    );
  }

  const monthly = data && data.length > 0 ? data : demoMonthly;

  const chartWrap =
    "flex h-72 min-h-72 w-full min-w-0 flex-col rounded-2xl border border-white/[0.06] bg-card/40 p-4 backdrop-blur-md shadow-inner";

  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    fontSize: 12,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={chartWrap}>
        <p className="mb-3 shrink-0 text-sm font-medium text-foreground">Leads & spend</p>
        <ChartContainer className="min-h-0 flex-1" minHeight={200}>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={monthly}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                stroke={axisStroke}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={axisStroke}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(167,139,250,0.06)" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
              <Bar dataKey="leads" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spend" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ChartContainer>
      </div>
      <div className={chartWrap}>
        <p className="mb-3 shrink-0 text-sm font-medium text-foreground">CPL, ROI & conversions</p>
        <ChartContainer className="min-h-0 flex-1" minHeight={200}>
          {({ width, height }) => (
            <LineChart width={width} height={height} data={monthly}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                stroke={axisStroke}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={axisStroke}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
              <Line type="monotone" dataKey="cpl" stroke="#fb7185" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="roi" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#818cf8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          )}
        </ChartContainer>
      </div>
    </div>
  );
}
