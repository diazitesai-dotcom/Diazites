import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createReportRepository } from "@/repositories/report.repository";
import { getDashboardMetrics } from "@/services/reporting/reporting.service";
import type { DashboardMetrics } from "@/types/backend";

export type ReportChartPoint = {
  month: string;
  leads: number;
  spend: number;
  cpl: number;
  roi: number;
  conversions: number;
};

export async function loadReportsPageData(): Promise<{
  metrics: DashboardMetrics | null;
  chartSeries: ReportChartPoint[];
  hasBusiness: boolean;
} | null> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    return { hasBusiness: false, metrics: null, chartSeries: [] };
  }

  const metricsResult = await getDashboardMetrics(supabase, user.id, business.id, 30);
  const metrics = metricsResult.success ? metricsResult.data : null;

  const reportsRepo = createReportRepository(supabase);
  const { data: reportRows } = await reportsRepo.listByBusiness(business.id, 36);

  const sorted = (reportRows ?? [])
    .slice()
    .sort((a, b) => a.report_date.localeCompare(b.report_date));
  const last = sorted.slice(-6);

  const chartSeries: ReportChartPoint[] = last.map((r) => ({
    month: new Date(`${r.report_date}T12:00:00`).toLocaleDateString("en-US", {
      month: "short",
    }),
    leads: r.leads ?? 0,
    spend: Number(r.spend ?? 0),
    cpl: Number(r.cpl ?? 0),
    roi: Number(r.roi ?? 0),
    conversions: r.conversions ?? 0,
  }));

  if (chartSeries.length === 0 && metrics) {
    chartSeries.push({
      month: "Period",
      leads: metrics.totalLeads,
      spend: metrics.totalSpend,
      cpl: metrics.costPerLead ?? 0,
      roi: metrics.roi ?? 0,
      conversions: Math.round(
        (metrics.totalLeads * (metrics.conversionRate ?? 0)) / 100,
      ),
    });
  }

  return { hasBusiness: true, metrics, chartSeries };
}
