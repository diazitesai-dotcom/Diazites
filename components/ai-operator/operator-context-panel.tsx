"use client";

import type { OperatorPlatformContext } from "@/types/ai-operator";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function OperatorContextPanel({ ctx }: { ctx: OperatorPlatformContext | null }) {
  if (!ctx) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-xs text-muted-foreground">
        Loading live context…
      </div>
    );
  }

  const riskColor =
    ctx.riskLevel === "low"
      ? "text-emerald-300"
      : ctx.riskLevel === "medium"
        ? "text-amber-300"
        : "text-rose-300";

  return (
    <div className="space-y-2 rounded-xl border border-white/[0.08] bg-gradient-to-b from-violet-950/20 to-transparent p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300/90">Live context</p>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
        <div>
          <dt className="text-muted-foreground">Health</dt>
          <dd className="font-semibold tabular-nums">{ctx.healthScore}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Risk</dt>
          <dd className={cn("font-semibold uppercase", riskColor)}>{ctx.riskLevel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Revenue</dt>
          <dd className="font-semibold tabular-nums text-emerald-300/90">{formatMoney(ctx.revenue)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pipeline</dt>
          <dd className="font-semibold tabular-nums">{formatMoney(ctx.pipeline)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Leads (7d)</dt>
          <dd className="font-semibold tabular-nums">{ctx.leadVelocity7d}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Approvals</dt>
          <dd className="font-semibold tabular-nums">{ctx.pendingApprovals}</dd>
        </div>
      </dl>
      <p className="text-[10px] leading-snug text-muted-foreground">
        {ctx.activeAgents}/{ctx.totalAgents} agents · {ctx.activeCampaigns} campaigns
      </p>
      {ctx.agentIssues[0] ? (
        <p className="line-clamp-2 text-[10px] text-amber-200/80">{ctx.agentIssues[0]}</p>
      ) : null}
    </div>
  );
}
