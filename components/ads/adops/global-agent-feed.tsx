"use client";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { Button } from "@/components/ui/button";

export function GlobalAgentFeed() {
  const { payload } = useAdops();

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Live agent feed
      </h2>
      <ul className="space-y-2 max-h-64 overflow-y-auto rounded-xl border border-white/[0.08] p-3">
        {payload.globalFeed.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-violet-500/10 bg-violet-500/5 px-3 py-2 text-xs"
          >
            <div>
              <p>{a.message}</p>
              <p className="mt-0.5 text-muted-foreground">
                {a.timestamp} · {a.confidence}% · {a.riskScore} risk
              </p>
            </div>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px]">
                Review
              </Button>
              {a.rollbackAvailable ? (
                <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px]">
                  Rollback
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
