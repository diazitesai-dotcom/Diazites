"use client";

import Link from "next/link";
import { AlertTriangle, Plug, Radio, Users } from "lucide-react";

import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { cn } from "@/lib/utils";

type Alert = {
  id: string;
  message: string;
  href: string;
  tone: "rose" | "amber" | "cyan";
  icon: typeof AlertTriangle;
};

function buildAlerts(data: DashboardOverviewData): Alert[] {
  const hasMeta = data.connections.some((c) => c.id === "meta" && c.status === "connected");
  const hasGoogle = data.connections.some((c) => c.id === "google" && c.status === "connected");
  const crmConnected = data.connections.some(
    (c) => (c.id === "hubspot" || c.id === "crm") && c.status === "connected",
  );
  const trackingDegraded = data.diagnostics.some(
    (d) => d.id === "tracking" && d.status !== "healthy",
  );
  const alerts: Alert[] = [];

  if (!hasMeta && !hasGoogle) {
    alerts.push({
      id: "ads",
      message: "Ad accounts not connected — estimated 18–32% more leads left on table.",
      href: "/dashboard/campaign-ops",
      tone: "amber",
      icon: Plug,
    });
  }
  if (trackingDegraded) {
    alerts.push({
      id: "tracking",
      message: "Tracking issue detected — reconnect pixels or analytics.",
      href: "/dashboard/integrations",
      tone: "rose",
      icon: Radio,
    });
  }
  if (!crmConnected && (data.metrics?.totalLeads ?? 0) > 0) {
    alerts.push({
      id: "crm",
      message: "Leads captured but not synced.",
      href: "/dashboard/leads",
      tone: "cyan",
      icon: Users,
    });
  }
  return alerts;
}

const TONE: Record<Alert["tone"], string> = {
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-100",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
};

export function MissionControlAlerts({ data }: { data: DashboardOverviewData }) {
  const alerts = buildAlerts(data);
  if (!alerts.length) return null;

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <li key={alert.id}>
            <Link
              href={alert.href}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-opacity hover:opacity-90",
                TONE[alert.tone],
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              <span>{alert.message}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
