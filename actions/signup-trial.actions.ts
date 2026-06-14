"use server";

import { revalidatePath } from "next/cache";

import { AUTH_BRAND } from "@/lib/auth/auth-branding";
import { normalizeSignupPlan } from "@/lib/billing/signup-plans";
import { isStripeBillingConfigured } from "@/lib/stripe/plan-prices";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { completePostAuthSignup } from "@/services/auth/post-auth.service";
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

  // Create the account already email-confirmed via the admin API. The card has
  // been validated by this point, so we don't depend on confirmation-email
  // delivery (which can fail or be rate-limited) to let the user in.
  let service;
  try {
    service = createServiceRoleClient();
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Sign-up is unavailable.",
    };
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName.trim() || null,
      company_name: input.companyName.trim() || null,
      phone: input.phone.trim() || null,
      selected_plan: selectedPlan,
      promo_code: promoCode || null,
      app_name: AUTH_BRAND.platformName,
    },
  });

  if (createError) {
    const alreadyExists = /registered|already exists|already been/i.test(createError.message);
    return {
      success: false as const,
      error: alreadyExists
        ? "An account with this email already exists. Please sign in instead."
        : createError.message,
    };
  }

  const userId = created.user?.id;
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

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session?.user) {
    // Account and subscription were created, but the session couldn't be set.
    // Send them to sign in manually rather than blocking the completed signup.
    return {
      success: true,
      redirectTo: `/login?checkout=success&email=${encodeURIComponent(email)}`,
    };
  }

  const postAuth = await completePostAuthSignup(supabase, signInData.session.user, {
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
