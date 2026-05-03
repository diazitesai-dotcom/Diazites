import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getCurrentUser(): Promise<{
  user: User | null;
  error: Error | null;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error: error ?? null };
}

/**
 * Use in server actions and route handlers that require a logged-in user.
 */
export async function requireAuth(): Promise<User> {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
