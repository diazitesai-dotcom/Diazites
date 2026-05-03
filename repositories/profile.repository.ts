import type { SupabaseClient } from "@supabase/supabase-js";

export function createProfileRepository(client: SupabaseClient) {
  return {
    async getByUserId(userId: string) {
      return client.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    },

    async linkBusiness(userId: string, businessId: string) {
      return client.from("profiles").update({ business_id: businessId }).eq("user_id", userId);
    },

    async upsert(input: {
      userId: string;
      businessId?: string | null;
      fullName?: string | null;
      phone?: string | null;
      role?: string;
    }) {
      return client.from("profiles").upsert(
        {
          user_id: input.userId,
          business_id: input.businessId ?? null,
          full_name: input.fullName ?? null,
          phone: input.phone ?? null,
          role: input.role ?? "owner",
        },
        { onConflict: "user_id" },
      );
    },
  };
}
