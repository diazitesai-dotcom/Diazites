import { type NextRequest, NextResponse } from "next/server";

import { sanitizeAppReturnPath } from "@/lib/ads-oauth-state";
import { createUserProfile } from "@/lib/auth/user-profile";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { completePostAuthSignup } from "@/services/auth/post-auth.service";

export const dynamic = "force-dynamic";

function copyAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export async function GET(request: NextRequest) {
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

  const defaultNext = sanitizeAppReturnPath(rawNext ?? "", "/onboarding?welcome=trial");

  try {
    const cookieResponse = NextResponse.next({ request });
    const supabase = createRouteHandlerSupabaseClient(request, cookieResponse);

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

    let redirectPath = defaultNext;

    try {
      const result = await completePostAuthSignup(supabase, user, {
        promoCode: promo,
        defaultNext,
      });
      redirectPath = sanitizeAppReturnPath(
        result.redirectPath,
        result.hasBusiness ? "/dashboard" : "/onboarding?welcome=trial",
      );
    } catch {
      await createUserProfile(supabase, {
        userId: user.id,
        email: user.email ?? "",
      });
    }

    const redirect = NextResponse.redirect(`${origin}${redirectPath}`);
    copyAuthCookies(cookieResponse, redirect);
    return redirect;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Auth service unavailable");
  }
}
