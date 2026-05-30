import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AgentDeploymentShell } from "@/components/agents/agent-deployment-shell";
import { AdminAccessDeniedBanner } from "@/components/layout/admin-access-denied-banner";
import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";
import { getAccountContext } from "@/lib/auth/account-context";
import { ensureBootstrapPlatformAdmin } from "@/lib/auth/bootstrap-platform-admin";
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

  return (
    <AppSidebarShell
      variant="dashboard"
      brandHref="/dashboard"
      brandTitle="Diazites"
      footerLink={{ href: "/", label: "Marketing site" }}
      account={account}
    >
      <Suspense fallback={null}>
        <AdminAccessDeniedBanner />
        <AgentDeploymentShell>{children}</AgentDeploymentShell>
      </Suspense>    </AppSidebarShell>
  );
}
