import { NextResponse } from "next/server";

import { sanitizeAppReturnPath } from "@/lib/ads-oauth-state";
import { createUserProfile } from "@/lib/auth/user-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { completePostAuthSignup } from "@/services/auth/post-auth.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const promo = requestUrl.searchParams.get("promo");

  const origin = requestUrl.origin;
  const fail = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);

  if (errorParam) {
    return fail(errorDescription ?? errorParam);
  }

  if (!code) {
    return fail("Missing authorization code. Try signing in again.");
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Auth service unavailable");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return fail(exchangeError.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Could not load your account after sign-in.");
  }

  const next = sanitizeAppReturnPath(rawNext ?? "", "/onboarding?welcome=trial");

  try {
    const result = await completePostAuthSignup(supabase, user, {
      promoCode: promo,
      defaultNext: next,
    });
    const destination = sanitizeAppReturnPath(
      result.redirectPath,
      result.hasBusiness ? "/dashboard" : "/onboarding?welcome=trial",
    );
    return NextResponse.redirect(`${origin}${destination}`);
  } catch (e) {
    await createUserProfile(supabase, {
      userId: user.id,
      email: user.email ?? "",
    });
    return NextResponse.redirect(`${origin}${next}`);
  }
}
