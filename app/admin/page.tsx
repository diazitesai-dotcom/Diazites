import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSystemMetrics } from "@/services/admin/admin.service";
import { loadPlatformAccounts } from "@/services/admin/platform-accounts.service";
import { Building2, Layers, Network, ShieldAlert, UserCircle2, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const service = createServiceRoleClient();
  const [{ overview }, metricsRes] = await Promise.all([
    loadPlatformAccounts(service),
    getSystemMetrics(service),
  ]);
  const metrics = metricsRes.success ? metricsRes.data : { businesses: 0, users: 0, leads: 0 };

  const modules: [string, string][] = [
    ["Auth & OAuth setup", "/admin/setup"],
    ["Platform accounts", "/admin/accounts"],
    ["Admin user manager", "/admin/users"],
    ["Agents & MCP", "/admin/agents"],
    ["AI Usage", "/admin/usage"],
    ["Merchant Services", "/admin/merchant-services"],
    ["Promo codes", "/admin/promo-codes"],
    ["Onboarding Tracker", "/admin/onboarding"],
    ["Audit Log", "/admin/audit"],
    ["Templates", "/admin/templates"],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <PageHeader
        eyebrow="Internal"
        title="Diazites Owner / Admin"
        description="Operational oversight across tenants, hierarchy, billing, entitlements, and automation health."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Platform accounts"
          value={String(overview.totalAccounts)}
          icon={Building2}
          hint={`${overview.agencies} agencies · ${overview.subAccounts} sub-accounts`}
          trend="neutral"
        />
        <StatCard
          label="Active trials"
          value={String(overview.activeTrials)}
          icon={UserCircle2}
          hint={`${overview.pendingApproval} pending approval`}
          trend="neutral"
        />
        <StatCard
          label="Suspended"
          value={String(overview.suspended)}
          icon={ShieldAlert}
          hint={`${overview.merchantActive} merchants active`}
          trend={overview.suspended > 0 ? "down" : "neutral"}
        />
        <StatCard
          label="Businesses (DB)"
          value={String(metrics.businesses)}
          icon={Network}
          hint={`${metrics.users} users · ${metrics.leads} leads`}
          trend="up"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Agencies" value={String(overview.agencies)} icon={Network} trend="neutral" />
        <StatCard
          label="Sub-accounts"
          value={String(overview.subAccounts)}
          icon={Layers}
          trend="neutral"
        />
        <StatCard
          label="Direct accounts"
          value={String(overview.directAccounts)}
          icon={Building2}
          trend="neutral"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Modules</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map(([name, href]) => (
            <Card key={name} className="border-white/[0.06] transition-transform hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle className="text-base">{name}</CardTitle>
                <CardDescription>
                  <Link
                    className="font-medium text-violet-400 underline-offset-4 hover:underline"
                    href={href}
                  >
                    Open module
                  </Link>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white/[0.06] p-4 text-sm text-muted-foreground">
        <p>
          Hierarchy: <strong className="text-foreground">Diazites Owner</strong> → Agency →
          Sub-account / Client → Users. Manage all accounts from{" "}
          <Link href="/admin/accounts" className="text-violet-400 hover:underline">
            Platform accounts
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
