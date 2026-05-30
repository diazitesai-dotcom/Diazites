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

    async listAll() {
      return client
        .from("admin_users")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });
    },

    async countAdmins() {
      return client.from("admin_users").select("id", { count: "exact", head: true });
    },

    async findUserByEmail(email: string) {
      const normalized = email.trim().toLowerCase();
      return client.from("users").select("id, email").ilike("email", normalized).maybeSingle();
    },

    async grantAdmin(userId: string, role = "admin") {
      return client
        .from("admin_users")
        .upsert({ user_id: userId, role }, { onConflict: "user_id" })
        .select("id, user_id, role, created_at")
        .single();
    },

    async revokeAdmin(userId: string) {
      return client.from("admin_users").delete().eq("user_id", userId);
    },
  };
}

export type AdminUsersRepository = ReturnType<typeof createAdminUsersRepository>;
