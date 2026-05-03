import type { SupabaseClient } from "@supabase/supabase-js";

export function createLandingPageRepository(client: SupabaseClient) {
  return {
    async upsertBySlug(input: {
      businessId: string;
      slug: string;
      headline?: string | null;
      offer?: string | null;
      location?: string | null;
      config?: Record<string, unknown>;
      published?: boolean;
    }) {
      const { data: existing } = await client
        .from("landing_pages")
        .select("id")
        .eq("business_id", input.businessId)
        .eq("slug", input.slug)
        .maybeSingle();

      const row = {
        business_id: input.businessId,
        slug: input.slug,
        headline: input.headline ?? null,
        offer: input.offer ?? null,
        location: input.location ?? null,
        config: input.config ?? {},
        published: input.published ?? false,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        return client.from("landing_pages").update(row).eq("id", existing.id).select("*").single();
      }

      return client.from("landing_pages").insert(row).select("*").single();
    },

    async getPublishedBySlug(slug: string) {
      return client
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
    },

    async listByBusiness(businessId: string) {
      return client.from("landing_pages").select("*").eq("business_id", businessId);
    },
  };
}
