"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createBusinessRepository } from "@/repositories/business.repository";
import { shouldRequireOnboarding, onboardingEntryPath, getOnboardingRoutingState } from "@/lib/auth/onboarding-routing";
import { sanitizeAppReturnPath } from "@/lib/ads-oauth-state";
import { AUTH_BRAND, signupEmailRedirectUrl } from "@/lib/auth/auth-branding";
import { ensureBootstrapPlatformAdmin } from "@/lib/auth/bootstrap-platform-admin";
import { ensureUserPlatformAccess } from "@/lib/access-control/access-control.service";
import { createUserProfile } from "@/lib/auth/user-profile";
import { getPublicAppUrl } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { completePostAuthSignup } from "@/services/auth/post-auth.service";
import { sendDiazitesWelcomeEmail } from "@/services/auth/welcome-email.service";

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const promoCode = String(formData.get("promo_code") ?? "").trim();

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required");
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Sign-up is unavailable. Check server configuration.";
    redirect(`/signup?error=${encodeURIComponent(msg)}`);
  }

  const emailRedirectTo = signupEmailRedirectUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName || null,
        promo_code: promoCode || null,
        app_name: AUTH_BRAND.platformName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session?.user) {
    await completePostAuthSignup(supabase, data.session.user, {
      promoCode,
      defaultNext: "/onboarding?welcome=trial",
    });
    revalidatePath("/", "layout");
    redirect("/onboarding?welcome=trial");
  }

  await sendDiazitesWelcomeEmail({
    to: email,
    fullName: fullName || null,
    confirmationPending: true,
  });

  const successQs = new URLSearchParams({ success: "check-email", email });
  if (promoCode) successQs.set("promo", promoCode);
  redirect(`/signup?${successQs.toString()}`);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Sign-in is unavailable. Check server configuration.";
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect(
      `/login?error=${encodeURIComponent("Could not create a session. Try again or reset your password.")}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent("Signed in but account could not be loaded. Try again.")}`,
    );
  }

  await createUserProfile(supabase, {
    userId: user.id,
    email: user.email ?? email,
  });
  await ensureUserPlatformAccess(user.id);
  await ensureBootstrapPlatformAdmin(user);

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");

  const { data: business } = await createBusinessRepository(supabase).getByOwnerUserId(user.id);
  const defaultPath = business ? "/dashboard" : onboardingEntryPath(true);
  const next = sanitizeAppReturnPath(String(formData.get("next") ?? ""), defaultPath);
  redirect(next);
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Service unavailable. Check server configuration.";
    redirect(`/forgot-password?error=${encodeURIComponent(msg)}`);
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getPublicAppUrl()}/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?success=check-email");
}

export async function signOutAction() {
  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    redirect("/");
  }
  await supabase.auth.signOut();
  redirect("/");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Service unavailable. Check server configuration.";
    redirect(`/reset-password?error=${encodeURIComponent(msg)}`);
  }
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?success=password-updated");
}
