import type { SupabaseClient } from "@supabase/supabase-js";

export type LandingPageRow = {
  id: string;
  business_id: string;
  slug: string;
  headline: string | null;
  offer: string | null;
  location: string | null;
  config: Record<string, unknown>;
  published: boolean;
  engine_run_id: string | null;
  engine_asset_id: string | null;
  created_at: string;
  updated_at: string;
};

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
      engineRunId?: string | null;
      engineAssetId?: string | null;
    }) {
      const { data: existing } = await client
        .from("landing_pages")
        .select("id")
        .eq("business_id", input.businessId)
        .eq("slug", input.slug)
        .maybeSingle();

      const row: Record<string, unknown> = {
        business_id: input.businessId,
        slug: input.slug,
        headline: input.headline ?? null,
        offer: input.offer ?? null,
        location: input.location ?? null,
        config: input.config ?? {},
        published: input.published ?? false,
        updated_at: new Date().toISOString(),
      };
      if (input.engineRunId !== undefined) row.engine_run_id = input.engineRunId;
      if (input.engineAssetId !== undefined) row.engine_asset_id = input.engineAssetId;

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

    async getBySlug(slug: string, businessId?: string) {
      let query = client.from("landing_pages").select("*").eq("slug", slug);
      if (businessId) query = query.eq("business_id", businessId);
      return query.maybeSingle();
    },

    async listByBusiness(businessId: string) {
      return client.from("landing_pages").select("*").eq("business_id", businessId);
    },

    async slugExists(businessId: string, slug: string) {
      return client
        .from("landing_pages")
        .select("id")
        .eq("business_id", businessId)
        .eq("slug", slug)
        .maybeSingle();
    },
  };
}
