import type { SupabaseClient } from "@supabase/supabase-js";

import type { OnboardingStageDb } from "@/types/backend";

export function createOnboardingRepository(client: SupabaseClient) {
  return {
    async getByUserId(userId: string) {
      return client.from("onboarding").select("*").eq("user_id", userId).maybeSingle();
    },

    async saveDraft(payload: {
      userId: string;
      businessName: string;
      ownerName: string;
      email: string;
      phone: string;
      website: string;
      serviceArea: string;
      cityState: string;
      services: string;
      businessHours: string;
      monthlyBudget: number;
      profileData?: Record<string, unknown>;
    }) {
      const { data: existing } = await client
        .from("onboarding")
        .select("checklist")
        .eq("user_id", payload.userId)
        .maybeSingle();

      const defaultChecklist = {
        profile_complete: false,
        integrations_connected: false,
        agents_assigned: false,
        campaign_built: false,
        landing_page_ready: false,
        ai_active: false,
        team_invited: false,
      };

      return client
        .from("onboarding")
        .upsert(
          {
            user_id: payload.userId,
            business_name: payload.businessName,
            owner_name: payload.ownerName,
            email: payload.email,
            phone: payload.phone,
            website: payload.website,
            service_area: payload.serviceArea,
            city_state: payload.cityState,
            services: payload.services,
            business_hours: payload.businessHours,
            monthly_budget: payload.monthlyBudget,
            profile_data: payload.profileData ?? {},
            stage: "profile",
            status: "in_progress",
            checklist: (existing?.checklist as Record<string, boolean> | null) ?? defaultChecklist,
          },
          { onConflict: "user_id" },
        )
        .select("id")
        .single();
    },

    async upsertFull(payload: {
      userId: string;
      businessName: string;
      ownerName: string;
      email: string;
      phone: string;
      website: string;
      serviceArea: string;
      cityState: string;
      services: string;
      businessHours: string;
      monthlyBudget: number;
      stage?: OnboardingStageDb;
      status?: string;
      checklist?: Record<string, boolean>;
      profileData?: Record<string, unknown>;
    }) {
      return client
        .from("onboarding")
        .upsert(
          {
            user_id: payload.userId,
            business_name: payload.businessName,
            owner_name: payload.ownerName,
            email: payload.email,
            phone: payload.phone,
            website: payload.website,
            service_area: payload.serviceArea,
            city_state: payload.cityState,
            services: payload.services,
            business_hours: payload.businessHours,
            monthly_budget: payload.monthlyBudget,
            profile_data: payload.profileData ?? {},
            stage: payload.stage ?? "profile",
            status: payload.status ?? "completed",
            checklist:
              payload.checklist ??
              ({
                profile_complete: false,
                integrations_connected: false,
                agents_assigned: false,
                campaign_built: false,
                landing_page_ready: false,
                ai_active: false,
                team_invited: false,
              } as Record<string, boolean>),
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();
    },

    async updateStage(userId: string, stage: OnboardingStageDb) {
      return client.from("onboarding").update({ stage }).eq("user_id", userId).select("*").single();
    },

    async listAllForAdmin() {
      return client.from("onboarding").select("*").order("created_at", { ascending: false });
    },
  };
}
