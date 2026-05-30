import { redirect } from "next/navigation";

import { AdminMerchantServicesClient } from "@/components/admin/admin-merchant-services-client";
import { PageHeader } from "@/components/layout/page-header";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMerchantRepository } from "@/repositories/merchant.repository";
import type {
  AgencyRow,
  MerchantAccountRow,
  MerchantActivationRequestRow,
  MerchantFeeConfigRow,
  MerchantTransactionRow,
} from "@/types/merchant-services";

export const dynamic = "force-dynamic";

export default async function AdminMerchantServicesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminUser) redirect("/dashboard");

  const repo = createMerchantRepository(supabase);
  const [overview, agenciesRes, managedRes, accountsRes, pendingRes, feeRes, txsRes] =
    await Promise.all([
      repo.adminOverview(),
      repo.listAgencies(),
      repo.listAllManagedBusinesses(),
      repo.listMerchantAccounts(),
      repo.listActivationRequests("pending"),
      repo.getGlobalFeeConfig(),
      supabase
        .from("merchant_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Merchant Services Activation"
        description="Activate merchant services for agencies and sub-accounts, configure fees, approve processors, and monitor platform revenue."
      />
      <AdminMerchantServicesClient
        overview={overview}
        agencies={(agenciesRes.data ?? []) as AgencyRow[]}
        managedBusinesses={(managedRes.data ?? []) as Parameters<
          typeof AdminMerchantServicesClient
        >[0]["managedBusinesses"]}
        merchantAccounts={(accountsRes.data ?? []) as (MerchantAccountRow & {
          businesses?: { id: string; name: string } | null;
        })[]}
        pendingRequests={(pendingRes.data ?? []) as (MerchantActivationRequestRow & {
          businesses?: { id: string; name: string } | null;
        })[]}
        feeConfig={(feeRes.data ?? null) as MerchantFeeConfigRow | null}
        recentTransactions={(txsRes.data ?? []) as MerchantTransactionRow[]}
      />
    </div>
  );
}
