import type {
  CampaignAttributionRow,
  RevenueAttributionSnapshot,
  RevenueTimelineEvent,
  SourceAttributionRow,
} from "@/types/revenue-attribution";

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

export function sourcesToCsv(rows: SourceAttributionRow[]): string {
  return rowsToCsv(
    [
      "Source",
      "Platform",
      "Campaign",
      "Spend",
      "Visits",
      "Leads",
      "Qualified",
      "Appointments",
      "Closed deals",
      "Revenue",
      "Profit",
      "CPL",
      "CAC",
      "ROAS",
      "Conversion rate",
      "Pipeline value",
      "Attribution model",
    ],
    rows.map((r) => [
      r.sourceName,
      r.platform,
      r.campaign,
      r.spend,
      r.visits,
      r.leads,
      r.qualifiedLeads,
      r.appointments,
      r.closedDeals,
      r.revenue,
      r.profit,
      r.cpl,
      r.cac,
      r.roas,
      r.conversionRate,
      r.pipelineValue,
      r.attributionModel,
    ]),
  );
}

export function campaignsToCsv(rows: CampaignAttributionRow[]): string {
  return rowsToCsv(
    [
      "Campaign",
      "Source",
      "Platform",
      "Spend",
      "Visits",
      "Leads",
      "Qualified",
      "Appointments",
      "Closed deals",
      "Revenue",
      "Profit",
      "CPL",
      "CAC",
      "ROAS",
      "Status",
      "AI health",
      "Last AI action",
    ],
    rows.map((r) => [
      r.campaign,
      r.source,
      r.platform,
      r.spend,
      r.visits,
      r.leads,
      r.qualified,
      r.appointments,
      r.closedDeals,
      r.revenue,
      r.profit,
      r.cpl,
      r.cac,
      r.roas,
      r.status,
      r.aiHealth,
      r.lastAiAction,
    ]),
  );
}

export function timelineToCsv(rows: RevenueTimelineEvent[]): string {
  return rowsToCsv(
    ["Date", "Label", "Amount", "Source", "Lead", "Campaign", "Agent", "Close method"],
    rows.map((r) => [
      r.at,
      r.label,
      r.amount,
      r.source,
      r.leadName,
      r.campaign,
      r.agent,
      r.closeMethod,
    ]),
  );
}

export function summaryToCsv(snapshot: RevenueAttributionSnapshot): string {
  const s = snapshot.summary;
  return rowsToCsv(
    ["Metric", "Value"],
    [
      ["Money generated", s.revenueGenerated],
      ["Closed deals", s.closedDeals],
      ["Profit", s.profit],
      ["Total spend", s.totalSpend],
      ["Blended ROAS", s.blendedRoas],
      ["Pipeline value", s.pipelineValue],
      ["Attribution model", s.attributionModelLabel],
      ["Top sources", s.topSourcesLabel],
    ],
  );
}

export function triggerCsvDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
