import Link from "next/link";

import { UserDetailControlClient } from "@/components/admin/user-detail-control-client";
import { PageHeader } from "@/components/layout/page-header";
import { getUserAdminDetails } from "@/lib/access-control/access-control.service";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserDetailPage({ params }: Props) {
  await requireAdmin();
  const { userId } = await params;
  const service = createServiceRoleClient();
  const result = await getUserAdminDetails(service, userId);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href="/admin/user-control" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← Back to users
        </Link>
        <PageHeader title="User not found" description={result.error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <Link href="/admin/user-control" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
        ← Back to users
      </Link>
      <PageHeader
        eyebrow="User detail"
        title="Service & plan control"
        description="Enable or disable product tabs for this account."
      />
      <UserDetailControlClient details={result.data} />
    </div>
  );
}
