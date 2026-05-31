import { PageHeader } from "@/components/layout/page-header";
import { UserControlClient } from "@/components/admin/user-control-client";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { listUsersForAdmin } from "@/lib/access-control/access-control.service";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminUserControlPage() {
  await requireAdmin();
  const service = createServiceRoleClient();
  const result = await listUsersForAdmin(service);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Admin control"
          title="User control"
          description={result.error}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <PageHeader
        eyebrow="Diazites owner"
        title="User control"
        description="Manage customer plans and per-user service access. New signups start on Free with Basic Services and Mission Control only."
      />
      <UserControlClient users={result.data} />
    </div>
  );
}
