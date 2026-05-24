import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { listLandingPagesForBusiness } from "@/services/landing/landing-page-editor.service";

export async function loadFunnelPageData() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return { businessId: null, pages: [] };
  }

  const result = await listLandingPagesForBusiness(supabase, user.id, business.id);
  return {
    businessId: business.id,
    pages: result.success ? (result.data as unknown[]) : [],
  };
}
