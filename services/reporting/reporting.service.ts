import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createCampaignRepository } from "@/repositories/campaign.repository";
import { createReportRepository } from "@/repositories/report.repository";
import type { DashboardMetrics } from "@/types/backend";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardMetrics(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  periodDays = 30,
): Promise<ServiceResult<DashboardMetrics>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const since = daysAgo(periodDays);
  const campaignsRepo = createCampaignRepository(client);

  const { data: leads } = await client
    .from("leads")
    .select("id, status, created_at")
    .eq("business_id", businessId)
    .gte("created_at", since.toISOString());

  const { data: campaigns } = await campaignsRepo.listByBusiness(businessId);

  const totalLeads = leads?.length ?? 0;
  let totalSpend = 0;
  for (const c of campaigns ?? []) {
    totalSpend += Number(c.spend ?? 0);
  }

  const booked =
    leads?.filter((l) => l.status === "booked" || l.status === "won").length ?? 0;
  const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : null;
  const conversionRate = totalLeads > 0 ? (booked / totalLeads) * 100 : null;

  const roi =
    totalSpend > 0 && booked > 0
      ? Math.round(((booked * 5000) / totalSpend) * 10) / 10
      : null;

  const activeCampaigns =
    (campaigns ?? []).filter((c) => c.status === "active").length ?? 0;

  return ok({
    totalLeads,
    totalSpend,
    costPerLead,
    conversionRate,
    roi,
    activeCampaigns,
    periodDays,
  });
}

export async function generateReport(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  reportDate = new Date(),
): Promise<ServiceResult<{ snapshot: boolean }>> {
  const metrics = await getDashboardMetrics(client, ownerUserId, businessId, 30);
  if (!metrics.success) return metrics;

  const reports = createReportRepository(client);

  const d = reportDate.toISOString().slice(0, 10);
  const m = metrics.data;

  const { error } = await reports.upsertDailySnapshot({
    businessId,
    reportDate: d,
    leads: m.totalLeads,
    spend: m.totalSpend,
    cpl: m.costPerLead ?? 0,
    roi: m.roi ?? 0,
    conversions: Math.round((m.totalLeads * (m.conversionRate ?? 0)) / 100),
  });

  if (error) return fail(error.message);
  return ok({ snapshot: true });
}
