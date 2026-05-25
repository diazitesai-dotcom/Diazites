"use client";

import { ExportRevenueCsvMenu } from "@/components/revenue/export-revenue-csv-menu";
import { useRevenueAttributionOptional } from "@/components/revenue/revenue-attribution-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CampaignAttributionRow } from "@/types/revenue-attribution";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const HEALTH_STYLE = {
  healthy: "border-emerald-500/40 text-emerald-300",
  warning: "border-amber-500/40 text-amber-300",
  critical: "border-rose-500/40 text-rose-300",
  idle: "border-white/10 text-muted-foreground",
} as const;

export function AttributedCampaignsTable({ campaigns }: { campaigns: CampaignAttributionRow[] }) {
  const ctx = useRevenueAttributionOptional();

  if (campaigns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No attributed campaigns yet — connect ads or close deals to trace revenue to campaigns.
      </p>
    );
  }

  return (
    <Card className="overflow-hidden border-white/[0.06]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/60">
        <div>
          <CardTitle className="text-lg">Campaign revenue attribution</CardTitle>
          <p className="text-xs text-muted-foreground">
            Spend, funnel metrics, closed deals, profit, and return on ad spend per campaign
          </p>
        </div>
        {ctx ? <ExportRevenueCsvMenu attribution={ctx.attribution} variant="ghost" /> : null}
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead>Campaign</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Qualified</TableHead>
              <TableHead>Appts</TableHead>
              <TableHead>Closed</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>CPL</TableHead>
              <TableHead>ROAS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>AI health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id} className="border-border/60">
                <TableCell className="font-medium">{c.campaign}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.source}</TableCell>
                <TableCell>{formatMoney(c.spend)}</TableCell>
                <TableCell>{c.leads}</TableCell>
                <TableCell>{c.qualified}</TableCell>
                <TableCell>{c.appointments}</TableCell>
                <TableCell>{c.closedDeals}</TableCell>
                <TableCell className="font-semibold text-emerald-300/90">
                  {formatMoney(c.revenue)}
                </TableCell>
                <TableCell>{formatMoney(c.profit)}</TableCell>
                <TableCell>{c.cpl != null ? formatMoney(c.cpl) : "—"}</TableCell>
                <TableCell>{c.roas != null ? `${c.roas}×` : "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.status}</Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase",
                      HEALTH_STYLE[c.aiHealth],
                    )}
                  >
                    {c.aiHealth}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
