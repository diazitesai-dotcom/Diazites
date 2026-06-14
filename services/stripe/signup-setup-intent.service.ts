import { getStripe } from "@/lib/stripe";
import { stripePriceIdForPlan } from "@/lib/stripe/plan-prices";
import { fail, ok, type ServiceResult } from "@/lib/result";
import type { BillingPlanName } from "@/types/backend";

export async function createSignupSetupIntent(params: {
  email: string;
  fullName?: string;
  companyName?: string;
  planName: BillingPlanName;
}): Promise<ServiceResult<{ clientSecret: string; setupIntentId: string }>> {
  const stripe = getStripe();
  if (!stripe) {
    return fail("Stripe is not configured on this environment.", "STRIPE_CONFIG");
  }

  const priceId = stripePriceIdForPlan(params.planName);
  if (!priceId) {
    return fail(`Stripe price is not configured for ${params.planName}.`, "STRIPE_CONFIG");
  }

  const email = params.email.trim().toLowerCase();
  if (!email) return fail("Email is required to secure your trial.", "VALIDATION");

  const existing = await stripe.customers.list({ email, limit: 1 });
  const customer =
    existing.data[0] ??
    (await stripe.customers.create({
      email,
      name: params.fullName?.trim() || params.companyName?.trim() || undefined,
      metadata: {
        company_name: params.companyName?.trim() ?? "",
        signup_plan: params.planName,
        signup_price_id: priceId,
      },
    }));

  await stripe.customers.update(customer.id, {
    metadata: {
      company_name: params.companyName?.trim() ?? "",
      signup_plan: params.planName,
      signup_price_id: priceId,
    },
  });

  // Card-only: this trial bills a card on file once it ends, so the SetupIntent
  // must save a reusable card. Enabling all dashboard methods (Pix, Naver Pay,
  // bank debits, etc.) surfaces options that can't be set up for off-session
  // card-style subscription billing and triggers Stripe "processing" errors.
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ["card"],
    usage: "off_session",
    metadata: {
      signup_plan: params.planName,
      signup_price_id: priceId,
      email,
    },
  });

  if (!setupIntent.client_secret) {
    return fail("Stripe did not return a payment session.", "STRIPE_ERROR");
  }

  return ok({
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
  });
}
