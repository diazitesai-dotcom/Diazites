import type { SupabaseClient } from "@supabase/supabase-js";

import { createBusinessRepository } from "@/repositories/business.repository";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";

/** True when the business has at least one connected ad / broker account. */
export async function businessHasConnectedIntegration(
  client: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data } = await client
    .from("ad_accounts")
    .select("id")
    .eq("business_id", businessId)
    .in("status", ["connected", "pending"])
    .limit(1);

  return (data ?? []).length > 0;
}

/** Persist Mission Control checklist: integrations_connected = true */
export async function markIntegrationsConnectedForUser(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const onboarding = createOnboardingRepository(client);
  const { data } = await onboarding.getByUserId(userId);
  if (!data) return;

  const checklist = {
    ...((data.checklist ?? {}) as Record<string, boolean>),
    integrations_connected: true,
  };

  await client.from("onboarding").update({ checklist }).eq("user_id", userId);
}

export async function resolveIntegrationsConnectedForUser(
  client: SupabaseClient,
  userId: string,
  checklistFlag: boolean,
): Promise<boolean> {
  if (checklistFlag) return true;

  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getByOwnerUserId(userId);
  if (!business) return false;

  return businessHasConnectedIntegration(client, business.id);
}
