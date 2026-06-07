"use server";

import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import { autofillCeoBusinessProfileFromWebsite } from "@/lib/ceo-command-center/business-profile-autofill";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BusinessProfileFields } from "@/types/ceo-command-center";

export async function scanBusinessProfileAction(
  websiteUrl: string,
  currentProfile: BusinessProfileFields,
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Not signed in" };
  }

  await ensurePublicUserRecord(user.id, user.email);

  const result = await autofillCeoBusinessProfileFromWebsite(
    supabase,
    websiteUrl,
    currentProfile,
  );

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  return { success: true as const, data: result.data };
}
