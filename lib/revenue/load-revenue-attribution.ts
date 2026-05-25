import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildRevenueAttribution,
  type CampaignAttributionInput,
  type LeadAttributionInput,
  type ManualRevenueEntry,
} from "@/lib/revenue/build-revenue-attribution";
import { getCampaignsByBusiness } from "@/services/campaigns/campaign.service";
import { getDashboardMetrics } from "@/services/reporting/reporting.service";
import type { RevenueAttributionSnapshot } from "@/types/revenue-attribution";
import type { AttributionModel } from "@/types/revenue-attribution";

export async function loadRevenueAttribution(
  supabase: SupabaseClient,
  userId: string,
  businessId: string,
): Promise<RevenueAttributionSnapshot> {
  const metricsResult = await getDashboardMetrics(supabase, userId, businessId, 30);
  const metrics = metricsResult.success ? metricsResult.data : null;

  const { data: leadRows } = await supabase
    .from("leads")
    .select(
      "id, name, status, source, campaign_id, budget, created_at, campaigns(platform, name)",
    )
    .eq("business_id", businessId);

  const leads: LeadAttributionInput[] = (leadRows ?? []).map((row) => {
    const r = row as {
      id: string;
      name: string;
      status: string;
      source: string | null;
      campaign_id: string | null;
      budget: string | null;
      created_at: string | null;
      campaigns: unknown;
    };
    let campaignLabel: string | null = null;
    const c = r.campaigns;
    if (c && typeof c === "object" && "platform" in (c as object)) {
      const camp = c as { platform?: string; name?: string };
      campaignLabel = camp.name ?? camp.platform ?? null;
    } else if (Array.isArray(c) && c[0]) {
      const camp = c[0] as { platform?: string; name?: string };
      campaignLabel = camp.name ?? camp.platform ?? null;
    }
    return {
      id: r.id,
      name: r.name,
      status: r.status,
      source: r.source,
      campaignId: r.campaign_id,
      campaignLabel,
      budget: r.budget,
      createdAt: r.created_at,
    };
  });

  const campaignsRes = await getCampaignsByBusiness(supabase, userId, businessId);
  const campaigns: CampaignAttributionInput[] = (
    campaignsRes.success ? (campaignsRes.data ?? []) : []
  ).map((c) => {
    const row = c as {
      id: string;
      platform?: string;
      name?: string;
      spend?: number;
      budget?: number;
      leads_count?: number;
      status?: string;
    };
    return {
      id: row.id,
      name: row.name ?? row.platform ?? "Campaign",
      platform: String(row.platform ?? "unknown"),
      spend: Number(row.spend ?? 0),
      budget: Number(row.budget ?? 0),
      leadsCount: Number(row.leads_count ?? 0),
      status: row.status ?? null,
    };
  });

  let manualEntries: ManualRevenueEntry[] = [];
  const { data: revenueRows, error } = await supabase
    .from("revenue_entries")
    .select("*")
    .eq("business_id", businessId)
    .order("closed_at", { ascending: false })
    .limit(50);

  if (!error && revenueRows) {
    manualEntries = revenueRows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        leadId: r.lead_id != null ? String(r.lead_id) : null,
        leadName: r.lead_name != null ? String(r.lead_name) : null,
        sourceKey: String(r.source_key ?? "manual_sales"),
        campaign: r.campaign != null ? String(r.campaign) : null,
        amount: Number(r.amount ?? 0),
        closeMethod: String(r.close_method ?? "manual_entry") as ManualRevenueEntry["closeMethod"],
        closedAt: String(r.closed_at ?? new Date().toISOString()),
        attributionType: String(r.attribution_type ?? "manual_override") as AttributionModel,
        notes: r.notes != null ? String(r.notes) : null,
        agentKey: r.agent_key != null ? String(r.agent_key) : null,
      };
    });
  }

  const { data: settings } = await supabase
    .from("businesses")
    .select("profile")
    .eq("id", businessId)
    .maybeSingle();

  const profile = (settings?.profile ?? {}) as { attributionModel?: AttributionModel };
  const model = profile.attributionModel ?? "ai_assisted";

  const { data: agentRows } = await supabase
    .from("agents")
    .select("agent_type, status")
    .eq("business_id", businessId);

  const activeAgents = (agentRows ?? [])
    .filter((a) => a.status === "active")
    .map((a) => String(a.agent_type));

  const visitorEstimate = Math.max(
    leads.length * 12,
    metrics?.totalLeads ? metrics.totalLeads * 10 : 0,
  );

  return buildRevenueAttribution({
    leads,
    campaigns,
    manualEntries,
    totalSpendFromMetrics: metrics?.totalSpend ?? 0,
    visitorEstimate,
    attributionModel: model,
    activeAgents,
  });
}
