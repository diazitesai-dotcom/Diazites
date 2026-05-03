import type { SupabaseClient } from "@supabase/supabase-js";

import type { BusinessUpsertInput } from "@/types/backend";

export function createBusinessRepository(client: SupabaseClient) {
  return {
    async getByOwnerUserId(ownerUserId: string) {
      return client
        .from("businesses")
        .select("*")
        .eq("user_id", ownerUserId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    },

    async getById(businessId: string) {
      return client.from("businesses").select("*").eq("id", businessId).maybeSingle();
    },

    async insert(input: {
      ownerUserId: string;
      name: string;
      website?: string | null;
      serviceArea?: string | null;
      cityState?: string | null;
      services?: string | null;
      businessHours?: string | null;
      monthlyBudget?: number;
      logoUrl?: string | null;
    }) {
      return client
        .from("businesses")
        .insert({
          user_id: input.ownerUserId,
          name: input.name,
          website: input.website ?? null,
          service_area: input.serviceArea ?? null,
          city_state: input.cityState ?? null,
          services: input.services ?? null,
          business_hours: input.businessHours ?? null,
          monthly_budget: input.monthlyBudget ?? 0,
          logo_url: input.logoUrl ?? null,
        })
        .select("*")
        .single();
    },

    async update(businessId: string, data: Partial<BusinessUpsertInput>) {
      const row: Record<string, unknown> = {};
      if (data.name !== undefined) row.name = data.name;
      if (data.website !== undefined) row.website = data.website;
      if (data.serviceArea !== undefined) row.service_area = data.serviceArea;
      if (data.cityState !== undefined) row.city_state = data.cityState;
      if (data.services !== undefined) row.services = data.services;
      if (data.businessHours !== undefined) row.business_hours = data.businessHours;
      if (data.monthlyBudget !== undefined) row.monthly_budget = data.monthlyBudget;
      if (data.logoUrl !== undefined) row.logo_url = data.logoUrl;

      return client.from("businesses").update(row).eq("id", businessId).select("*").single();
    },

    async listAll() {
      return client.from("businesses").select("*").order("created_at", { ascending: false });
    },
  };
}
