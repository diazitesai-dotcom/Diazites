import { Suspense } from "react";

import { AgentDeploymentShell } from "@/components/agents/agent-deployment-shell";
import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";

/** Avoid prerendering without Supabase env (e.g. Vercel build before env is applied). */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSidebarShell
      variant="dashboard"
      brandHref="/dashboard"
      brandTitle="Diazites"
      footerLink={{ href: "/", label: "Marketing site" }}
    >
      <Suspense fallback={null}>
        <AgentDeploymentShell>{children}</AgentDeploymentShell>
      </Suspense>
    </AppSidebarShell>
  );
}
