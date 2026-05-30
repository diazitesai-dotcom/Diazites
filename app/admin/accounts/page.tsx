import { PageHeader } from "@/components/layout/page-header";
import { PlatformAccountsHubClient } from "@/components/admin/platform-accounts-hub-client";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { loadPlatformAccounts } from "@/services/admin/platform-accounts.service";

export const dynamic = "force-dynamic";

export default async function AdminPlatformAccountsPage() {
  await requireAdmin();
  const service = createServiceRoleClient();
  const { accounts, overview } = await loadPlatformAccounts(service);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <PageHeader
        eyebrow="Diazites Owner"
        title="Platform accounts"
        description="View and manage every agency, sub-account, plan, trial, subscription, feature access, usage limits, billing, and AI activity across the platform."
      />
      <PlatformAccountsHubClient accounts={accounts} overview={overview} />
    </div>
  );
}
