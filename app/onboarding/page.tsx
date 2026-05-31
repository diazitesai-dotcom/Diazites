import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { TrialWelcomeBanner } from "@/components/onboarding/trial-welcome-banner";
import { Button } from "@/components/ui/button";
import { draftFromOnboardingRow } from "@/lib/onboarding/draft";
import { CORE_USER_FLOW } from "@/lib/platform/growth-spec";
import { getOnboardingRoutingState } from "@/lib/auth/onboarding-routing";
import { ensurePublicUserRecord } from "@/lib/auth/ensure-public-user";
import { createUserProfile } from "@/lib/auth/user-profile";
import { requireAuth } from "@/lib/auth/session";
import { createOnboardingRepository } from "@/repositories/onboarding.repository";
import { createProfileRepository } from "@/repositories/profile.repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signOutAction } from "@/services/auth/actions";

export const dynamic = "force-dynamic";

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
  const showTrialWelcome = sp.welcome === "trial";

  const { hasBusiness, onboardingComplete } = await getOnboardingRoutingState(
    supabase,
    user.id,
  );

  if (hasBusiness && onboardingComplete) {
    redirect("/dashboard");
  }

  const profiles = createProfileRepository(supabase);
  const { data: profile } = await profiles.getByUserId(user.id);

  const onboardingRepo = createOnboardingRepository(supabase);
  const { data: onboardingRow } = await onboardingRepo.getByUserId(user.id);
  const initialDraft = draftFromOnboardingRow(onboardingRow, {
    email: user.email ?? "",
    ownerName:
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      "",
    businessName: (user.user_metadata?.company_name as string | undefined) ?? "",
    phone: (user.user_metadata?.phone as string | undefined) ?? "",
  });

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

  return (
    <main className="relative min-h-screen px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(139,92,246,0.15),transparent)]" />
      <div className="relative mx-auto max-w-4xl space-y-10">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="text-foreground">{user.email}</span>
          </p>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" className="rounded-lg">
              Sign out
            </Button>
          </form>
        </div>

        {errorMsg ? (
          <p
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          >
            {errorMsg}
          </p>
        ) : null}

        {showTrialWelcome ? <TrialWelcomeBanner /> : null}
        <PageHeader
          eyebrow="Onboarding"
          title="Build your AI growth system"
          description="Five guided steps after account creation — business profile, workspace type, AI agents, integrations, and workspace generation. Mission Control unlocks when you're done."
        />
        <OnboardingWizard initialDraft={initialDraft} />
        <details className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            What happens after setup
          </summary>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {CORE_USER_FLOW.slice(0, 8).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      </div>
    </main>
  );
}
