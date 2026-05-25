"use client";

import {
  CalendarCheck,
  Eye,
  LineChart,
  Percent,
  Target,
  TrendingUp,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { PerformanceChart } from "@/components/reports/performance-chart";
import { RevenueIntelligenceSection } from "@/components/reports/revenue-intelligence-section";
import type { DashboardMetrics } from "@/types/backend";
import type {
  ReportChartPoint,
  ReportsExtraMetrics,
} from "@/lib/dashboard/load-reports-page";
import type { RevenueAttributionSnapshot } from "@/types/revenue-attribution";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(n: number | null) {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

export function ReportsPageClient({
  metrics,
  extra,
  chartSeries,
  revenueAttribution,
}: {
  metrics: DashboardMetrics | null;
  extra: ReportsExtraMetrics;
  chartSeries: ReportChartPoint[];
  revenueAttribution: RevenueAttributionSnapshot | null;
}) {
  // Derive a true "Conversion Rate" preferring visitors / leads when we have
  // visitor data; fall back to the reporting service's existing conversionRate
  // (which is typically lead → won).
  const conversionRate =
    extra.visitors > 0 && metrics
      ? (metrics.totalLeads / extra.visitors) * 100
      : metrics?.conversionRate ?? null;

  const kpis = [
    {
      label: "Visitors",
      value: extra.visitors > 0 ? extra.visitors.toLocaleString() : "—",
      icon: Eye,
      hint: "Page views from public landing pages",
      trend: "neutral" as const,
    },
    {
      label: "Leads",
      value: metrics ? String(metrics.totalLeads) : "—",
      icon: Target,
      hint: metrics ? `Rolling ${metrics.periodDays} days` : "—",
      trend: "neutral" as const,
    },
    {
      label: "Conversion Rate",
      value: formatPct(conversionRate),
      icon: Percent,
      hint: extra.visitors > 0 ? "Leads / visitors" : "Lead → won",
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
      label: "ROAS",
      value: metrics?.roi != null ? `${metrics.roi.toFixed(1)}×` : "—",
      icon: TrendingUp,
      hint: "Return on ad spend",
      trend: "neutral" as const,
    },
    {
      label: "Booked Calls",
      value: extra.bookedCalls > 0 ? extra.bookedCalls.toString() : "—",
      icon: CalendarCheck,
      hint: "Leads in booked/won stages",
      trend: "neutral" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Reports & Intelligence"
        title="Analytics & executive insights"
        description="ROAS, revenue, pipeline, attribution, funnel performance, forecasting, agent performance, and AI summaries."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </section>

      {revenueAttribution ? <RevenueIntelligenceSection attribution={revenueAttribution} /> : null}

      <PerformanceChart data={chartSeries} />
    </div>
  );
}
