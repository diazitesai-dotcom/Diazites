"use client";

import { AttributedCampaignsTable } from "@/components/revenue/attributed-campaigns-table";
import {
  RevenueAttributionProvider,
  useRevenueAttribution,
} from "@/components/revenue/revenue-attribution-context";
import { RevenueBreakdownDrawer } from "@/components/revenue/revenue-breakdown-drawer";
import { RevenueRecommendations } from "@/components/revenue/revenue-recommendations";
import { RevenueSourcesWidget } from "@/components/revenue/revenue-sources-widget";
import { RevenueTimeline } from "@/components/revenue/revenue-timeline";
import { AgentRevenueCards } from "@/components/revenue/agent-revenue-cards";
import { Button } from "@/components/ui/button";
import { ExportRevenueCsvMenu } from "@/components/revenue/export-revenue-csv-menu";
import type { RevenueAttributionSnapshot } from "@/types/revenue-attribution";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function RevenueIntelligenceInner() {
  const { attribution, openDrawer } = useRevenueAttribution();
  const { summary, bySource, totals } = attribution;

  const paidRevenue = bySource.filter((s) => s.spend > 0).reduce((a, s) => a + s.revenue, 0);
  const organicRevenue = bySource.filter((s) => s.isOrganic).reduce((a, s) => a + s.revenue, 0);
  const agentRevenue = bySource
    .filter((s) => s.platform === "ai_follow_up" || s.platform === "retargeting")
    .reduce((a, s) => a + s.revenue, 0);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Revenue attribution</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Which campaigns made money, which sources have the best return on ad spend, and what AI
            helped recover — using {summary.attributionModelLabel.toLowerCase()}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportRevenueCsvMenu attribution={attribution} />
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => openDrawer()}>
            View revenue journey
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Money generated</p>
          <p className="mt-1 text-2xl font-bold text-emerald-200">{formatMoney(summary.revenueGenerated)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.closedDeals} closed deals</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total profit</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(summary.profit)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ad spend</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(summary.totalSpend)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Potential sales (pipeline)
          </p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(totals.pipelineValue)}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/[0.08] px-4 py-3 text-sm">
          <p className="font-medium">Paid revenue</p>
          <p className="text-lg font-bold text-emerald-300/90">{formatMoney(paidRevenue)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] px-4 py-3 text-sm">
          <p className="font-medium">Organic revenue</p>
          <p className="text-lg font-bold text-cyan-300/90">{formatMoney(organicRevenue)}</p>
          <p className="text-[10px] text-muted-foreground">No ad spend</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] px-4 py-3 text-sm">
          <p className="font-medium">AI-influenced revenue</p>
          <p className="text-lg font-bold text-violet-300/90">{formatMoney(agentRevenue)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueSourcesWidget />
        <RevenueTimeline />
      </div>

      <AgentRevenueCards />
      <AttributedCampaignsTable campaigns={attribution.campaigns} />
      <RevenueRecommendations />
    </section>
  );
}

export function RevenueIntelligenceSection({
  attribution,
}: {
  attribution: RevenueAttributionSnapshot;
}) {
  return (
    <RevenueAttributionProvider attribution={attribution}>
      <RevenueBreakdownDrawer />
      <RevenueIntelligenceInner />
    </RevenueAttributionProvider>
  );
}
