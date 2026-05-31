import type { BillingPlanName } from "@/types/backend";

import { DEFAULT_TRIAL_DAYS, DIAZITES_PLANS } from "@/lib/billing/plans";

export type SignupTrialPlan = {
  id: BillingPlanName;
  label: string;
  priceMonthly: number;
  trialDays: number;
  description: string;
  recommended?: boolean;
};

export const SIGNUP_TRIAL_PLANS: SignupTrialPlan[] = DIAZITES_PLANS.filter(
  (p) => p.name === "Starter" || p.name === "Growth" || p.name === "Pro",
).map((p) => ({
  id: p.name,
  label: `${p.name} Plan`,
  priceMonthly: p.priceMonthly,
  trialDays: DEFAULT_TRIAL_DAYS,
  description: p.description,
  recommended: p.recommended,
}));

export function normalizeSignupPlan(value: string | null | undefined): BillingPlanName {
  const match = SIGNUP_TRIAL_PLANS.find((p) => p.id === value);
  return match?.id ?? "Starter";
}
