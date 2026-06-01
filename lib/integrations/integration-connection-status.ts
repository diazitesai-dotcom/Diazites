import type { SupabaseClient } from "@supabase/supabase-js";

import { isAdAccountRowConnected } from "@/lib/integrations/ad-account-connection";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";

/** True when the business has at least one connected ad / broker account. */
export async function businessHasConnectedIntegration(
  client: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("ad_accounts")
    .select("platform, external_account_id, status, connection_status, access_token")
    .eq("business_id", businessId);

  if (error || !data?.length) return false;
  return data.some((row) => isAdAccountRowConnected(row));
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
  businessId?: string | null,
): Promise<boolean> {
  if (checklistFlag) return true;

  let resolvedBusinessId = businessId ?? null;
  if (!resolvedBusinessId) {
    const businesses = createBusinessRepository(client);
    const { data: business } = await businesses.getByOwnerUserId(userId);
    resolvedBusinessId = business?.id ?? null;
  }
  if (!resolvedBusinessId) return false;

  return businessHasConnectedIntegration(client, resolvedBusinessId);
}
