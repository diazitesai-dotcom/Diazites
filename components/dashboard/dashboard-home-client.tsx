"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpenCheck,
  DollarSign,
  Gauge,
  LayoutGrid,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { OverviewSparkChart } from "@/components/dashboard/overview-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import { fadeItem, staggerContainer } from "@/lib/motion";

const modules: [string, string, string][] = [
  ["Business profile", "/onboarding", "Brand, service area, routing rules"],
  ["Agent Manager", "/dashboard/agents", "Activate AI specialists"],
  ["Leads CRM", "/dashboard/leads", "Pipeline + qualification"],
  ["Campaigns", "/dashboard/campaigns", "Spend, CPL, geo"],
  ["Reports", "/dashboard/reports", "Performance charts"],
  ["Billing", "/dashboard/billing", "Plans & invoices"],
  ["Settings", "/dashboard/settings", "Notifications & routing"],
  ["Funnel builder", "/funnel", "Landing + capture"],
];

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function agentStatusVariant(
  status: string,
): "secondary" | "success" | "warning" | "outline" {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    default:
      return "outline";
  }
}

export function DashboardHomeClient({ data }: { data: DashboardOverviewData }) {
  const m = data.metrics;
  const periodHint = m ? `Last ${m.periodDays} days` : "No data yet";

  const metricsCards = [
    {
      label: "Leads generated",
      value: m ? String(m.totalLeads) : "—",
      icon: Target,
      hint: periodHint,
      trend: "neutral" as const,
    },
    {
      label: "Active campaigns",
      value: m ? String(m.activeCampaigns) : "—",
      icon: Gauge,
      hint: periodHint,
      trend: "neutral" as const,
    },
    {
      label: "Spend (period)",
      value: m ? formatMoney(m.totalSpend) : "—",
      icon: DollarSign,
      hint: periodHint,
      trend: "neutral" as const,
    },
    {
      label: "Cost per lead",
      value: m?.costPerLead != null ? formatMoney(m.costPerLead) : "—",
      icon: TrendingUp,
      hint: m?.costPerLead != null ? "Blended CPL" : periodHint,
      trend: "neutral" as const,
    },
    {
      label: "Booked + won",
      value: String(data.bookedOrWonCount),
      icon: BookOpenCheck,
      hint: periodHint,
      trend: "neutral" as const,
    },
    {
      label: "ROI (model)",
      value: m?.roi != null ? `${m.roi.toFixed(1)}×` : "—",
      icon: Sparkles,
      hint: "Attributed vs spend",
      trend: "neutral" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <PageHeader
        eyebrow="Operations"
        title="Mission control"
        description="Real-time snapshot of demand generation, agent orchestration, and revenue signals across your markets."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricsCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <motion.div variants={fadeItem} initial="hidden" animate="show" className="lg:col-span-3">
          <Card className="border-white/[0.06]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-lg">Inbound velocity</CardTitle>
                <CardDescription>
                  Seven-day lead flow — tuned for fast executive reads.
                </CardDescription>
              </div>
              <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-cyan-200">
                Live
              </span>
            </CardHeader>
            <CardContent>
              <OverviewSparkChart data={data.sparkSeries} />
            </CardContent>
          </Card>
        </motion.div>
        <div className="lg:col-span-2">
          <ActivityFeed items={data.activity} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-5 text-violet-400" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight">Modules</h2>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {modules.map(([name, href, blurb]) => (
            <motion.div key={name} variants={fadeItem}>
              <Link href={href} className="group block h-full">
                <Card className="h-full border-white/[0.06] transition-transform duration-300 group-hover:-translate-y-1">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{name}</CardTitle>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-300" />
                    </div>
                    <CardDescription>{blurb}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Agent roster</h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {data.agents.map((agent) => (
            <motion.div key={agent.key} variants={fadeItem}>
              <Card className="border-white/[0.06]">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <Badge variant={agentStatusVariant(agent.status)} className="capitalize">
                      {agent.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {agent.status === "active"
                      ? "Live in your account — monitor outcomes in Reports."
                      : agent.status === "pending"
                        ? "Provisioning — you will get a handoff when live."
                        : "Inactive — enable from Agent Manager when ready."}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
