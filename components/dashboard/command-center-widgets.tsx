"use client";

import Link from "next/link";

import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type Widget = {
  label: string;
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
      label: "Conversion rate",
      value: m?.conversionRate != null ? `${(m.conversionRate * 100).toFixed(1)}%` : "—",
      href: ROUTES.analytics,
    },
    { label: "Ad spend", value: m ? formatMoney(m.totalSpend) : formatMoney(rev.spend), href: ROUTES.campaignOps },
    {
      label: "Cost per lead",
      value: m?.costPerLead != null ? formatMoney(m.costPerLead) : "—",
      href: ROUTES.reportsIntelligence,
    },
    { label: "Revenue", value: formatMoney(rev.revenue), href: ROUTES.reportsIntelligence, accent: "text-emerald-300" },
    {
      label: "ROAS",
      value: rev.roas != null ? `${rev.roas.toFixed(1)}×` : m?.roi != null ? `${m.roi.toFixed(1)}×` : "—",
      href: ROUTES.reportsIntelligence,
    },
    {
      label: "Active agents",
      value: String(data.agents.filter((a) => a.status === "active").length),
      href: ROUTES.agents,
    },
    {
      label: "Active campaigns",
      value: String(m?.activeCampaigns ?? 0),
      href: ROUTES.campaignOps,
    },
    { label: "Pending tasks", value: String(pendingTasks), href: ROUTES.tasks },
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
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-tight">Performance snapshot</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {widgets.map((w) => (
          <Link
            key={w.label}
            href={w.href}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{w.label}</p>
            <p className={cn("mt-1 text-xl font-bold tabular-nums", w.accent)}>{w.value}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
