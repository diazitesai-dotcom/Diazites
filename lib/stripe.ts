import Stripe from "stripe";

import { env } from "@/lib/env";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export function requireStripe(): Stripe {
  const s = getStripe();
  if (!s) {
    throw new Error(
      "Stripe is not configured: set STRIPE_SECRET_KEY and matching price IDs (STRIPE_PRICE_*).",
    );
  }
  return s;
}
