import { NextResponse } from "next/server";

import { sanitizeAppReturnPath } from "@/lib/ads-oauth-state";
import type { AdsPlatform } from "@/lib/ads-env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { buildGoogleAuthLink } from "@/services/ads/google.service";
import { buildMetaAuthLink } from "@/services/ads/meta.service";

export const dynamic = "force-dynamic";

const ALLOWED: AdsPlatform[] = ["google", "meta"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") as AdsPlatform | null;
  const returnTo = sanitizeAppReturnPath(
    url.searchParams.get("returnTo") ?? undefined,
    "/dashboard/integrations",
  );

  if (!platform || !ALLOWED.includes(platform)) {
    return NextResponse.redirect(
      `/dashboard/integrations?error=${encodeURIComponent("invalid_platform")}`,
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `/login?next=${encodeURIComponent(returnTo)}`,
    );
  }

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    return NextResponse.redirect("/onboarding?error=Complete+onboarding+first");
  }

  const link =
    platform === "google"
      ? await buildGoogleAuthLink({ businessId: business.id, returnTo })
      : await buildMetaAuthLink({ businessId: business.id, returnTo });

  if (!link.success) {
    return NextResponse.redirect(
      `/dashboard/integrations?error=${encodeURIComponent(link.error)}`,
    );
  }

  return NextResponse.redirect(link.data.url);
}
