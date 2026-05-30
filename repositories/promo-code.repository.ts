import type { SupabaseClient } from "@supabase/supabase-js";

export type PromoCodeRow = {
  id: string;
  code: string;
  trial_days: number;
  max_uses: number | null;
  use_count: number;
  single_use_per_user: boolean;
  expires_at: string | null;
  active: boolean;
  affiliate_id: string | null;
  source: string | null;
  admin_notes: string | null;
};

export function createPromoCodeRepository(client: SupabaseClient) {
  return {
    async getByCode(code: string) {
      return client
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("active", true)
        .maybeSingle();
    },

    async listAll() {
      return client.from("promo_codes").select("*").order("created_at", { ascending: false });
    },

    async create(input: {
      code: string;
      trialDays: number;
      maxUses?: number | null;
      singleUsePerUser?: boolean;
      expiresAt?: string | null;
      source?: string;
      adminNotes?: string;
    }) {
      return client
        .from("promo_codes")
        .insert({
          code: input.code.toUpperCase(),
          trial_days: input.trialDays,
          max_uses: input.maxUses ?? null,
          single_use_per_user: input.singleUsePerUser ?? true,
          expires_at: input.expiresAt ?? null,
          source: input.source ?? null,
          admin_notes: input.adminNotes ?? null,
        })
        .select("*")
        .single();
    },

    async incrementUseCount(id: string, currentCount: number) {
      return client
        .from("promo_codes")
        .update({ use_count: currentCount + 1, updated_at: new Date().toISOString() })
        .eq("id", id);
    },

    async update(id: string, patch: Partial<{ active: boolean; max_uses: number; admin_notes: string }>) {
      return client
        .from("promo_codes")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
    },

    async delete(id: string) {
      return client.from("promo_codes").delete().eq("id", id);
    },

    async recordRedemption(input: {
      promoCodeId: string;
      userId: string;
      businessId?: string | null;
      trialDaysGranted: number;
    }) {
      return client.from("promo_code_redemptions").insert({
        promo_code_id: input.promoCodeId,
        user_id: input.userId,
        business_id: input.businessId ?? null,
        trial_days_granted: input.trialDaysGranted,
      });
    },

    async hasUserRedeemed(promoCodeId: string, userId: string) {
      return client
        .from("promo_code_redemptions")
        .select("id")
        .eq("promo_code_id", promoCodeId)
        .eq("user_id", userId)
        .maybeSingle();
    },

    async savePendingSignupPromo(userId: string, promoCode: string, trialDays: number) {
      return client.from("signup_promo_pending").upsert({
        user_id: userId,
        promo_code: promoCode.toUpperCase(),
        trial_days: trialDays,
      });
    },

    async getPendingSignupPromo(userId: string) {
      return client.from("signup_promo_pending").select("*").eq("user_id", userId).maybeSingle();
    },

    async clearPendingSignupPromo(userId: string) {
      return client.from("signup_promo_pending").delete().eq("user_id", userId);
    },
  };
}
