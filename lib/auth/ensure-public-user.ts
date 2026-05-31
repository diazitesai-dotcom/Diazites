import { createServiceRoleClient } from "@/lib/supabase/server";
import { fail, ok, type ServiceResult } from "@/lib/result";

/**
 * Ensures `public.users` has a row for the auth user.
 * Required before onboarding, profiles, or businesses (all FK to public.users).
 * The auth trigger should create this row; this is a safe fallback when it did not run.
 */
export async function ensurePublicUserRecord(
  userId: string,
  email: string | null | undefined,
): Promise<ServiceResult<void>> {
  const normalizedEmail = email?.trim() || `${userId}@users.local`;

  try {
    const service = createServiceRoleClient();
    const { error } = await service.from("users").upsert(
      { id: userId, email: normalizedEmail },
      { onConflict: "id" },
    );

    if (error) return fail(error.message, "PUBLIC_USER_ENSURE_FAILED");
    return ok(undefined);
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Could not ensure public user record",
      "PUBLIC_USER_ENSURE_FAILED",
    );
  }
}
