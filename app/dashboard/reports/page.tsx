"use client";

import { DollarSign, LineChart, Target, TrendingUp } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { PerformanceChart } from "@/components/reports/performance-chart";

const kpis = [
  {
    label: "Leads",
    value: "166",
    icon: Target,
    hint: "Rolling 30 days",
    trend: "up" as const,
  },
  {
    label: "Spend",
    value: "$14,100",
    icon: DollarSign,
    hint: "MTD vs plan",
    trend: "neutral" as const,
  },
  {
    label: "CPL",
    value: "$84",
    icon: LineChart,
    hint: "Down vs prior period",
    trend: "up" as const,
  },
  {
    label: "ROI",
    value: "2.9x",
    icon: TrendingUp,
    hint: "Attributed revenue model",
    trend: "neutral" as const,
  },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        description="Executive-grade performance charts with the density operators expect — without exporting to spreadsheets."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </section>

      <PerformanceChart />
    </div>
  );
}
