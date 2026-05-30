import Link from "next/link";

import { MerchantServicesClient } from "@/components/merchant/merchant-services-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createMerchantRepository } from "@/repositories/merchant.repository";
import type {
  MerchantAccountRow,
  MerchantDisputeRow,
  MerchantInvoiceRow,
  MerchantPaymentLinkRow,
  MerchantPayoutRow,
  MerchantRefundRow,
  MerchantSubscriptionRow,
  MerchantTransactionRow,
} from "@/types/merchant-services";

export const dynamic = "force-dynamic";

export default async function MerchantServicesPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Merchant Services"
          title="Payments control center"
          description="Accept payments, automate billing, and connect every transaction to CRM, workflows, and AI agents."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Set up your business to activate merchant services.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding" className={cn(buttonVariants(), "rounded-xl")}>
              Go to onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const repo = createMerchantRepository(supabase);
  const [
    accountRes,
    stats,
    txsRes,
    invoicesRes,
    linksRes,
    subsRes,
    refundsRes,
    disputesRes,
    payoutsRes,
  ] = await Promise.all([
    repo.getMerchantAccount(business.id),
    repo.dashboardStats(business.id),
    repo.listTransactions(business.id),
    repo.listInvoices(business.id),
    repo.listPaymentLinks(business.id),
    repo.listSubscriptions(business.id),
    repo.listRefunds(business.id),
    repo.listDisputes(business.id),
    repo.listPayouts(business.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Merchant Services"
        title="Payments control center"
        description="Accept card & ACH payments, invoices, subscriptions, and payment links — routed through Diazites CRM, workflows, pipelines, and billing automations."
      />
      <MerchantServicesClient
        account={(accountRes.data ?? null) as MerchantAccountRow | null}
        stats={stats}
        transactions={(txsRes.data ?? []) as MerchantTransactionRow[]}
        invoices={(invoicesRes.data ?? []) as MerchantInvoiceRow[]}
        paymentLinks={(linksRes.data ?? []) as MerchantPaymentLinkRow[]}
        subscriptions={(subsRes.data ?? []) as MerchantSubscriptionRow[]}
        refunds={(refundsRes.data ?? []) as MerchantRefundRow[]}
        disputes={(disputesRes.data ?? []) as MerchantDisputeRow[]}
        payouts={(payoutsRes.data ?? []) as MerchantPayoutRow[]}
      />
    </div>
  );
}
