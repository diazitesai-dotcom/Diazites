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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENTS } from "@/utils/constants";
import { fadeItem, staggerContainer } from "@/lib/motion";

const metrics = [
  {
    label: "Leads generated",
    value: "124",
    icon: Target,
    hint: "+18% vs last month",
    trend: "up" as const,
  },
  {
    label: "Active campaigns",
    value: "8",
    icon: Gauge,
    hint: "2 scaling",
    trend: "neutral" as const,
  },
  {
    label: "Spend (MTD)",
    value: "$14,300",
    icon: DollarSign,
    hint: "On pace vs budget",
    trend: "neutral" as const,
  },
  {
    label: "Cost per lead",
    value: "$115",
    icon: TrendingUp,
    hint: "−12% efficiency",
    trend: "up" as const,
  },
  {
    label: "Booked appointments",
    value: "27",
    icon: BookOpenCheck,
    hint: "Pipeline heating up",
    trend: "up" as const,
  },
  {
    label: "Revenue estimate",
    value: "$189k",
    icon: Sparkles,
    hint: "Weighted forecast",
    trend: "neutral" as const,
  },
];

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

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <PageHeader
        eyebrow="Operations"
        title="Mission control"
        description="Real-time snapshot of demand generation, agent orchestration, and revenue signals across your markets."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <StatCard key={m.label} {...m} />
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
              <OverviewSparkChart />
            </CardContent>
          </Card>
        </motion.div>
        <div className="lg:col-span-2">
          <ActivityFeed />
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
          {AGENTS.map((agent) => (
            <motion.div key={agent.key} variants={fadeItem}>
              <Card className="border-white/[0.06]">
                <CardHeader>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <CardDescription>
                    Setup in progress (24–72 hours). You will receive handoff when
                    live.
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
