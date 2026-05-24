"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck,
  DollarSign,
  Handshake,
  LineChart,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import type { RevenueCommandCenter } from "@/lib/dashboard/mission-control-types";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const KPI_CONFIG: {
  key: keyof RevenueCommandCenter;
  label: string;
  icon: typeof DollarSign;
  format: (v: RevenueCommandCenter) => string;
  accent?: string;
}[] = [
  { key: "spend", label: "Spend", icon: Wallet, format: (r) => formatMoney(r.spend) },
  { key: "leads", label: "Leads", icon: Target, format: (r) => String(r.leads) },
  {
    key: "cpl",
    label: "CPL",
    icon: TrendingUp,
    format: (r) => (r.cpl != null ? formatMoney(r.cpl) : "—"),
  },
  {
    key: "roas",
    label: "ROAS",
    icon: LineChart,
    format: (r) => (r.roas != null ? `${r.roas.toFixed(1)}×` : "—"),
    accent: "text-cyan-200",
  },
  { key: "revenue", label: "Revenue", icon: DollarSign, format: (r) => formatMoney(r.revenue), accent: "text-emerald-300" },
  { key: "pipeline", label: "Pipeline", icon: LineChart, format: (r) => formatMoney(r.pipeline) },
  { key: "appointments", label: "Appointments", icon: CalendarCheck, format: (r) => String(r.appointments) },
  { key: "closedDeals", label: "Closed deals", icon: Handshake, format: (r) => String(r.closedDeals) },
];

export function RevenueCommandCenterRow({ data }: { data: RevenueCommandCenter }) {
  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Revenue Command Center"
        description="Money-first KPIs — what buyers care about"
        headerExtra={
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-200">
            Live
          </span>
        }
      >
        <motion.div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {KPI_CONFIG.map((kpi, i) => (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-emerald-500/25 hover:bg-emerald-500/5"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <kpi.icon className="size-3 shrink-0 text-emerald-400/80" />
                {kpi.label}
              </div>
              <p className={cn("mt-1.5 text-lg font-bold tabular-nums tracking-tight", kpi.accent ?? "text-foreground")}>
                {kpi.format(data)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
