"use client";

import { useAdops } from "@/components/ads/adops/adops-provider";
import type { CampaignDisplayStatus, PlatformHealth } from "@/lib/ads/adops-types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<CampaignDisplayStatus, string> = {
  live: "bg-emerald-500/15 text-emerald-300",
  running: "bg-cyan-500/15 text-cyan-300",
  paused: "bg-slate-500/15 text-slate-300",
  failed: "bg-rose-500/15 text-rose-300",
  processing: "bg-amber-500/15 text-amber-300",
  requires_approval: "bg-violet-500/15 text-violet-300",
  degraded: "bg-orange-500/15 text-orange-300",
  failed_tracking: "bg-rose-500/15 text-rose-300",
};

const AI_HEALTH: Record<PlatformHealth, string> = {
  healthy: "text-emerald-400",
  sync_delayed: "text-amber-400",
  token_expiring: "text-amber-400",
  oauth_failed: "text-rose-400",
  permission_issue: "text-rose-400",
  api_error: "text-rose-400",
  needs_attention: "text-violet-400",
  disconnected: "text-muted-foreground",
  failed_tracking: "text-rose-400",
};

export function LiveCampaignsCenter() {
  const { payload, setSelectedCampaign, search, filter } = useAdops();

  let rows = payload.liveCampaigns;
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.platformLabel.toLowerCase().includes(q),
    );
  }
  if (filter === "campaigns" || filter === "approvals") {
    rows = rows.filter((c) =>
      filter === "approvals" ? c.status === "requires_approval" : true,
    );
  }
  if (filter === "tracking") {
    rows = rows.filter((c) => c.aiHealth === "failed_tracking" || c.aiHealth === "api_error");
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Live campaigns
        </h2>
        <span className="text-xs text-muted-foreground">{rows.length} active rows</span>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.1] px-6 py-10 text-center text-sm text-muted-foreground">
          No campaigns match filters. Connect a platform or run the Growth Engine to deploy.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-card/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead className="bg-muted/25 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Campaign</th>
                  <th className="px-3 py-2 font-medium">Platform</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Spend</th>
                  <th className="px-3 py-2 text-right font-medium">Leads</th>
                  <th className="px-3 py-2 text-right font-medium">CPL</th>
                  <th className="px-3 py-2 text-right font-medium">CTR</th>
                  <th className="px-3 py-2 text-right font-medium">Conv.</th>
                  <th className="px-3 py-2 text-right font-medium">ROAS</th>
                  <th className="px-3 py-2 text-right font-medium">Budget</th>
                  <th className="px-3 py-2 font-medium">AI health</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-t border-white/[0.04] transition-colors hover:bg-violet-500/10"
                    onClick={() => setSelectedCampaign(c)}
                  >
                    <td className="px-3 py-2.5 font-medium">{c.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.platformLabel}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          STATUS_STYLE[c.status],
                        )}
                      >
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">${c.spend.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{c.leads}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {c.cpl != null ? `$${c.cpl.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{c.ctr}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{c.conversionRate}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {c.roas != null ? `${c.roas}×` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">${c.budget}</td>
                    <td className={cn("px-3 py-2.5 capitalize", AI_HEALTH[c.aiHealth])}>
                      {c.aiHealth.replace(/_/g, " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
