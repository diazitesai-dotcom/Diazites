"use client";

import Link from "next/link";

import { MissionMetricGrid, MissionMetricTile } from "@/components/dashboard/mission-control/mission-metric";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type Widget = {
  label: string;
  labelTitle?: string;
  value: string;
  href: string;
  accent?: string;
};

export function CommandCenterWidgets({ data }: { data: DashboardOverviewData }) {
  const m = data.metrics;
  const rev = data.revenueCommandCenter;
  const hotLeads = data.agentPerformance.find((a) => a.key === "lead_qualification");
  const pendingTasks = 3;
  const alerts = data.commandCenter.filter((c) => c.kind === "alert" || c.kind === "warning").length;

  const widgets: Widget[] = [
    { label: "Total leads", value: m ? String(m.totalLeads) : "—", href: ROUTES.leadsOs },
    {
      label: "Conversion",
      labelTitle: "Conversion rate",
      value: m?.conversionRate != null ? `${(m.conversionRate * 100).toFixed(1)}%` : "—",
      href: ROUTES.analytics,
    },
    { label: "Ad spend", value: m ? formatMoney(m.totalSpend) : formatMoney(rev.spend), href: ROUTES.campaignOps },
    {
      label: "CPL",
      labelTitle: "Cost per lead",
      value: m?.costPerLead != null ? formatMoney(m.costPerLead) : "—",
      href: ROUTES.reportsIntelligence,
    },
    {
      label: "Generated",
      labelTitle: "Money generated from closed deals",
      value: formatMoney(rev.revenue),
      href: ROUTES.reportsIntelligence,
      accent: "text-emerald-300",
    },
    {
      label: "ROAS",
      labelTitle: "Return on ad spend",
      value: rev.roas != null ? `${rev.roas.toFixed(1)}×` : m?.roi != null ? `${m.roi.toFixed(1)}×` : "—",
      href: ROUTES.reportsIntelligence,
    },
    {
      label: "Agents",
      labelTitle: "Active agents",
      value: String(data.agents.filter((a) => a.status === "active").length),
      href: ROUTES.agents,
    },
    {
      label: "Campaigns",
      labelTitle: "Active campaigns",
      value: String(m?.activeCampaigns ?? 0),
      href: ROUTES.campaignOps,
    },
    { label: "Tasks", labelTitle: "Pending tasks", value: String(pendingTasks), href: ROUTES.tasks },
    {
      label: "Hot leads",
      value: hotLeads?.status === "active" ? hotLeads.resultMetric : "—",
      href: ROUTES.leadsOs,
      accent: "text-amber-300",
    },
    {
      label: "Alerts",
      value: String(alerts),
      href: ROUTES.approvalCenter,
      accent: alerts ? "text-rose-300" : undefined,
    },
  ];

  return (
    <section className="min-w-0 space-y-3">
      <h2 className="text-sm font-semibold tracking-tight">Performance snapshot</h2>
      <MissionMetricGrid className="sm:gap-2">
        {widgets.map((w) => (
          <Link key={w.label} href={w.href} className="min-w-0">
            <MissionMetricTile
              label={w.label}
              labelTitle={w.labelTitle}
              value={w.value}
              accent={cn("text-lg sm:text-xl", w.accent)}
              className="h-full transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
            />
          </Link>
        ))}
      </MissionMetricGrid>
    </section>
  );
}
