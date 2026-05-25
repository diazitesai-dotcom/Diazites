export function profit(revenue: number, spend: number, aiCost = 0) {
  return Math.round((revenue - spend - aiCost) * 100) / 100;
}

export function cpl(spend: number, leads: number): number | null {
  if (leads <= 0) return null;
  return Math.round((spend / leads) * 100) / 100;
}

export function cac(spend: number, closedDeals: number): number | null {
  if (closedDeals <= 0) return null;
  return Math.round((spend / closedDeals) * 100) / 100;
}

export function roas(revenue: number, spend: number): number | null {
  if (spend <= 0) return revenue > 0 ? null : null;
  return Math.round((revenue / spend) * 10) / 10;
}

export function conversionRate(converted: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((converted / total) * 1000) / 10;
}

export function agentRoi(revenue: number, cost: number): number | null {
  if (cost <= 0) return revenue > 0 ? null : null;
  return Math.round((revenue / cost) * 10) / 10;
}

export const ATTRIBUTION_MODEL_LABELS: Record<string, string> = {
  first_touch: "First-touch attribution",
  last_touch: "Last-touch attribution",
  multi_touch: "Multi-touch attribution",
  linear: "Linear attribution",
  ai_assisted: "AI-assisted attribution",
  manual_override: "Manual override",
};
