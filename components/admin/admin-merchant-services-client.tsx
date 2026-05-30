"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Shield,
  XCircle,
} from "lucide-react";

import {
  activateAgencyMerchantAdminAction,
  activateSubAccountMerchantAdminAction,
  approveMerchantActivationAdminAction,
  deactivateMerchantAdminAction,
  denyMerchantActivationAdminAction,
  updateGlobalFeeConfigAdminAction,
} from "@/actions/merchant.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AgencyRow,
  MerchantAccountRow,
  MerchantActivationRequestRow,
  MerchantAdminOverview,
  MerchantFeeConfigRow,
  MerchantTransactionRow,
} from "@/types/merchant-services";
import { PAYMENT_PROCESSORS } from "@/types/merchant-services";

type ManagedRow = {
  id: string;
  agency_id: string;
  business_id: string;
  label: string | null;
  merchant_services_enabled: boolean;
  agencies?: { id: string; name: string; business_id: string } | null;
  businesses?: { id: string; name: string } | null;
};

type Props = {
  overview: MerchantAdminOverview;
  agencies: AgencyRow[];
  managedBusinesses: ManagedRow[];
  merchantAccounts: (MerchantAccountRow & { businesses?: { id: string; name: string } | null })[];
  pendingRequests: (MerchantActivationRequestRow & { businesses?: { id: string; name: string } | null })[];
  feeConfig: MerchantFeeConfigRow | null;
  recentTransactions: MerchantTransactionRow[];
};

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-white/[0.06]">
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="rounded-lg bg-violet-500/10 p-2">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminMerchantServicesClient({
  overview,
  agencies,
  managedBusinesses,
  merchantAccounts,
  pendingRequests,
  feeConfig,
  recentTransactions,
}: Props) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [platformFee, setPlatformFee] = useState(String(feeConfig?.platform_fee_percent ?? 1));
  const [agencyShare, setAgencyShare] = useState(
    String(feeConfig?.agency_revenue_share_percent ?? 0.25),
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active merchants" value={String(overview.activeMerchantAccounts)} icon={CreditCard} />
        <StatCard label="30d volume" value={`$${overview.volume30d.toLocaleString()}`} icon={DollarSign} />
        <StatCard
          label="Platform revenue (30d)"
          value={`$${overview.platformRevenue30d.toLocaleString()}`}
          icon={Shield}
        />
        <StatCard label="Pending activations" value={String(overview.pendingActivations)} icon={Building2} />
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <Tabs defaultValue="activations">
        <TabsList>
          <TabsTrigger value="activations">Activations</TabsTrigger>
          <TabsTrigger value="agencies">Agencies</TabsTrigger>
          <TabsTrigger value="accounts">Merchant accounts</TabsTrigger>
          <TabsTrigger value="fees">Fees & revenue</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="activations" className="space-y-4">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Pending approval</CardTitle>
              <CardDescription>Approve or deny merchant services activation requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] p-3"
                  >
                    <div>
                      <p className="font-medium">{req.businesses?.name ?? req.business_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.processor} · {req.connection_type} · {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await approveMerchantActivationAdminAction(req.id);
                            setMessage(res.success ? "Approved — Stripe onboarding ready" : res.error);
                          })
                        }
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await denyMerchantActivationAdminAction(req.id);
                            setMessage(res.success ? "Denied" : res.error);
                          })
                        }
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agencies" className="space-y-4">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Agencies</CardTitle>
              <CardDescription>Enable merchant services at the agency level.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {agencies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No agencies registered yet. Agencies are created when a business is marked as an agency partner.
                </p>
              ) : (
                agencies.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{a.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        Processors: {a.allowed_processors.join(", ")}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await activateAgencyMerchantAdminAction(a.id, !a.merchant_services_enabled);
                          setMessage("Agency merchant settings updated");
                        })
                      }
                    >
                      {a.merchant_services_enabled ? "Disable merchant" : "Enable merchant"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Sub-accounts</CardTitle>
              <CardDescription>Control merchant access per client business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {managedBusinesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sub-accounts linked yet.</p>
              ) : (
                managedBusinesses.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{m.businesses?.name ?? m.business_id}</span>
                      <span className="ml-2 text-muted-foreground">
                        Agency: {m.agencies?.name ?? m.agency_id}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await activateSubAccountMerchantAdminAction(m.id, !m.merchant_services_enabled);
                          setMessage("Sub-account updated");
                        })
                      }
                    >
                      {m.merchant_services_enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>All merchant accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {merchantAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{acc.businesses?.name ?? acc.business_id}</span>
                    <span className="ml-2 text-muted-foreground">
                      {acc.processor} · {acc.status}
                      {acc.processor_account_id ? ` · ${acc.processor_account_id.slice(0, 12)}…` : ""}
                    </span>
                  </div>
                  {acc.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await deactivateMerchantAdminAction(acc.business_id);
                          setMessage(res.success ? "Deactivated" : res.error);
                        })
                      }
                    >
                      Deactivate
                    </Button>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Global fee configuration</CardTitle>
              <CardDescription>Platform fees, agency revenue share, and payout rules.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Platform fee %</Label>
                <Input value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} />
              </div>
              <div>
                <Label>Agency revenue share %</Label>
                <Input value={agencyShare} onChange={(e) => setAgencyShare(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await updateGlobalFeeConfigAdminAction({
                        platformFeePercent: Number(platformFee),
                        agencyRevenueSharePercent: Number(agencyShare),
                      });
                      setMessage(res.success ? "Fee config saved" : res.error);
                    })
                  }
                >
                  Save fee config
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Supported processors</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {PAYMENT_PROCESSORS.map((p) => (
                <span
                  key={p.id}
                  className={`rounded-full px-3 py-1 text-xs ${
                    p.available
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {p.label} {p.available ? "· live" : "· coming soon"}
                </span>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Recent merchant transactions</CardTitle>
              <CardDescription>
                Failed: {overview.failedPayments30d} · Open chargebacks: {overview.chargebacksOpen}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                  >
                    <span>
                      ${Number(tx.amount).toFixed(2)} · {tx.status} · {tx.processor}
                    </span>
                    <span className="text-muted-foreground">
                      Platform fee ${Number(tx.platform_fee).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
