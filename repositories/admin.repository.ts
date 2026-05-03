import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Intended for Supabase service-role client only (bypasses RLS).
 */
export function createAdminRepository(client: SupabaseClient) {
  return {
    async listBusinessesWithOwners() {
      const { data: businesses, error: bErr } = await client
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (bErr || !businesses?.length) {
        return { data: [], error: bErr };
      }

      const ownerIds = [...new Set(businesses.map((b) => b.user_id))];
      const { data: users, error: uErr } = await client
        .from("users")
        .select("id, email")
        .in("id", ownerIds);

      if (uErr) return { data: [], error: uErr };

      const emailByUserId = new Map(users?.map((u) => [u.id, u.email]) ?? []);

      return {
        data: businesses.map((b) => ({
          ...b,
          owner_email: emailByUserId.get(b.user_id) ?? null,
        })),
        error: null,
      };
    },

    async listUsers() {
      return client.from("users").select("*").order("created_at", { ascending: false });
    },

    async assignAgentForBusiness(businessId: string, agentType: string, status: string) {
      return client
        .from("agents")
        .upsert(
          {
            business_id: businessId,
            agent_type: agentType,
            status,
            activated_at: new Date().toISOString(),
          },
          { onConflict: "business_id,agent_type" },
        )
        .select("*")
        .single();
    },

    async updateOnboardingRow(userId: string, patch: Record<string, unknown>) {
      return client.from("onboarding").update(patch).eq("user_id", userId).select("*").single();
    },
  };
}
