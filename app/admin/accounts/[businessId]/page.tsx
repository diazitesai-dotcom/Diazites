import { notFound } from "next/navigation";

import { PlatformAccountDetailClient } from "@/components/admin/platform-account-detail-client";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { loadPlatformAccountDetail } from "@/services/admin/platform-accounts.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ businessId: string }> };

export default async function AdminPlatformAccountDetailPage({ params }: Props) {
  await requireAdmin();
  const { businessId } = await params;
  const service = createServiceRoleClient();
  const { account, aiActivity } = await loadPlatformAccountDetail(service, businessId);

  if (!account) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16">
      <PlatformAccountDetailClient account={account} aiActivity={aiActivity} />
    </div>
  );
}
