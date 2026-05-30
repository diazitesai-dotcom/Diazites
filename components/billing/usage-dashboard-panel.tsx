"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UsageDashboardRow } from "@/services/billing/usage-metering.service";

export function UsageDashboardPanel({
  planName,
  rows,
  estimatedOverage,
}: {
  planName: string;
  rows: UsageDashboardRow[];
  estimatedOverage: number;
}) {
  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle>Usage & overages</CardTitle>
        <CardDescription>
          Current plan: {planName} · Included usage vs. used this billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Usage syncs as you use the platform.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.metricKey}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
            >
              <span>{row.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {row.used} {row.unit}
                {row.included != null ? ` / ${row.included}` : " · unlimited"}
                {row.overage > 0 ? (
                  <span className="ml-2 text-amber-400">+{row.overage} overage</span>
                ) : null}
              </span>
            </div>
          ))
        )}
        {estimatedOverage > 0 ? (
          <p className="text-xs text-amber-300">
            Estimated overage units this period: {estimatedOverage}. Upgrade to Growth or Pro for
            higher limits.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
