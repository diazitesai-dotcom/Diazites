"use client";

import Link from "next/link";
import { AlertTriangle, ClipboardList, KeyRound, Plug, Radio, Users } from "lucide-react";

import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { ROUTES } from "@/lib/navigation/platform-nav";
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
    (d) => d.id === "tracking" && d.status === "critical",
  );
  const expiredToken = data.connections.some((c) => c.status === "expired");
  const connectionErrors = data.connections.filter(
    (c) => c.status === "error" || c.status === "needs_attention",
  );
  const approvalBacklog =
    data.nextAction.approvalState === "pending" ||
    data.nextAction.approvalState === "user_approval_required";

  const alerts: Alert[] = [];

  if (!hasMeta && !hasGoogle) {
    alerts.push({
      id: "ads",
      message: "Ad accounts disconnected — connect Meta or Google to run paid traffic.",
      href: ROUTES.campaignOps,
      tone: "amber",
      icon: Plug,
    });
  }

  if (trackingDegraded) {
    alerts.push({
      id: "tracking",
      message: "Tracking degraded — reconnect pixels or analytics.",
      href: ROUTES.integrationsHub,
      tone: "rose",
      icon: Radio,
    });
  }

  if (!crmConnected && (data.metrics?.totalLeads ?? 0) > 0) {
    alerts.push({
      id: "crm",
      message: "CRM sync failure — leads captured but not syncing.",
      href: ROUTES.leadsOs,
      tone: "cyan",
      icon: Users,
    });
  }

  if (expiredToken) {
    alerts.push({
      id: "token",
      message: "Integration token expired — refresh credentials.",
      href: ROUTES.integrationsHub,
      tone: "rose",
      icon: KeyRound,
    });
  }

  for (const conn of connectionErrors.slice(0, 2)) {
    alerts.push({
      id: `conn-${conn.id}`,
      message: `${conn.name} needs attention${conn.healthDetail ? ` — ${conn.healthDetail}` : ""}.`,
      href: conn.href,
      tone: "amber",
      icon: AlertTriangle,
    });
  }

  if (approvalBacklog) {
    alerts.push({
      id: "approvals",
      message: "Approval backlog — a launch or budget change is waiting on you.",
      href: ROUTES.approvalCenter,
      tone: "amber",
      icon: ClipboardList,
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
    <section className="space-y-2">
      <h2 className="text-sm font-semibold tracking-tight">Alerts</h2>
      <p className="text-xs text-muted-foreground">Problems that need attention — not recommendations</p>
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
    </section>
  );
}
