"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { BusinessProfile } from "@/types/platform-growth";
import type { AttributionModel } from "@/types/revenue-attribution";

const ATTRIBUTION_MODELS: AttributionModel[] = [
  "first_touch",
  "last_touch",
  "multi_touch",
  "linear",
  "ai_assisted",
  "manual_override",
];

function parseProfile(raw: unknown): BusinessProfile {
  if (!raw || typeof raw !== "object") return {};
  return raw as BusinessProfile;
}

export async function updateAttributionSettingsAction(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) return { success: false as const, error: "No business" };

  const model = String(formData.get("attribution_model") ?? "") as AttributionModel;
  if (!ATTRIBUTION_MODELS.includes(model)) {
    return { success: false as const, error: "Invalid attribution model" };
  }

  const profile = parseProfile(business.profile);
  profile.attributionModel = model;

  const shopDomain = String(formData.get("shopify_shop_domain") ?? "").trim();
  const shopSecret = String(formData.get("shopify_webhook_secret") ?? "").trim();
  if (shopDomain) profile.shopifyShopDomain = shopDomain;
  else delete profile.shopifyShopDomain;
  if (shopSecret) profile.shopifyWebhookSecret = shopSecret;

  const { error } = await businesses.updateProfile(business.id, profile);
  if (error) return { success: false as const, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/organization");
  return { success: true as const };
}
