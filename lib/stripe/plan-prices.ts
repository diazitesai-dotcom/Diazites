import { env } from "@/lib/env";
import type { BillingPlanName } from "@/types/backend";

const PRICE_ENV: Record<BillingPlanName, string> = {
  Starter: "STRIPE_PRICE_STARTER",
  Growth: "STRIPE_PRICE_GROWTH",
  Pro: "STRIPE_PRICE_PRO",
  Enterprise: "STRIPE_PRICE_PRO",
  Domination: "STRIPE_PRICE_DOMINATION",
};

export function stripePriceIdForPlan(plan: BillingPlanName): string | null {
  const key = PRICE_ENV[plan] ?? "STRIPE_PRICE_STARTER";
  const raw =
    key === "STRIPE_PRICE_STARTER"
      ? env.STRIPE_PRICE_STARTER
      : key === "STRIPE_PRICE_GROWTH"
        ? env.STRIPE_PRICE_GROWTH
        : key === "STRIPE_PRICE_PRO"
          ? env.STRIPE_PRICE_PRO ?? env.STRIPE_PRICE_DOMINATION
          : env.STRIPE_PRICE_DOMINATION;
  return raw?.trim() || null;
}

export function isStripeBillingConfigured(): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY?.trim() &&
      env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() &&
      stripePriceIdForPlan("Starter"),
  );
}
