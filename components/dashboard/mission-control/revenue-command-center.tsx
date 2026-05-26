"use client";

import { motion } from "framer-motion";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { MissionMetricGrid, MissionMetricTile } from "@/components/dashboard/mission-control/mission-metric";
import type { RevenueCommandCenter } from "@/lib/dashboard/mission-control-types";
import { fadeItem } from "@/lib/motion";

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
  labelTitle?: string;
  format: (v: RevenueCommandCenter) => string;
  accent?: string;
}[] = [
  { key: "spend", label: "Spend", format: (r) => formatMoney(r.spend) },
  { key: "leads", label: "Leads", format: (r) => String(r.leads) },
  {
    key: "cpl",
    label: "CPL",
    labelTitle: "Cost per lead",
    format: (r) => (r.cpl != null ? formatMoney(r.cpl) : "—"),
  },
  {
    key: "roas",
    label: "ROAS",
    labelTitle: "Return on ad spend",
    format: (r) => (r.roas != null ? `${r.roas.toFixed(1)}×` : "—"),
    accent: "text-cyan-200",
  },
  {
    key: "revenue",
    label: "Generated",
    labelTitle: "Money generated from closed deals",
    format: (r) => formatMoney(r.revenue),
    accent: "text-emerald-300",
  },
  {
    key: "pipeline",
    label: "Pipeline",
    labelTitle: "Potential sales value from leads not closed yet",
    format: (r) => formatMoney(r.pipeline),
  },
  {
    key: "appointments",
    label: "Appts",
    labelTitle: "Appointments booked",
    format: (r) => String(r.appointments),
  },
  {
    key: "closedDeals",
    label: "Closed",
    labelTitle: "Closed deals",
    format: (r) => String(r.closedDeals),
  },
];

export function RevenueCommandCenterRow({ data }: { data: RevenueCommandCenter }) {
  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Revenue Command Center"
        description="Money generated from tracked leads and closed deals — spend, profit, and return on ad spend"
        headerExtra={
          <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-200">
            Live
          </span>
        }
      >
        <MissionMetricGrid>
          {KPI_CONFIG.map((kpi, i) => (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="min-w-0"
            >
              <MissionMetricTile
                label={kpi.label}
                labelTitle={kpi.labelTitle}
                value={kpi.format(data)}
                accent={kpi.accent}
                className="h-full transition-colors hover:border-emerald-500/25 hover:bg-emerald-500/5"
              />
            </motion.div>
          ))}
        </MissionMetricGrid>
      </GlassCard>
    </motion.div>
  );
}
