import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getPlanDefinition,
  normalizePlanName,
  type UsageMetricKey,
} from "@/lib/billing/plans";
import { ok, type ServiceResult } from "@/lib/result";
import { createUsageRecordsRepository } from "@/repositories/usage-records.repository";

export type UsageDashboardRow = {
  metricKey: UsageMetricKey | string;
  label: string;
  used: number;
  included: number | null;
  remaining: number | null;
  overage: number;
  unit: string;
};

const METRIC_LABELS: Record<string, { label: string; unit: string; limitKey: keyof ReturnType<typeof getPlanDefinition>["limits"] | null }> = {
  ai_call_minutes: { label: "AI call minutes", unit: "min", limitKey: "aiCallMinutes" },
  sms_sent: { label: "SMS sent", unit: "msgs", limitKey: "smsPerMonth" },
  email_sent: { label: "Emails sent", unit: "emails", limitKey: "emailsPerMonth" },
  contacts: { label: "Contacts", unit: "contacts", limitKey: "contacts" },
  workflows_active: { label: "Active workflows", unit: "workflows", limitKey: "workflowsActive" },
  ai_agents: { label: "AI agents", unit: "agents", limitKey: "aiAgents" },
  ad_accounts: { label: "Ad accounts", unit: "accounts", limitKey: "adAccounts" },
  landing_pages: { label: "Landing pages", unit: "pages", limitKey: "landingPages" },
  pipelines: { label: "Pipelines", unit: "pipelines", limitKey: "pipelines" },
  users: { label: "Team users", unit: "users", limitKey: "users" },
};

function currentPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function syncUsageMetrics(
  client: SupabaseClient,
  businessId: string,
  planName: string,
): Promise<void> {
  const plan = getPlanDefinition(planName);
  const period = currentPeriod();
  const usageRepo = createUsageRecordsRepository(client);

  const [
    { count: contacts },
    { count: workflows },
    { count: agents },
    { count: adAccounts },
    { count: landingPages },
    { count: pipelines },
    { data: callMinutes },
  ] = await Promise.all([
    client.from("contacts").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    client
      .from("diazites_workflows")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "active"),
    client
      .from("ai_calling_agents")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .neq("status", "archived"),
    client
      .from("ad_accounts")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    client
      .from("landing_pages")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    client.from("pipelines").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    client
      .from("diazites_calls")
      .select("duration_seconds")
      .eq("business_id", businessId)
      .gte("created_at", `${period.start}T00:00:00.000Z`),
  ]);

  const minutesUsed = Math.ceil(
    ((callMinutes ?? []) as Array<{ duration_seconds: number | null }>).reduce(
      (s, c) => s + (c.duration_seconds ?? 0),
      0,
    ) / 60,
  );

  const metrics: Array<{ key: UsageMetricKey; qty: number; limit: number | null }> = [
    { key: "contacts", qty: contacts ?? 0, limit: plan.limits.contacts },
    { key: "workflows_active", qty: workflows ?? 0, limit: plan.limits.workflowsActive },
    { key: "ai_agents", qty: agents ?? 0, limit: plan.limits.aiAgents },
    { key: "ad_accounts", qty: adAccounts ?? 0, limit: plan.limits.adAccounts },
    { key: "landing_pages", qty: landingPages ?? 0, limit: plan.limits.landingPages },
    { key: "pipelines", qty: pipelines ?? 0, limit: plan.limits.pipelines },
    { key: "ai_call_minutes", qty: minutesUsed, limit: plan.limits.aiCallMinutes },
  ];

  for (const m of metrics) {
    await usageRepo.upsertMetric({
      businessId,
      metricKey: m.key,
      quantity: m.qty,
      periodStart: period.start,
      periodEnd: period.end,
      includedLimit: m.limit,
    });
  }
}

export async function getUsageDashboard(
  client: SupabaseClient,
  businessId: string,
  planName: string,
): Promise<ServiceResult<{ planName: string; rows: UsageDashboardRow[]; estimatedOverage: number }>> {
  await syncUsageMetrics(client, businessId, planName);
  const period = currentPeriod();
  const usageRepo = createUsageRecordsRepository(client);
  const { data: records } = await usageRepo.listForPeriod(businessId, period.start, period.end);
  const normalized = normalizePlanName(planName);

  const rows: UsageDashboardRow[] = (records ?? []).map((r) => {
    const meta = METRIC_LABELS[r.metric_key] ?? {
      label: r.metric_key,
      unit: "units",
      limitKey: null,
    };
    const included = r.included_limit != null ? Number(r.included_limit) : null;
    const used = Number(r.quantity);
    const overage = Number(r.overage_quantity ?? 0);
    return {
      metricKey: r.metric_key,
      label: meta.label,
      used,
      included,
      remaining: included != null ? Math.max(0, included - used) : null,
      overage,
      unit: meta.unit,
    };
  });

  const estimatedOverage = rows.reduce((s, r) => s + r.overage, 0);

  return ok({ planName: normalized, rows, estimatedOverage });
}
