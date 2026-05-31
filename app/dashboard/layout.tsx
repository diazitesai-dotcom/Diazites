import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AgentDeploymentShell } from "@/components/agents/agent-deployment-shell";
import { AdminAccessDeniedBanner } from "@/components/layout/admin-access-denied-banner";
import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";
import { getCurrentUserAccess } from "@/lib/access-control/access-control.service";
import { filterNavGroupsByAccess } from "@/lib/access-control/nav-filter";
import { getAccountContext } from "@/lib/auth/account-context";
import { ensureBootstrapPlatformAdmin } from "@/lib/auth/bootstrap-platform-admin";
import { GROWTH_SIDEBAR_GROUPS } from "@/lib/navigation/platform-nav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  }

  let dashboardNavGroups = GROWTH_SIDEBAR_GROUPS;

  if (account) {
    const supabase = await createServerSupabaseClient();
    const accessResult = await getCurrentUserAccess(
      supabase,
      account.userId,
      account.email,
    );
    if (accessResult.success) {
      dashboardNavGroups = filterNavGroupsByAccess(
        GROWTH_SIDEBAR_GROUPS,
        accessResult.data.enabledServiceKeys,
        accessResult.data.isOwnerAdmin,
      );
    }
  }

  return (
    <AppSidebarShell
      variant="dashboard"
      brandHref="/dashboard"
      brandTitle="Diazites"
      footerLink={{ href: "/", label: "Marketing site" }}
      account={account}
      dashboardNavGroups={dashboardNavGroups}
    >
      <Suspense fallback={null}>
        <AdminAccessDeniedBanner />
        <AgentDeploymentShell>{children}</AgentDeploymentShell>
      </Suspense>
    </AppSidebarShell>
  );
}
