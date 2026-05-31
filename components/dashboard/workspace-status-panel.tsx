"use client";

import Link from "next/link";
import { Bot, CreditCard, Gauge, Plug, Shield, Users } from "lucide-react";

import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { getPlanDefinition } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

function accountTypeLabel(type: DashboardOverviewData["workspace"]["accountType"]): string {
  if (type === "agency") return "Agency Account";
  if (type === "sub_account") return "Subaccount";
  return "Business Account";
}

export function WorkspaceStatusPanel({ data }: { data: DashboardOverviewData }) {
  const plan = getPlanDefinition(data.workspace.billingPlan);
  const activeAgents = data.agents.filter((a) => a.status === "active").length;
  const connectedCount = data.connections.filter((c) => c.status === "connected").length;

  const items = [
    { icon: Users, label: "Account Type", value: accountTypeLabel(data.workspace.accountType) },
    { icon: Shield, label: "Plan", value: plan.name },
    { icon: Bot, label: "Active Agents", value: String(activeAgents) },
    {
      icon: Gauge,
      label: "Feature Access",
      value: `${data.workspace.enabledServiceCount} modules`,
    },
    {
      icon: CreditCard,
      label: "Usage Limits",
      value: plan.limits.aiAgents != null ? `${plan.limits.aiAgents} agents` : "Custom",
    },
    { icon: Plug, label: "Connected Accounts", value: String(connectedCount) },
  ];

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-card/40 p-5 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-400">
            AI Command Center
          </p>
          <h3 className="text-lg font-semibold">
            Welcome back, {data.workspace.businessName}
          </h3>
          <p className="text-sm text-muted-foreground">
            AI Growth Score: {data.healthScore}/100 · {data.nextAction.title}
          </p>
        </div>
        <Link href="/dashboard/settings" className="text-xs font-medium text-violet-400 hover:underline">
          Manage workspace →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
                <Icon className="size-4 text-violet-400" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="truncate text-sm font-medium">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PremiumEmptyStateHints() {
  const hints = [
    {
      title: "Connect Google Ads",
      body: "Connect Google Ads to let your Ads Agent start building campaigns.",
      href: "/dashboard/integrations?connect=google",
    },
    {
      title: "Activate Follow-Up Agent",
      body: "Activate Follow-Up Agent to automatically respond to new leads.",
      href: "/dashboard/agents",
    },
    {
      title: "Connect Stripe",
      body: "Connect Stripe to start collecting payments.",
      href: "/dashboard/merchant-services",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {hints.map((hint) => (
        <Link
          key={hint.title}
          href={hint.href}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:border-violet-500/30 hover:bg-violet-500/[0.04]"
        >
          <p className="font-medium">{hint.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{hint.body}</p>
        </Link>
      ))}
    </div>
  );
}
