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

      <div className="mission-metric-grid">
        <div className="mission-metric-tile min-w-0 border-emerald-500/25 bg-emerald-500/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Money generated</p>
          <p className="mt-1.5 break-words text-xl font-bold tabular-nums text-emerald-200 sm:text-2xl">
            {formatMoney(summary.revenueGenerated)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.closedDeals} closed deals</p>
        </div>
        <div className="mission-metric-tile min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total profit</p>
          <p className="mt-1.5 break-words text-xl font-bold tabular-nums sm:text-2xl">{formatMoney(summary.profit)}</p>
        </div>
        <div className="mission-metric-tile min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ad spend</p>
          <p className="mt-1.5 break-words text-xl font-bold tabular-nums sm:text-2xl">{formatMoney(summary.totalSpend)}</p>
        </div>
        <div className="mission-metric-tile min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Potential sales
          </p>
          <p
            className="mt-1.5 break-words text-xl font-bold tabular-nums sm:text-2xl"
            title="Pipeline value from leads not closed yet"
          >
            {formatMoney(totals.pipelineValue)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Not closed revenue yet</p>
        </div>
      </div>

      <div className="mission-metric-grid sm:grid-cols-3">
        <div className="mission-metric-tile min-w-0 text-sm">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Paid revenue</p>
          <p className="mt-1.5 break-words text-lg font-bold tabular-nums text-emerald-300/90">
            {formatMoney(paidRevenue)}
          </p>
        </div>
        <div className="mission-metric-tile min-w-0 text-sm">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Organic revenue</p>
          <p className="mt-1.5 break-words text-lg font-bold tabular-nums text-cyan-300/90">
            {formatMoney(organicRevenue)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">No ad spend</p>
        </div>
        <div className="mission-metric-tile min-w-0 text-sm">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">AI-influenced</p>
          <p className="mt-1.5 break-words text-lg font-bold tabular-nums text-violet-300/90">
            {formatMoney(agentRevenue)}
          </p>
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
