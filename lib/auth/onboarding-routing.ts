import type { SupabaseClient } from "@supabase/supabase-js";

import { createBusinessRepository } from "@/repositories/business.repository";

export type OnboardingRoutingState = {
  hasBusiness: boolean;
  onboardingComplete: boolean;
};

export async function getOnboardingRoutingState(
  client: SupabaseClient,
  userId: string,
): Promise<OnboardingRoutingState> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getByOwnerUserId(userId);

  if (!business) {
    return { hasBusiness: false, onboardingComplete: false };
  }

  const { data: onboarding } = await client
    .from("onboarding")
    .select("stage, status")
    .eq("user_id", userId)
    .maybeSingle();

  const onboardingComplete =
    onboarding?.status === "completed" ||
    onboarding?.stage === "live" ||
    onboarding?.stage === "optimize";

  return { hasBusiness: true, onboardingComplete };
}

/** Customer accounts without a business must finish onboarding first. */
export function shouldRequireOnboarding(
  hasBusiness: boolean,
  isPlatformAdmin: boolean,
): boolean {
  if (isPlatformAdmin) return false;
  return !hasBusiness;
}

export function onboardingEntryPath(welcomeTrial = true): string {
  return welcomeTrial ? "/onboarding?welcome=trial" : "/onboarding";
}
