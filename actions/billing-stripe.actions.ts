"use server";

import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBillingRepository } from "@/repositories/billing.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createBillingPortalSession,
  createSubscriptionCheckoutSession,
} from "@/services/stripe/checkout.service";
import type { BillingPlanName } from "@/types/backend";

export async function startSubscriptionCheckout(planName: BillingPlanName) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    redirect("/dashboard/billing?error=no_business");
  }

  try {
    const { url } = await createSubscriptionCheckoutSession({
      supabase,
      user,
      businessId: business.id,
      planName,
    });
    redirect(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    redirect(`/dashboard/billing?error=${encodeURIComponent(msg)}`);
  }
}

export async function openBillingPortal() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    redirect("/dashboard/billing?error=no_business");
  }

  const billing = createBillingRepository(supabase);
  const { data: row } = await billing.getByBusinessId(business.id);
  if (!row?.stripe_customer_id) {
    redirect("/dashboard/billing?error=no_stripe_customer");
  }

  try {
    const { url } = await createBillingPortalSession({
      supabase,
      stripeCustomerId: row.stripe_customer_id,
    });
    redirect(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Portal failed";
    redirect(`/dashboard/billing?error=${encodeURIComponent(msg)}`);
  }
}
