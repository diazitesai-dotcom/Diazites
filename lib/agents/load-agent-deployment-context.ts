import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { AgentDeploymentContext, ReadinessItem } from "@/types/agent-deployment";

export async function loadAgentDeploymentContext(): Promise<AgentDeploymentContext | null> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return null;

  const { data: adAccounts } = await supabase
    .from("ad_accounts")
    .select("platform, status")
    .eq("business_id", business.id);

  const hasAds = (adAccounts ?? []).some(
    (a) => a.status === "connected" || a.status === "active",
  );

  const { data: billing } = await supabase
    .from("billing")
    .select("payment_status")
    .eq("business_id", business.id)
    .maybeSingle();

  const billingOk =
    billing?.payment_status === "active" || billing?.payment_status === "trialing";

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { count: weekLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("created_at", since.toISOString());

  const readiness: ReadinessItem[] = [
    {
      id: "crm",
      label: "CRM",
      ok: true,
      detail: "Leads CRM connected",
      href: "/dashboard/leads",
    },
    {
      id: "ads",
      label: "Ads",
      ok: hasAds,
      detail: hasAds ? "Ad platform linked" : "Connect Meta or Google",
      href: "/dashboard/ads",
    },
    {
      id: "pixel",
      label: "Pixel",
      ok: false,
      detail: "Tracking pixel pending",
      href: "/dashboard/settings",
    },
    {
      id: "domain",
      label: "Domain",
      ok: true,
      detail: "Workspace domain ready",
      href: "/dashboard/funnel",
    },
    {
      id: "analytics",
      label: "Analytics",
      ok: weekLeads != null,
      detail: weekLeads ? `${weekLeads} leads (7d) tracked` : "Awaiting first events",
      href: "/dashboard/reports",
    },
    {
      id: "billing",
      label: "Billing",
      ok: billingOk,
      detail: billingOk ? "Plan active" : "Billing setup required",
      href: "/dashboard/billing",
    },
  ];

  return {
    readiness,
    monitoring: {
      traffic: hasAds ? "Paid + organic active" : "Organic / direct",
      leadVelocity: `${weekLeads ?? 0} leads / 7d`,
      agentHealth: "Monitoring post-deploy",
      optimizationStatus: "AI optimization queued",
    },
  };
}
