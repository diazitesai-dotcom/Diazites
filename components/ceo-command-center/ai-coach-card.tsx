import Link from "next/link";
import { Bot } from "lucide-react";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import type { AiCoachData } from "@/types/ceo-command-center";

type AiCoachCardProps = {
  data: AiCoachData;
};

export function AiCoachCard({ data }: AiCoachCardProps) {
  return (
    <CardShell
      title="AI Business Coach"
      action={
        <div className="rounded-lg bg-violet-500/15 p-2">
          <Bot className="h-4 w-4 text-violet-300" />
        </div>
      }
      glow="pink"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-white">{data.greeting}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-400">
            {data.summary}
          </p>
        </div>

        <div className="rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-orange-500/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-pink-300/80">
            Top Priority
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{data.topPriority.title}</p>
          <p className="mt-1 text-xs text-emerald-400">
            Potential Revenue: {data.topPriority.potentialRevenue}
          </p>
          <Link
            href={data.topPriority.ctaHref}
            className="mt-3 inline-flex rounded-lg bg-pink-500/20 px-3 py-1.5 text-xs font-medium text-pink-100 transition hover:bg-pink-500/30"
          >
            {data.topPriority.ctaLabel}
          </Link>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Recommendations</p>
          {data.recommendations.length === 0 ? (
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-3 text-xs text-slate-400">
              No AI recommendations yet. Recommendations will appear after real activity is
              recorded.
            </div>
          ) : (
          <ul className="space-y-2">
            {data.recommendations.map((rec) => (
              <li
                key={rec.id}
                className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-slate-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                {rec.text}
              </li>
            ))}
          </ul>
          )}
        </div>

        <button
          type="button"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]"
        >
          View All Recommendations
        </button>
      </div>
    </CardShell>
  );
}
