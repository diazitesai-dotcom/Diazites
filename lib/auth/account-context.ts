import { createBusinessRepository } from "@/repositories/business.repository";
import { createProfileRepository } from "@/repositories/profile.repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AccountContext = {
  userId: string;
  email: string;
  fullName: string | null;
  businessName: string | null;
  isPlatformAdmin: boolean;
};

/**
 * Loads display context for the header account menu (dashboard + admin shells).
 */
export async function getAccountContext(): Promise<AccountContext | null> {
  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profiles = createProfileRepository(supabase);
  const businesses = createBusinessRepository(supabase);

  const [{ data: profile }, { data: business }, { data: adminUser }] = await Promise.all([
    profiles.getByUserId(user.id),
    businesses.getByOwnerUserId(user.id),
    supabase.from("admin_users").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    businessName: business?.name ?? null,
    isPlatformAdmin: Boolean(adminUser),
  };
}
