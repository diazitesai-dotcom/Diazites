import { redirect } from "next/navigation";

import { OnboardingCommandCenter } from "@/components/ceo-command-center/onboarding/onboarding-command-center";
import { Button } from "@/components/ui/button";
import { getOnboardingCommandCenterMockData } from "@/lib/ceo-command-center/mock-data";
import { missionControlLandingPath } from "@/lib/auth/mission-control-routing";
import { getOnboardingRoutingState } from "@/lib/auth/onboarding-routing";
import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import { createUserProfile } from "@/lib/auth/user-profile";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signOutAction } from "@/services/auth/actions";
import type { OnboardingStepId } from "@/types/ceo-command-center";

export const dynamic = "force-dynamic";

const ONBOARDING_STEP_IDS = new Set<OnboardingStepId>([
  "business_profile",
  "offer_goals",
  "landing_pages",
  "pipeline_workflow",
  "connect_accounts",
  "ai_agents",
  "ads_agent",
  "tracking",
  "review",
  "launch",
]);

function getRequestedOnboardingStep(step: string | string[] | undefined): OnboardingStepId | null {
  if (typeof step !== "string") return null;
  return ONBOARDING_STEP_IDS.has(step as OnboardingStepId) ? (step as OnboardingStepId) : null;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  await ensurePublicUserRecord(user.id, user.email);
  await createUserProfile(supabase, {
    userId: user.id,
    email: user.email ?? "",
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
  });

  const sp = await searchParams;
  const requestedStep = getRequestedOnboardingStep(sp.step);
  const forceOnboarding = requestedStep !== null;

  const { hasBusiness, onboardingComplete } = await getOnboardingRoutingState(
    supabase,
    user.id,
  );

  if (hasBusiness && onboardingComplete && !forceOnboarding) {
    redirect(missionControlLandingPath({ postLogin: true }));
  }

  const rawError = sp.error;
  const errorMsg =
    typeof rawError === "string"
      ? (() => {
          try {
            return decodeURIComponent(rawError);
          } catch {
            return rawError;
          }
        })()
      : null;

  const mockData = getOnboardingCommandCenterMockData();
  const initialData = requestedStep ? { ...mockData, currentStepId: requestedStep } : mockData;

  return (
    <div className="relative min-h-screen">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-4 sm:right-6 sm:top-6">
        <p className="hidden text-sm text-slate-400 sm:block">
          Signed in as <span className="text-slate-200">{user.email}</span>
        </p>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm" className="rounded-lg text-slate-400">
            Sign out
          </Button>
        </form>
      </div>

      {errorMsg ? (
        <p
          role="alert"
          className="relative z-10 mx-auto mt-16 max-w-5xl rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          {errorMsg}
        </p>
      ) : null}

      <OnboardingCommandCenter initialData={initialData} />
    </div>
  );
}
