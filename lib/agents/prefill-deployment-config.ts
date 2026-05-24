import type { DeploymentConfig } from "@/types/agent-deployment";

type BusinessRow = {
  name: string;
  service_area: string | null;
  city_state: string | null;
  services: string | null;
  monthly_budget: number | null;
};

export function prefillDeploymentConfig(business: BusinessRow | null): DeploymentConfig {
  const area = business?.service_area || business?.city_state || "your service area";
  const services = business?.services?.split(",")[0]?.trim() || "roofing services";
  const budget = business?.monthly_budget
    ? String(Math.max(25, Math.round(Number(business.monthly_budget) / 30)))
    : "50";

  return {
    budget,
    platform: "meta_google",
    audience: `Homeowners · ${area}`,
    offer: `Free ${services} estimate`,
    cta: "Get Your Free Estimate",
    brandVoice: `${business?.name ?? "Local"} expert — professional, trustworthy, community-focused`,
  };
}
