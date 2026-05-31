import {
  ATTRIBUTION_MODEL_LABELS,
  agentRoi,
  conversionRate,
  cac,
  cpl,
  profit,
  roas,
} from "@/lib/revenue/attribution-math";
import {
  REVENUE_SOURCE_CATALOG,
  mapCampaignPlatform,
  mapLeadSourceToCatalogId,
} from "@/lib/revenue/source-catalog";
import type {
  AgentRevenueContribution,
  AttributionModel,
  CampaignAttributionRow,
  RevenueAttributionSnapshot,
  RevenueCloseMethod,
  RevenueJourney,
  RevenueRecommendation,
  RevenueSummaryCard,
  RevenueTimelineEvent,
  SourceAttributionRow,
} from "@/types/revenue-attribution";
import { AGENTS } from "@/utils/constants";

export type LeadAttributionInput = {
  id: string;
  name: string;
  status: string;
  source: string | null;
  campaignId: string | null;
  campaignLabel: string | null;
  budget: string | null;
  createdAt: string | null;
};

export type CampaignAttributionInput = {
  id: string;
  name: string;
  platform: string;
  spend: number;
  budget: number;
  leadsCount: number;
  status: string | null;
};

export type ManualRevenueEntry = {
  id: string;
  leadId: string | null;
  leadName: string | null;
  sourceKey: string;
  campaign: string | null;
  amount: number;
  closeMethod: RevenueCloseMethod;
  closedAt: string;
  attributionType: AttributionModel;
  notes: string | null;
  agentKey: string | null;
};

export type BuildRevenueAttributionInput = {
  leads: LeadAttributionInput[];
  campaigns: CampaignAttributionInput[];
  manualEntries: ManualRevenueEntry[];
  totalSpendFromMetrics: number;
  visitorEstimate: number;
  attributionModel?: AttributionModel;
  activeAgents?: string[];
};

function estimateDealValue(lead: LeadAttributionInput): number {
  const b = lead.budget?.replace(/[^\d.]/g, "");
  const parsed = b ? Number.parseFloat(b) : NaN;
  if (!Number.isNaN(parsed) && parsed > 0) return Math.round(parsed);
  if (lead.status === "won") return 150;
  if (lead.status === "booked") return 80;
  return 0;
}

function emptyBucket(id: string) {
  const def = REVENUE_SOURCE_CATALOG.find((s) => s.id === id) ?? REVENUE_SOURCE_CATALOG[6];
  return {
    def,
    spend: 0,
    visits: 0,
    leads: 0,
    qualified: 0,
    appointments: 0,
    closed: 0,
    revenue: 0,
    pipeline: 0,
    aiCost: 0,
    campaign: null as string | null,
  };
}

export function buildRevenueAttribution(
  input: BuildRevenueAttributionInput,
): RevenueAttributionSnapshot {
  const model = input.attributionModel ?? "ai_assisted";
  const buckets = new Map<string, ReturnType<typeof emptyBucket>>();

  for (const def of REVENUE_SOURCE_CATALOG) {
    buckets.set(def.id, emptyBucket(def.id));
  }

  for (const c of input.campaigns) {
    const platform = mapCampaignPlatform(c.platform);
    const catalogId =
      platform === "meta"
        ? "meta_ads"
        : platform === "google"
          ? "google_ads"
          : platform === "tiktok"
            ? "tiktok_ads"
            : platform === "bing"
              ? "bing_ads"
              : platform === "linkedin"
                ? "linkedin_ads"
                : platform === "youtube"
                  ? "youtube_ads"
                  : "meta_ads";
    const b = buckets.get(catalogId)!;
    b.spend += Number(c.spend ?? c.budget ?? 0);
    b.leads += c.leadsCount ?? 0;
    b.campaign = c.name;
  }

  if (input.totalSpendFromMetrics > 0) {
    const paidSpend = [...buckets.values()].reduce((s, b) => (b.def.paid ? s + b.spend : s), 0);
    if (paidSpend < input.totalSpendFromMetrics * 0.5) {
      const meta = buckets.get("meta_ads")!;
      meta.spend += Math.round(input.totalSpendFromMetrics * 0.45);
      const google = buckets.get("google_ads")!;
      google.spend += Math.round(input.totalSpendFromMetrics * 0.35);
      const ret = buckets.get("retargeting")!;
      ret.spend += Math.round(input.totalSpendFromMetrics * 0.2);
    }
  }

  for (const lead of input.leads) {
    const catalogId = mapLeadSourceToCatalogId(lead.source);
    const b = buckets.get(catalogId) ?? buckets.get("organic")!;
    b.leads += 1;
    if (lead.status === "qualified") b.qualified += 1;
    if (lead.status === "booked") {
      b.appointments += 1;
      b.pipeline += estimateDealValue(lead);
    }
    if (lead.status === "won") {
      b.closed += 1;
      b.revenue += estimateDealValue(lead);
    } else if (lead.status === "qualified" || lead.status === "contacted") {
      b.pipeline += Math.round(estimateDealValue(lead) * 0.4);
    }
    if (lead.campaignLabel && !b.campaign) b.campaign = lead.campaignLabel;
  }

  for (const entry of input.manualEntries) {
    const b = buckets.get(entry.sourceKey) ?? buckets.get("manual_sales")!;
    b.revenue += entry.amount;
    b.closed += 1;
    if (entry.campaign) b.campaign = entry.campaign;
  }

  const organic = buckets.get("organic")!;
  organic.visits = Math.max(
    Math.round(input.visitorEstimate * 0.55),
    organic.leads * 12,
    input.leads.length > 0 ? 40 : 0,
  );
  const direct = buckets.get("direct")!;
  direct.visits = Math.max(Math.round(input.visitorEstimate * 0.2), direct.leads * 8);
  const referral = buckets.get("referral")!;
  referral.visits = Math.max(Math.round(input.visitorEstimate * 0.1), referral.leads * 6);

  for (const [id, b] of buckets) {
    if (b.def.paid && b.leads > 0 && b.visits === 0) {
      b.visits = Math.max(b.leads * 3, 10);
    }
  }

  const followUp = buckets.get("ai_follow_up")!;
  followUp.aiCost = input.activeAgents?.includes("ai_follow_up") ? 8 + followUp.leads * 2 : 0;
  if (followUp.leads > 0 && followUp.revenue === 0 && followUp.closed > 0) {
    followUp.revenue = followUp.closed * 120;
  }

  const retargeting = buckets.get("retargeting")!;
  if (retargeting.spend === 0 && retargeting.closed > 0) {
    retargeting.spend = 35;
    retargeting.revenue = retargeting.closed * 300;
  }

  const bySource: SourceAttributionRow[] = [...buckets.entries()]
    .map(([id, b]) => {
      const rev = Math.round(b.revenue);
      const spend = Math.round(b.spend + b.aiCost);
      const prof = profit(rev, b.spend, b.aiCost);
      return {
        id,
        sourceName: b.def.name,
        platform: b.def.platform,
        campaign: b.campaign,
        spend: Math.round(b.spend),
        visits: b.visits,
        leads: b.leads,
        qualifiedLeads: b.qualified,
        appointments: b.appointments,
        closedDeals: b.closed,
        revenue: rev,
        profit: prof,
        cpl: cpl(b.spend, b.leads),
        cac: cac(b.spend + b.aiCost, b.closed),
        roas: b.def.paid || b.spend > 0 ? roas(rev, spend) : null,
        conversionRate: conversionRate(b.closed, b.leads),
        pipelineValue: Math.round(b.pipeline),
        attributionModel: model,
        isOrganic: !b.def.paid && b.spend === 0,
        aiCost: b.aiCost,
        labelNote: !b.def.paid && b.spend === 0 ? "Organic revenue / no ad spend" : undefined,
      };
    })
    .filter((r) => r.leads > 0 || r.revenue > 0 || r.spend > 0 || r.visits > 0)
    .sort((a, b) => b.revenue - a.revenue);

  if (bySource.length === 0) {
    bySource.push({
      id: "organic",
      sourceName: "Organic Traffic",
      platform: "organic",
      campaign: null,
      spend: 0,
      visits: 40,
      leads: 0,
      qualifiedLeads: 0,
      appointments: 0,
      closedDeals: 0,
      revenue: 0,
      profit: 0,
      cpl: null,
      cac: null,
      roas: null,
      conversionRate: null,
      pipelineValue: 0,
      attributionModel: model,
      isOrganic: true,
      aiCost: 0,
      labelNote: "Organic revenue / no ad spend",
    });
  }

  const totalRevenue = bySource.reduce((s, r) => s + r.revenue, 0);
  const totalSpend = bySource.reduce((s, r) => s + r.spend + r.aiCost, 0);
  const totalProfit = profit(totalRevenue, totalSpend);
  const closedDeals = bySource.reduce((s, r) => s + r.closedDeals, 0);
  const pipelineValue = bySource.reduce((s, r) => s + r.pipelineValue, 0);

  const topSources = bySource
    .filter((s) => s.revenue > 0)
    .slice(0, 2)
    .map((s) => s.sourceName);
  const topSourcesLabel =
    topSources.length > 0 ? topSources.join(" + ") : "Awaiting first closed deal";

  const summary: RevenueSummaryCard = {
    revenueGenerated: totalRevenue,
    closedDeals,
    topSourcesLabel,
    trackedViaLabel: "CRM · manual close · Stripe · Shopify · agent actions",
    profit: totalProfit,
    totalSpend,
    blendedRoas: roas(totalRevenue, totalSpend),
    pipelineValue,
    attributionModel: model,
    attributionModelLabel: ATTRIBUTION_MODEL_LABELS[model] ?? model,
  };

  const campaignRows: CampaignAttributionRow[] = input.campaigns.map((c) => {
    const platform = mapCampaignPlatform(c.platform);
    const catalogId = mapLeadSourceToCatalogId(c.platform);
    const src = bySource.find((s) => s.id === catalogId);
    const rev = src?.revenue ?? 0;
    const spend = Number(c.spend ?? c.budget ?? 0);
    const leads = c.leadsCount ?? 0;
    const closed = src?.closedDeals ?? 0;
    return {
      id: c.id,
      campaign: c.name,
      source: REVENUE_SOURCE_CATALOG.find((x) => x.id === catalogId)?.name ?? c.platform,
      platform,
      spend,
      visits: Math.max(leads * 3, 10),
      leads,
      qualified: Math.round(leads * 0.4),
      appointments: Math.round(leads * 0.2),
      closedDeals: closed,
      revenue: rev,
      profit: profit(rev, spend),
      cpl: cpl(spend, leads),
      cac: cac(spend, closed),
      roas: roas(rev, spend),
      status: c.status ?? "active",
      aiHealth: spend > 0 && rev === 0 && leads > 3 ? "warning" : rev > spend ? "healthy" : "idle",
      lastAiAction:
        rev > spend ? "Optimized bids · scaled winners" : leads > 0 ? "Monitoring CPL" : "Awaiting data",
    };
  });

  if (campaignRows.length === 0 && bySource.some((s) => s.campaign)) {
    for (const s of bySource.filter((x) => x.campaign && x.revenue > 0).slice(0, 3)) {
      campaignRows.push({
        id: `src-${s.id}`,
        campaign: s.campaign ?? s.sourceName,
        source: s.sourceName,
        platform: s.platform,
        spend: s.spend,
        visits: s.visits,
        leads: s.leads,
        qualified: s.qualifiedLeads,
        appointments: s.appointments,
        closedDeals: s.closedDeals,
        revenue: s.revenue,
        profit: s.profit,
        cpl: s.cpl,
        cac: s.cac,
        roas: s.roas,
        status: "active",
        aiHealth: "healthy",
        lastAiAction: "Attributed revenue from closed leads",
      });
    }
  }

  const journeys: RevenueJourney[] = bySource
    .filter((s) => s.leads > 0 || s.revenue > 0)
    .slice(0, 6)
    .map((s) => ({
      id: `journey-${s.id}`,
      title: s.campaign ? `${s.campaign}` : s.sourceName,
      source: s.sourceName,
      platform: s.platform,
      spend: s.spend + s.aiCost,
      steps: [
        { label: "Visitors", count: s.visits },
        { label: "Leads", count: s.leads },
        { label: "Qualified", count: s.qualifiedLeads },
        { label: "Appointments", count: s.appointments },
        { label: "Closed deals", count: s.closedDeals },
        { label: "Revenue", count: s.revenue },
      ],
      touchpoints: [
        s.campaign ? `Campaign: ${s.campaign}` : `Source: ${s.sourceName}`,
        s.isOrganic ? "Organic landing page" : "Paid ad click",
        "CRM pipeline update",
      ],
      aiActions:
        s.id === "ai_follow_up"
          ? ["Email nurture", "Hot lead alert"]
          : s.id === "retargeting"
            ? ["Audience sync", "Creative rotation"]
            : ["Lead scoring", "Follow-up draft"],
      closeMethod: s.isOrganic ? "Organic form → CRM won" : "Paid lead → CRM / manual close",
      revenue: s.revenue,
      profit: s.profit,
      roas: s.roas,
    }));

  const timeline: RevenueTimelineEvent[] = [
    ...input.manualEntries.map((e) => ({
      id: e.id,
      at: e.closedAt,
      label: e.notes ?? "Revenue recorded",
      amount: e.amount,
      source: REVENUE_SOURCE_CATALOG.find((s) => s.id === e.sourceKey)?.name ?? e.sourceKey,
      leadName: e.leadName,
      campaign: e.campaign,
      agent: e.agentKey
        ? AGENTS.find((a) => a.key === e.agentKey)?.name ?? e.agentKey
        : null,
      closeMethod: e.closeMethod,
    })),
    ...input.leads
      .filter((l) => l.status === "won")
      .map((l) => ({
        id: `lead-${l.id}`,
        at: l.createdAt ?? new Date().toISOString(),
        label: "Deal closed",
        amount: estimateDealValue(l),
        source:
          REVENUE_SOURCE_CATALOG.find((s) => s.id === mapLeadSourceToCatalogId(l.source))?.name ??
          "CRM",
        leadName: l.name,
        campaign: l.campaignLabel,
        agent:
          mapLeadSourceToCatalogId(l.source) === "ai_follow_up" ? "AI Follow-Up Agent" : null,
        closeMethod: "crm_won" as RevenueCloseMethod,
      })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);

  const agentContributions: AgentRevenueContribution[] = [
    {
      agentKey: "ai_follow_up",
      agentName: "AI Follow-Up Agent",
      cost: followUp.aiCost || 8,
      revenueInfluenced: buckets.get("ai_follow_up")?.revenue ?? 0,
      recoveredLeads: followUp.closed,
      dealsAssisted: followUp.appointments,
      closedDeals: followUp.closed,
      roi: agentRoi(buckets.get("ai_follow_up")?.revenue ?? 0, followUp.aiCost || 8),
      roas: null,
      highlight: "Money AI helped recover or influence",
      actions: ["Sent follow-up sequence", "Recovered stale leads", "Booking reminders"],
    },
    {
      agentKey: "lead_qualification",
      agentName: "Lead Qualification Agent",
      cost: 4,
      revenueInfluenced:
        (buckets.get("organic")?.revenue ?? 0) + (buckets.get("google_ads")?.revenue ?? 0),
      recoveredLeads: 0,
      dealsAssisted: input.leads.filter((l) => l.status === "qualified").length,
      closedDeals: input.leads.filter((l) => l.status === "won").length,
      roi: null,
      roas: null,
      highlight: `Qualified ${input.leads.filter((l) => l.status === "qualified").length} leads`,
      actions: ["Scored inbound leads", "Routed hot leads to CRM"],
    },
    {
      agentKey: "retargeting",
      agentName: "Retargeting Agent",
      cost: retargeting.spend,
      revenueInfluenced: retargeting.revenue,
      recoveredLeads: retargeting.leads,
      dealsAssisted: retargeting.closed,
      closedDeals: retargeting.closed,
      roi: null,
      roas: roas(retargeting.revenue, retargeting.spend),
      highlight: "Recovered warm visitors",
      actions: ["Synced audiences", "Budget shift recommendation"],
    },
    {
      agentKey: "search_ads",
      agentName: "Search Ads Agent",
      cost: buckets.get("google_ads")?.spend ?? 0,
      revenueInfluenced: buckets.get("google_ads")?.revenue ?? 0,
      recoveredLeads: 0,
      dealsAssisted: buckets.get("google_ads")?.leads ?? 0,
      closedDeals: buckets.get("google_ads")?.closed ?? 0,
      roi: null,
      roas: roas(
        buckets.get("google_ads")?.revenue ?? 0,
        buckets.get("google_ads")?.spend ?? 0,
      ),
      highlight: "Campaign revenue attribution",
      actions: ["Bid optimization", "Draft campaign approvals"],
    },
  ];

  const recommendations: RevenueRecommendation[] = [];
  const meta = bySource.find((s) => s.id === "meta_ads");
  if (meta && meta.roas != null && meta.roas >= 10) {
    recommendations.push({
      id: "scale-meta",
      title: `Meta produced ${meta.roas}× return on ad spend — increase budget by 20%?`,
      detail: `Spend ${meta.spend} → revenue ${meta.revenue}. Profit ${meta.profit}.`,
      priority: "high",
    });
  }
  const google = bySource.find((s) => s.id === "google_ads");
  if (google && google.spend > 100 && google.revenue === 0) {
    recommendations.push({
      id: "pause-google",
      title: "Google campaign has spend and no closed revenue — pause or optimize?",
      detail: `${google.leads} leads captured with $${google.spend} spend and no attributed closes.`,
      priority: "high",
    });
  }
  const organicRow = bySource.find((s) => s.id === "organic");
  if (organicRow && organicRow.revenue > 500) {
    recommendations.push({
      id: "seo-organic",
      title: `Organic traffic produced $${organicRow.revenue} with no ad spend — expand SEO content.`,
      detail: "Organic revenue / no ad spend",
      priority: "medium",
    });
  }
  if (followUp.revenue > 0) {
    recommendations.push({
      id: "expand-followup",
      title: `AI Follow-Up influenced $${followUp.revenue} — expand follow-up sequence.`,
      detail: `Cost $${followUp.aiCost || 8} · ROI ${agentRoi(followUp.revenue, followUp.aiCost || 8) ?? "—"}×`,
      priority: "medium",
    });
  }

  return {
    summary,
    bySource,
    campaigns: campaignRows,
    journeys,
    timeline,
    agentContributions,
    recommendations,
    totals: {
      revenue: totalRevenue,
      spend: totalSpend,
      profit: totalProfit,
      roas: roas(totalRevenue, totalSpend),
      leads: input.leads.length,
      closedDeals,
      pipelineValue,
    },
  };
}
