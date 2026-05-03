import type { SupabaseClient } from "@supabase/supabase-js";

export function createAdminUsersRepository(client: SupabaseClient) {
  return {
    async isAdmin(userId: string) {
      const { data, error } = await client
        .from("admin_users")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      return { isAdmin: !!data?.id && !error, error };
    },
  };
}
