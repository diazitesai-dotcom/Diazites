"use server";

import { redirect } from "next/navigation";

import { createUserProfile } from "@/lib/auth/user-profile";
import { getPublicAppUrl } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Sign-up is unavailable. Check server configuration.";
    redirect(`/signup?error=${encodeURIComponent(msg)}`);
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getPublicAppUrl()}/dashboard`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session?.user) {
    await createUserProfile(supabase, {
      userId: data.session.user.id,
      email,
    });
  }

  redirect("/signup?success=check-email");
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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
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
