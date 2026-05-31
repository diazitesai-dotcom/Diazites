"use server";

import { revalidatePath } from "next/cache";

import { AUTH_BRAND, signupEmailRedirectUrl } from "@/lib/auth/auth-branding";
import { normalizeSignupPlan } from "@/lib/billing/signup-plans";
import { isStripeBillingConfigured } from "@/lib/stripe/plan-prices";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { completePostAuthSignup } from "@/services/auth/post-auth.service";
import { sendDiazitesWelcomeEmail } from "@/services/auth/welcome-email.service";
import { createSignupSetupIntent } from "@/services/stripe/signup-setup-intent.service";
import { attachTrialSubscriptionFromSetupIntent } from "@/services/stripe/signup-subscription.service";
import type { BillingPlanName } from "@/types/backend";

export type CompleteTrialSignupResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

export async function createSignupSetupIntentAction(input: {
  email: string;
  fullName?: string;
  companyName?: string;
  planName: string;
}) {
  if (!isStripeBillingConfigured()) {
    return { success: false as const, error: "Stripe billing is not configured." };
  }

  const planName = normalizeSignupPlan(input.planName) as BillingPlanName;
  const result = await createSignupSetupIntent({
    email: input.email,
    fullName: input.fullName,
    companyName: input.companyName,
    planName,
  });

  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, data: result.data };
}

export async function completeTrialSignupWithPaymentAction(input: {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  selectedPlan: string;
  promoCode?: string;
  setupIntentId: string;
}): Promise<CompleteTrialSignupResult> {
  const email = input.email.trim();
  const password = input.password;
  const selectedPlan = normalizeSignupPlan(input.selectedPlan) as BillingPlanName;
  const promoCode = input.promoCode?.trim() ?? "";

  if (!email || !password) {
    return { success: false as const, error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { success: false as const, error: "Password must be at least 8 characters." };
  }
  if (!input.setupIntentId) {
    return { success: false as const, error: "Please enter your card details." };
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Sign-up is unavailable.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: signupEmailRedirectUrl(),
      data: {
        full_name: input.fullName.trim() || null,
        company_name: input.companyName.trim() || null,
        phone: input.phone.trim() || null,
        selected_plan: selectedPlan,
        promo_code: promoCode || null,
        app_name: AUTH_BRAND.platformName,
      },
    },
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { success: false as const, error: "Could not create your account." };
  }

  const subResult = await attachTrialSubscriptionFromSetupIntent({
    setupIntentId: input.setupIntentId,
    userId,
    planName: selectedPlan,
  });

  if (!subResult.success) {
    return { success: false as const, error: subResult.error };
  }

  if (data.session?.user) {
    const postAuth = await completePostAuthSignup(supabase, data.session.user, {
      promoCode,
      defaultNext: "/onboarding?welcome=trial",
    });
    revalidatePath("/", "layout");
    const next = postAuth.redirectPath;
    const sep = next.includes("?") ? "&" : "?";
    return {
      success: true,
      redirectTo: `${next}${sep}checkout=success`,
    };
  }

  await sendDiazitesWelcomeEmail({
    to: email,
    fullName: input.fullName.trim() || null,
    confirmationPending: true,
  });

  return {
    success: true,
    redirectTo: `/signup?success=check-email&email=${encodeURIComponent(email)}`,
  };
}
