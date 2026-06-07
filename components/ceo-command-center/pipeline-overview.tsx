import { ChevronDown } from "lucide-react";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import type { PipelineStage } from "@/types/ceo-command-center";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type PipelineOverviewProps = {
  stages: PipelineStage[];
};

export function PipelineOverview({ stages }: PipelineOverviewProps) {
  if (stages.length === 0) {
    return (
      <CardShell title="Pipeline Overview">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-300">No pipeline data yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Pipeline stages will update when real leads move through the CRM.
          </p>
        </div>
      </CardShell>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <CardShell
      title="Pipeline Overview"
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
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.id} className="group">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">{stage.label}</span>
              <span className="tabular-nums text-slate-500">
                {stage.count}{" "}
                <span className="text-slate-400">{formatCurrency(stage.value)}</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 transition-all group-hover:brightness-110"
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
