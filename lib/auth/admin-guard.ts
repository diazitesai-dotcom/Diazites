import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server-side admin gate. Redirects to /login if the request is anonymous and
 * to /dashboard if the authenticated user is not in the `admin_users` table.
 * On success returns the Supabase client + admin user record.
 */
export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) {
    redirect("/dashboard");
  }

  return { supabase, user, adminUser };
}
