import Link from "next/link";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import { CircularProgress } from "@/components/ceo-command-center/shared/circular-progress";
import type { HealthScoreData } from "@/types/ceo-command-center";

type HealthScoreCardProps = {
  data: HealthScoreData;
};

export function HealthScoreCard({ data }: HealthScoreCardProps) {
  return (
    <CardShell title="Business Health Score" glow="purple">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <CircularProgress
          value={data.score}
          max={data.maxScore}
          size={160}
          strokeWidth={12}
          label={`${data.score}`}
          sublabel={`/${data.maxScore}`}
          gradientId="health-score-gradient"
        />
        <div className="flex-1 space-y-4">
          <p className="text-sm text-slate-300">{data.message}</p>
          <div className="space-y-3">
            {data.breakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-medium tabular-nums text-white">{item.score}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/analytics"
            className="inline-flex rounded-lg bg-violet-600/20 px-4 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-600/30"
          >
            View Full Health Report
          </Link>
        </div>
      </div>
    </CardShell>
  );
}
