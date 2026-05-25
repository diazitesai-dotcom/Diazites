import type { CostForecast, GrowthEngineOsConfig } from "@/lib/engine/growth-engine-os-types";
import { ENGINE_AGENTS } from "@/lib/engine/growth-engine-os-catalog";

export function computeCostForecast(
  monthlyBudget: number | null,
  config: GrowthEngineOsConfig,
): CostForecast {
  const budget = monthlyBudget ?? 1500;
  const dailyAd = Math.max(5, Math.round(budget / 30));
  const enabled = ENGINE_AGENTS.filter((a) => config.enabledAgents.includes(a.key));
  const tokenCost = enabled.reduce((s, a) => s + a.estimatedCostUsd, 0);
  const monthlyAd = dailyAd * 30;
  const hosting = 12;
  const emailSms = 9;
  const crm = config.selectedPlatforms.some((p) => p.includes("hub") || p === "ghl") ? 0 : 0;
  const total = tokenCost + monthlyAd + hosting + emailSms + crm;
  const leadsLow = Math.max(8, Math.round((budget / 85) * 0.7));
  const leadsHigh = Math.max(leadsLow + 6, Math.round((budget / 55) * 1.1));
  const cpl = budget > 0 ? Math.round(budget / ((leadsLow + leadsHigh) / 2)) : 0;
  const pipelineLow = Math.round(leadsLow * 420);
  const pipelineHigh = Math.round(leadsHigh * 520);

  return {
    lines: [
      { label: "AI tokens (run)", amount: `$${tokenCost.toFixed(2)}`, detail: `${enabled.length} agents` },
      { label: "Ad spend", amount: `$${dailyAd}/day`, detail: `~$${monthlyAd}/mo at cap` },
      { label: "Landing hosting", amount: `$${(hosting / 30).toFixed(2)}/day` },
      { label: "Email / SMS", amount: `$${(emailSms / 30).toFixed(2)}/day` },
      { label: "CRM usage", amount: crm ? `$${crm}/mo` : "Included", detail: "Native Leads CRM" },
    ],
    projectedMonthly: `$${Math.round(total)}`,
    projectedLeads: `${leadsLow}–${leadsHigh}/month`,
    projectedCpl: cpl > 0 ? `$${cpl}` : "—",
    projectedPipeline: `$${(pipelineLow / 1000).toFixed(1)}K–$${(pipelineHigh / 1000).toFixed(1)}K`,
  };
}
