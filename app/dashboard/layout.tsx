import { Suspense } from "react";

import { AgentDeploymentShell } from "@/components/agents/agent-deployment-shell";
import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";
import { getAccountContext } from "@/lib/auth/account-context";

/** Avoid prerendering without Supabase env (e.g. Vercel build before env is applied). */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getAccountContext();

  return (
    <AppSidebarShell
      variant="dashboard"
      brandHref="/dashboard"
      brandTitle="Diazites"
      footerLink={{ href: "/", label: "Marketing site" }}
      account={account}
    >
      <Suspense fallback={null}>
        <AgentDeploymentShell>{children}</AgentDeploymentShell>
      </Suspense>
    </AppSidebarShell>
  );
}
