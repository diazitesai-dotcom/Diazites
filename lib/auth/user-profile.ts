import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";

/**
 * Ensures a `profiles` row exists for the auth user (idempotent).
 * Call after signup or on first authenticated session if needed.
 */
export async function createUserProfile(
  client: SupabaseClient,
  input: { userId: string; email: string; fullName?: string | null },
): Promise<ServiceResult<{ profileId: string }>> {
  const { data: existing } = await client
    .from("profiles")
    .select("id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing?.id) {
    return ok({ profileId: existing.id });
  }

  const { data, error } = await client
    .from("profiles")
    .insert({
      user_id: input.userId,
      full_name: input.fullName ?? null,
      role: "owner",
    })
    .select("id")
    .single();

  if (error || !data) {
    return fail(error?.message ?? "Failed to create profile", "PROFILE_CREATE_FAILED");
  }

  return ok({ profileId: data.id });
}
