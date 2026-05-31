import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AgentDeploymentShell } from "@/components/agents/agent-deployment-shell";
import { AdminAccessDeniedBanner } from "@/components/layout/admin-access-denied-banner";
import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";
import { getCurrentUserAccess } from "@/lib/access-control/access-control.service";
import { getAccountContext } from "@/lib/auth/account-context";
import { ensureBootstrapPlatformAdmin } from "@/lib/auth/bootstrap-platform-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PlatformServiceKey } from "@/types/access-control";

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

  let enabledServiceKeys: PlatformServiceKey[] | undefined;
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
      }
    } catch {
      /* fall back to default nav so login never hard-500s */
    }
  }

  return (
    <AppSidebarShell
      variant="dashboard"
      brandHref="/dashboard"
      brandTitle="Diazites"
      footerLink={{ href: "/", label: "Marketing site" }}
      account={account}
      enabledServiceKeys={enabledServiceKeys}
      isOwnerAdmin={isOwnerAdmin}
      showPlatformAdminNav={Boolean(account?.isPlatformAdmin || isOwnerAdmin)}
    >
      <Suspense fallback={null}>
        <AdminAccessDeniedBanner />
        <AgentDeploymentShell>{children}</AgentDeploymentShell>
      </Suspense>
    </AppSidebarShell>
  );
}
