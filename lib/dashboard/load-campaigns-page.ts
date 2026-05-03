import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { getCampaignsByBusiness } from "@/services/campaigns/campaign.service";

export type CampaignRow = {
  id: string;
  platform: string;
  budget: number;
  goal: string | null;
  location: string | null;
  status: string | null;
  spend: number;
  leads_count: number | null;
  cpl: number | null;
  conversion_rate: number | null;
};

export async function loadCampaignsPageData(): Promise<{
  campaigns: CampaignRow[];
  businessId: string | null;
}> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    return { campaigns: [], businessId: null };
  }

  const res = await getCampaignsByBusiness(supabase, user.id, business.id);
  if (!res.success || !res.data) {
    return { campaigns: [], businessId: business.id };
  }

  return {
    businessId: business.id,
    campaigns: res.data as CampaignRow[],
  };
}
