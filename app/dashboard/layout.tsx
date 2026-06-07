import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AgentDeploymentShell } from "@/components/agents/agent-deployment-shell";
import { CeoCommandCenterShell } from "@/components/ceo-command-center/ceo-command-center-shell";
import { SetupReturnBar } from "@/components/dashboard/setup-return-bar";
import { AdminAccessDeniedBanner } from "@/components/layout/admin-access-denied-banner";
import { OnboardingCompleteBanner } from "@/components/onboarding/onboarding-complete-banner";
import { getCurrentUserAccess } from "@/lib/access-control/access-control.service";
import { getOnboardingRoutingState, onboardingEntryPath, shouldRequireOnboarding } from "@/lib/auth/onboarding-routing";
import { getAccountContext } from "@/lib/auth/account-context";
import { ensureBootstrapPlatformAdmin } from "@/lib/auth/bootstrap-platform-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PlatformServiceKey } from "@/types/access-control";
import type { EntitlementPlanKey } from "@/types/entitlements";
import { getEntitlements } from "@/services/entitlements/account-entitlements.service";
import { createBusinessRepository } from "@/repositories/business.repository";

/** Avoid prerendering without Supabase env (e.g. Vercel build before env is applied). */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getAccountContext();

  if (account && !account.isPlatformAdmin) {
    const granted = await ensureBootstrapPlatformAdmin({
      id: account.userId,
      email: account.email,
    });
    if (granted) {
      redirect("/admin");
    }

    try {
      const supabase = await createServerSupabaseClient();
      const routing = await getOnboardingRoutingState(supabase, account.userId);
      if (shouldRequireOnboarding(routing.hasBusiness, account.isPlatformAdmin)) {
        redirect(onboardingEntryPath(true));
      }
    } catch {
      /* allow dashboard if routing check fails */
    }
  }

  let enabledServiceKeys: PlatformServiceKey[] | undefined;
  let entitlementPlanKey: EntitlementPlanKey = "starter";
  let isOwnerAdmin = false;

  if (account) {
    try {
      const supabase = await createServerSupabaseClient();
      const accessResult = await getCurrentUserAccess(
        supabase,
        account.userId,
        account.email,
      );
      if (accessResult.success) {
        enabledServiceKeys = accessResult.data.enabledServiceKeys;
        isOwnerAdmin = accessResult.data.isOwnerAdmin;
        const plan = accessResult.data.planKey;
        if (plan === "starter" || plan === "trial" || plan === "growth" || plan === "pro" || plan === "enterprise") {
          entitlementPlanKey = plan;
        } else if (plan === "free") {
          entitlementPlanKey = "starter";
        }
      }
      const businesses = createBusinessRepository(supabase);
      const { data: business } = await businesses.getByOwnerUserId(account.userId);
      if (business) {
        const ent = await getEntitlements(supabase, business.id);
        if (ent.success) entitlementPlanKey = ent.data.planKey;
      }
    } catch {
      /* fall back to default nav so login never hard-500s */
    }
  }

  void enabledServiceKeys;
  void entitlementPlanKey;
  void isOwnerAdmin;

  return (
    <CeoCommandCenterShell>
      <SetupReturnBar />
      <Suspense fallback={null}>
        <AdminAccessDeniedBanner />
        <OnboardingCompleteBanner />
        <AgentDeploymentShell>
          <div className="flex min-h-0 flex-1 flex-col px-4 py-6 md:px-6 md:py-8">{children}</div>
        </AgentDeploymentShell>
      </Suspense>
    </CeoCommandCenterShell>
  );
}
