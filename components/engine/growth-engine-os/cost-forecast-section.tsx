"use client";

import { TrendingUp } from "lucide-react";

import { useGrowthEngineOs } from "@/components/engine/growth-engine-os/growth-engine-os-provider";

export function CostForecastSection() {
  const { forecast } = useGrowthEngineOs();

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-card/80 p-6 shadow-lg">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-cyan-300" />
        <h2 className="text-lg font-semibold">Cost & resource forecast</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Estimated before launch — updates as you change budget and agents.</p>
      <ul className="mt-4 space-y-2">
        {forecast.lines.map((line) => (
          <li key={line.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{line.label}</span>
            <span className="font-medium tabular-nums">
              {line.amount}
              {line.detail ? <span className="ml-1 text-xs text-muted-foreground">({line.detail})</span> : null}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <ForecastStat label="Projected monthly" value={forecast.projectedMonthly} />
        <ForecastStat label="Projected leads" value={forecast.projectedLeads} />
        <ForecastStat label="Est. CPL" value={forecast.projectedCpl} />
        <ForecastStat label="Pipeline value" value={forecast.projectedPipeline} />
      </dl>
    </section>
  );
}

function ForecastStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-cyan-200">{value}</dd>
    </div>
  );
}
