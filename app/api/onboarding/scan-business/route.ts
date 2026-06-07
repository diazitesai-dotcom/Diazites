import { NextResponse } from "next/server";

import { autofillCeoBusinessProfileFromWebsite } from "@/lib/ceo-command-center/business-profile-autofill";
import { createEmptyBusinessProfile, sanitizeBusinessProfile } from "@/lib/ceo-command-center/business-profile-utils";
import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let websiteUrl = "";
  try {
    const body = (await request.json()) as { websiteUrl?: string };
    websiteUrl = String(body.websiteUrl ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!websiteUrl) {
    return NextResponse.json({ error: "Enter a website URL" }, { status: 400 });
  }

  await ensurePublicUserRecord(user.id, user.email);

  const result = await autofillCeoBusinessProfileFromWebsite(
    supabase,
    websiteUrl,
    createEmptyBusinessProfile(websiteUrl),
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 422 });
  }

  return NextResponse.json({
    profile: sanitizeBusinessProfile(result.data.profile, websiteUrl),
    usedAi: result.data.usedAi,
  });
}
