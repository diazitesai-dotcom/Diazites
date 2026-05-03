"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const monthly = [
  { month: "Jan", leads: 32, spend: 2800, cpl: 87, roi: 2.3, conversions: 8 },
  { month: "Feb", leads: 37, spend: 3100, cpl: 84, roi: 2.5, conversions: 10 },
  { month: "Mar", leads: 45, spend: 3900, cpl: 86, roi: 2.7, conversions: 13 },
  { month: "Apr", leads: 52, spend: 4300, cpl: 82, roi: 2.9, conversions: 17 },
];

const gridStroke = "rgba(255,255,255,0.06)";
const axisStroke = "rgba(163,163,163,0.35)";

export function PerformanceChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 w-full animate-pulse rounded-2xl border border-border/60 bg-muted/20" />
        <div className="h-72 w-full animate-pulse rounded-2xl border border-border/60 bg-muted/20" />
      </div>
    );
  }

  const chartWrap =
    "h-72 w-full rounded-2xl border border-white/[0.06] bg-card/40 p-4 backdrop-blur-md shadow-inner";

  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    fontSize: 12,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={chartWrap}>
        <p className="mb-3 text-sm font-medium text-foreground">Leads & spend</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthly}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke={axisStroke} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke={axisStroke} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(167,139,250,0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
            <Bar dataKey="leads" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spend" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={chartWrap}>
        <p className="mb-3 text-sm font-medium text-foreground">CPL, ROI & conversions</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthly}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke={axisStroke} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke={axisStroke} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
            <Line type="monotone" dataKey="cpl" stroke="#fb7185" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="roi" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="conversions" stroke="#818cf8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
