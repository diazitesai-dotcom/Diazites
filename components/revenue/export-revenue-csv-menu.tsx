"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  campaignsToCsv,
  sourcesToCsv,
  summaryToCsv,
  timelineToCsv,
  triggerCsvDownload,
} from "@/lib/revenue/export-attribution-csv";
import type { RevenueAttributionSnapshot } from "@/types/revenue-attribution";

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

type ExportKind = "summary" | "sources" | "campaigns" | "timeline" | "all";

export function ExportRevenueCsvMenu({
  attribution,
  variant = "outline",
}: {
  attribution: RevenueAttributionSnapshot;
  variant?: "outline" | "ghost" | "default";
}) {
  const date = stamp();

  function runExport(kind: ExportKind) {
    if (kind === "summary" || kind === "all") {
      triggerCsvDownload(`revenue-summary-${date}.csv`, summaryToCsv(attribution));
    }
    if (kind === "sources" || kind === "all") {
      triggerCsvDownload(`revenue-by-source-${date}.csv`, sourcesToCsv(attribution.bySource));
    }
    if (kind === "campaigns" || kind === "all") {
      triggerCsvDownload(
        `revenue-by-campaign-${date}.csv`,
        campaignsToCsv(attribution.campaigns),
      );
    }
    if (kind === "timeline" || kind === "all") {
      triggerCsvDownload(`revenue-timeline-${date}.csv`, timelineToCsv(attribution.timeline));
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={variant}
        size="sm"
        className="rounded-xl gap-1.5"
        onClick={() => runExport("all")}
      >
        <Download className="size-3.5" />
        Export all
      </Button>
      <select
        aria-label="Export revenue CSV"
        className="h-8 rounded-lg border border-white/10 bg-background px-2 text-xs"
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value as ExportKind;
          if (v) runExport(v);
          e.target.value = "";
        }}
      >
        <option value="" disabled>
          More exports…
        </option>
        <option value="summary">Summary</option>
        <option value="sources">By source</option>
        <option value="campaigns">By campaign</option>
        <option value="timeline">Timeline</option>
      </select>
    </div>
  );
}
