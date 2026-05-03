import type { SupabaseClient } from "@supabase/supabase-js";

export function createUserRepository(client: SupabaseClient) {
  return {
    async getById(userId: string) {
      return client.from("users").select("*").eq("id", userId).maybeSingle();
    },

    async listByIds(userIds: string[]) {
      if (userIds.length === 0) return { data: [] as { id: string; email: string }[], error: null };
      return client.from("users").select("id, email").in("id", userIds);
    },
  };
}
