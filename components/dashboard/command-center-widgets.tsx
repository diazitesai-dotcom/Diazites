"use client";

import Link from "next/link";

import { MissionMetricGrid, MissionMetricTile } from "@/components/dashboard/mission-control/mission-metric";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

type Widget = {
  label: string;
  labelTitle?: string;
  value: string;
  href: string;
  accent?: string;
};

/**
 * Secondary metrics only — primary KPIs live in the hero row.
 * Excludes: revenue, spend, ROAS, lead velocity, agent health, approval queue, raw lead totals.
 */
export function CommandCenterWidgets({ data }: { data: DashboardOverviewData }) {
  const m = data.metrics;
  const funnel = data.funnel;
  const qualified = funnel.find((s) => s.key === "qualified")?.count ?? 0;
  const booked = funnel.find((s) => s.key === "booked")?.count ?? 0;
  const won = funnel.find((s) => s.key === "won")?.count ?? 0;
  const leads = m?.totalLeads ?? 0;
  const bookingRate =
    leads > 0 ? `${Math.round(((booked + won) / leads) * 100)}%` : "—";
  const hotLeads = data.agentPerformance.find((a) => a.key === "lead_qualification");
  const pendingTasks = 3;

  const widgets: Widget[] = [
    {
      label: "Conversion",
      labelTitle: "Visitor → lead conversion",
      value: m?.conversionRate != null ? `${(m.conversionRate * 100).toFixed(1)}%` : "—",
      href: ROUTES.analytics,
    },
    {
      label: "Qualified",
      labelTitle: "Qualified leads in pipeline",
      value: String(qualified),
      href: ROUTES.leadsOs,
      accent: "text-cyan-300",
    },
    {
      label: "Booking rate",
      labelTitle: "Booked or won vs captured leads",
      value: bookingRate,
      href: ROUTES.leadsOs,
    },
    {
      label: "Campaigns",
      labelTitle: "Active campaigns",
      value: String(m?.activeCampaigns ?? 0),
      href: ROUTES.campaignOps,
    },
    {
      label: "Open tasks",
      labelTitle: "Pending operational tasks",
      value: String(pendingTasks),
      href: ROUTES.tasks,
    },
    {
      label: "Hot leads",
      labelTitle: "High-intent queue (lead agent)",
      value: hotLeads?.status === "active" ? hotLeads.resultMetric : "—",
      href: ROUTES.leadsOs,
      accent: "text-amber-300",
    },
    {
      label: "Won deals",
      labelTitle: "Closed-won in period",
      value: String(won),
      href: ROUTES.leadsOs,
      accent: won > 0 ? "text-emerald-300" : undefined,
    },
    {
      label: "Funnel drop-off",
      labelTitle: "Largest stage loss",
      value: data.funnelDiagnosis.dropoffStage || "—",
      href: ROUTES.analytics,
    },
  ];

  return (
    <section className="min-w-0 space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Performance snapshot</h2>
        <p className="text-xs text-muted-foreground">Supporting metrics — headline KPIs are above</p>
      </div>
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
