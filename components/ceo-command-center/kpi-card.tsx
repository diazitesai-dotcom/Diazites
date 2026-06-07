import {
  Calendar,
  DollarSign,
  Megaphone,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Sparkline } from "@/components/ceo-command-center/shared/sparkline";
import { cn } from "@/lib/utils";
import type { KpiCardData } from "@/types/ceo-command-center";

const iconMap = {
  dollar: DollarSign,
  users: Users,
  calendar: Calendar,
  cart: ShoppingCart,
  megaphone: Megaphone,
};

const accentMap = {
  green: {
    icon: "bg-emerald-500/15 text-emerald-400",
    spark: "#22c55e",
    glow: "from-emerald-500/5 to-transparent",
  },
  blue: {
    icon: "bg-blue-500/15 text-blue-400",
    spark: "#3b82f6",
    glow: "from-blue-500/5 to-transparent",
  },
  purple: {
    icon: "bg-violet-500/15 text-violet-400",
    spark: "#a855f7",
    glow: "from-violet-500/5 to-transparent",
  },
  orange: {
    icon: "bg-orange-500/15 text-orange-400",
    spark: "#f97316",
    glow: "from-orange-500/5 to-transparent",
  },
  pink: {
    icon: "bg-pink-500/15 text-pink-400",
    spark: "#ec4899",
    glow: "from-pink-500/5 to-transparent",
  },
};

type KpiCardProps = {
  data: KpiCardData;
};

export function KpiCard({ data }: KpiCardProps) {
  const Icon = iconMap[data.icon];
  const accent = accentMap[data.accent];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1222]/80 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-60 before:content-['']",
        accent.glow,
      )}
    >
      <div className="relative flex items-start justify-between gap-2">
        <div className={cn("rounded-xl p-2.5", accent.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <Sparkline data={data.trend.sparkline} color={accent.spark} />
      </div>
      <p className="relative mt-3 text-xs font-medium text-slate-400">{data.label}</p>
      <p className="relative mt-1 text-2xl font-bold tabular-nums tracking-tight text-white">
        {data.value}
      </p>
      <p
        className={cn(
          "relative mt-1 text-xs font-medium",
          data.trend.changePositive ? "text-emerald-400" : "text-rose-400",
        )}
      >
        {data.trend.change}
      </p>
    </article>
  );
}

type KpiCardRowProps = {
  kpis: KpiCardData[];
};

export function KpiCardRow({ kpis }: KpiCardRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} data={kpi} />
      ))}
    </div>
  );
}
