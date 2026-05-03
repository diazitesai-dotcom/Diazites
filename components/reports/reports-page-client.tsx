"use client";

import { DollarSign, LineChart, Target, TrendingUp } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { PerformanceChart } from "@/components/reports/performance-chart";
import type { DashboardMetrics } from "@/types/backend";
import type { ReportChartPoint } from "@/lib/dashboard/load-reports-page";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ReportsPageClient({
  metrics,
  chartSeries,
}: {
  metrics: DashboardMetrics | null;
  chartSeries: ReportChartPoint[];
}) {
  const kpis = [
    {
      label: "Leads",
      value: metrics ? String(metrics.totalLeads) : "—",
      icon: Target,
      hint: metrics ? `Rolling ${metrics.periodDays} days` : "—",
      trend: "neutral" as const,
    },
    {
      label: "Spend",
      value: metrics ? formatMoney(metrics.totalSpend) : "—",
      icon: DollarSign,
      hint: metrics ? `Rolling ${metrics.periodDays} days` : "—",
      trend: "neutral" as const,
    },
    {
      label: "CPL",
      value:
        metrics?.costPerLead != null ? formatMoney(metrics.costPerLead) : "—",
      icon: LineChart,
      hint: "Blended cost per lead",
      trend: "neutral" as const,
    },
    {
      label: "ROI",
      value: metrics?.roi != null ? `${metrics.roi.toFixed(1)}×` : "—",
      icon: TrendingUp,
      hint: "Model vs ad spend",
      trend: "neutral" as const,
    },
  ];

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

      <PerformanceChart data={chartSeries} />
    </div>
  );
}
