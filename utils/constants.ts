export const AGENTS = [
  { key: "social_ads", name: "Social Ads Agent" },
  { key: "search_ads", name: "Search Ads Agent" },
  { key: "landing_page", name: "Landing Page Agent" },
  { key: "ai_follow_up", name: "AI Follow-Up Agent" },
  { key: "retargeting", name: "Retargeting Agent" },
  { key: "lead_qualification", name: "Lead Qualification Agent" },
] as const;

export const BILLING_PLANS = [
  { name: "Starter" as const, price: 147 },
  { name: "Growth" as const, price: 397 },
  { name: "Pro" as const, price: 997 },
  { name: "Enterprise" as const, price: 2500 },
] as const;
