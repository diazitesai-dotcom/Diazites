import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import type { AiRecommendation } from "@/lib/dashboard/mission-control-types";

export function hasPaidAdsConnected(data: DashboardOverviewData): boolean {
  return data.connections.some(
    (c) => (c.id === "meta" || c.id === "google") && c.status === "connected",
  );
}

/** Narrative only — no priority CTA wording, no alert copy. */
export function buildExecutiveNarrative(data: DashboardOverviewData): string {
  const m = data.metrics;
  const leads = m?.totalLeads ?? 0;
  const velocity7d = data.sparkSeries.reduce((s, p) => s + p.v, 0);
  const hasAds = hasPaidAdsConnected(data);
  const activeCampaigns = m?.activeCampaigns ?? 0;

  const sentences: string[] = [];

  if (leads === 0 && velocity7d === 0) {
    sentences.push("No inbound demand in the current window.");
  } else if (leads > 0) {
    const source =
      velocity7d > leads && !hasAds
        ? "mostly organic traffic"
        : hasAds
          ? "paid and organic channels"
          : "your funnel";
    sentences.push(
      `You captured ${leads} lead${leads === 1 ? "" : "s"} from ${source}.`,
    );
  } else if (velocity7d > 0) {
    sentences.push("Traffic is arriving but conversion to leads is still thin.");
  }

  if (!hasAds) {
    sentences.push("Paid ads are not connected — scale is capped until Meta or Google is linked.");
  } else if (activeCampaigns === 0) {
    sentences.push("Ad accounts are linked but no campaigns are live.");
  }

  const topOpp = data.opportunities[0];
  if (topOpp && !sentences.some((s) => s.toLowerCase().includes(topOpp.title.toLowerCase().slice(0, 12)))) {
    sentences.push(`Largest upside: ${topOpp.title}.`);
  }

  return sentences.slice(0, 3).join(" ");
}

/** Drop recs that repeat alerts, priority action, or connection CTAs. */
export function filterMissionRecommendations(
  data: DashboardOverviewData,
): AiRecommendation[] {
  const hasAds = hasPaidAdsConnected(data);
  const priorityTitle = data.nextAction.title.toLowerCase();

  return data.recommendations.filter((rec) => {
    const title = rec.title.toLowerCase();
    if (title === priorityTitle) return false;
    if (!hasAds && /connect.*(meta|google)|link.*ad account/i.test(title)) return false;
    if (/retargeting/i.test(title) && /retargeting/i.test(priorityTitle)) return false;
    return true;
  });
}
