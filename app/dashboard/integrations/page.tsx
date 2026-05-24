import { PageHeader } from "@/components/layout/page-header";
import { IntegrationsClient } from "@/components/integrations/integrations-client";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { listAdAccounts } from "@/services/ad-accounts/ad-account.service";
import { listAgentPermissions } from "@/services/permissions/agent-permission.service";

export default async function IntegrationsPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  let accounts: unknown[] = [];
  let permissions: unknown[] = [];

  if (business) {
    const [acc, perms] = await Promise.all([
      listAdAccounts(supabase, user.id, business.id),
      listAgentPermissions(supabase, user.id, business.id),
    ]);
    accounts = acc.success ? acc.data : [];
    permissions = perms.success ? perms.data : [];
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Ads Engine"
        title="Integrations"
        description="Connect Meta, Google, TikTok, Microsoft, Zernio, and Zapier. Manage agent permissions for campaign operations."
      />
      <IntegrationsClient
        initialAccounts={accounts as never[]}
        initialPermissions={permissions as never[]}
      />
    </div>
  );
}
