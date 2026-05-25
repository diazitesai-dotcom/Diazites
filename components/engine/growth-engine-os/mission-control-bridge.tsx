"use client";

import Link from "next/link";
import { AlertTriangle, Plug, Radio, Target, Users } from "lucide-react";

import { cn } from "@/lib/utils";

type Alert = { id: string; message: string; href: string; tone: "rose" | "amber" | "cyan" };

export function MissionControlBridge({
  hasMeta,
  hasGoogle,
  trackingOk,
  crmConnected,
  visitorsForRetargeting,
}: {
  hasMeta: boolean;
  hasGoogle: boolean;
  trackingOk: boolean;
  crmConnected: boolean;
  visitorsForRetargeting: number;
}) {
  const alerts: Alert[] = [];
  if (!hasMeta && !hasGoogle) {
    alerts.push({
      id: "ads",
      message: "Ad accounts not connected — estimated 18–32% more leads left on table.",
      href: "/dashboard/integrations",
      tone: "amber",
    });
  }
  if (!trackingOk) {
    alerts.push({
      id: "tracking",
      message: "Tracking issue detected — reconnect pixels or analytics.",
      href: "/dashboard/integrations",
      tone: "rose",
    });
  }
  if (!crmConnected) {
    alerts.push({
      id: "crm",
      message: "Leads captured but not synced to CRM.",
      href: "/dashboard/leads",
      tone: "cyan",
    });
  }
  if (visitorsForRetargeting >= 20) {
    alerts.push({
      id: "retarget",
      message: `Retargeting ready — ${visitorsForRetargeting} visitors available.`,
      href: "/dashboard/campaign-ops",
      tone: "cyan",
    });
  }

  if (!alerts.length) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200/90">
        Mission Control sync active — runs feed Live System Map, recommendations, and stack health.
        <Link href="/dashboard" className="ml-2 underline hover:text-emerald-100">
          Open Mission Control
        </Link>
      </div>
    );
  }

  const iconMap = { ads: Plug, tracking: Radio, crm: Users, retarget: Target };
  const toneClass = {
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-100",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
  };

  return (
    <ul className="space-y-2">
      {alerts.map((a) => {
        const Icon = iconMap[a.id as keyof typeof iconMap] ?? AlertTriangle;
        return (
          <li key={a.id}>
            <Link
              href={a.href}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-opacity hover:opacity-90",
                toneClass[a.tone],
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              {a.message}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
