import { AdminUsersManagerClient } from "@/components/admin/admin-users-manager-client";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { loadPlatformAdminUsers } from "@/services/admin/admin-users.service";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const service = createServiceRoleClient();
  const result = await loadPlatformAdminUsers(service);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-4xl space-y-10">
        <PageHeader
          eyebrow="Access control"
          title="Admin user manager"
          description="Grant or revoke platform operator access for Diazites staff."
        />
        <p className="text-sm text-destructive">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        eyebrow="Access control"
        title="Admin user manager"
        description="Grant or revoke platform operator access. Admins can use /admin and the Platform admin link in the account menu."
      />
      <AdminUsersManagerClient admins={result.data} currentUserId={user.id} />
    </div>
  );
}
