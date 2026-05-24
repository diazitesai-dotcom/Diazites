import { NextResponse } from "next/server";

import { getPublicAppUrl } from "@/lib/env";
import { decodeAdsOAuthState } from "@/lib/ads-oauth-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { exchangeGoogleCode } from "@/services/ads/google.service";
import { exchangeMetaCode } from "@/services/ads/meta.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const appUrl = getPublicAppUrl();
  const adsUrl = `${appUrl}/dashboard/ads`;

  if (oauthError) {
    return NextResponse.redirect(
      `${adsUrl}?error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${adsUrl}?error=missing_oauth_params`);
  }

  const decoded = decodeAdsOAuthState(state);
  if (!decoded) {
    return NextResponse.redirect(`${adsUrl}?error=invalid_oauth_state`);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login?next=${encodeURIComponent("/dashboard/ads")}`);
  }

  const result =
    decoded.platform === "google"
      ? await exchangeGoogleCode(supabase, {
          businessId: decoded.businessId,
          code,
        })
      : decoded.platform === "meta"
        ? await exchangeMetaCode(supabase, {
            businessId: decoded.businessId,
            code,
          })
        : { success: false as const, error: "Platform not supported yet" };

  if (!result.success) {
    return NextResponse.redirect(
      `${adsUrl}?error=${encodeURIComponent(result.error)}`,
    );
  }

  return NextResponse.redirect(
    `${adsUrl}?connected=${encodeURIComponent(decoded.platform)}`,
  );
}
