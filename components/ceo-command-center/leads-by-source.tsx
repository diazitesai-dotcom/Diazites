import { ChevronDown } from "lucide-react";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import type { LeadSource } from "@/types/ceo-command-center";

type LeadsBySourceProps = {
  sources: LeadSource[];
  total: number;
};

export function LeadsBySource({ sources, total }: LeadsBySourceProps) {
  let cumulative = 0;
  const segments = sources.map((source) => {
    const start = cumulative;
    cumulative += source.percent;
    return { ...source, start, end: cumulative };
  });

  const gradientStops = segments
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ");

  return (
    <CardShell
      title="Leads by Source"
      action={
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400"
        >
          This Month
          <ChevronDown className="h-3 w-3" />
        </button>
      }
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-36 w-36 shrink-0">
          <div
            className="h-full w-full rounded-full"
            style={{
              background: `conic-gradient(${gradientStops})`,
            }}
          />
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#0c1222]">
            <span className="text-2xl font-bold tabular-nums text-white">{total}</span>
            <span className="text-[10px] text-slate-500">Total</span>
          </div>
        </div>

        <ul className="flex-1 space-y-2.5">
          {sources.map((source) => (
            <li key={source.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-slate-300">{source.label}</span>
              </div>
              <span className="tabular-nums text-slate-500">
                {source.count}{" "}
                <span className="text-slate-400">{source.percent}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </CardShell>
  );
}
