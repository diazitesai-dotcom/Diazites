import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAuth } from "@/lib/auth/session";
import { createBusinessRepository } from "@/repositories/business.repository";

export type BusinessContext = {
  userId: string;
  businessId: string;
  business: Record<string, unknown>;
};

export async function requireBusinessContext(
  supabase: SupabaseClient,
): Promise<{ ok: true; ctx: BusinessContext } | { ok: false; error: string }> {
  const user = await requireAuth();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    return { ok: false, error: "Create a business profile first." };
  }
  return {
    ok: true,
    ctx: {
      userId: user.id,
      businessId: business.id,
      business: business as Record<string, unknown>,
    },
  };
}
