"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  DollarSign,
  ExternalLink,
  Link2,
  Receipt,
  RefreshCw,
  Wallet,
} from "lucide-react";

import {
  connectStripeMerchantAction,
  createPaymentLinkAction,
  requestMerchantActivationAction,
} from "@/actions/merchant.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  MerchantAccountRow,
  MerchantDashboardStats,
  MerchantDisputeRow,
  MerchantInvoiceRow,
  MerchantPaymentLinkRow,
  MerchantPayoutRow,
  MerchantRefundRow,
  MerchantSubscriptionRow,
  MerchantTransactionRow,
} from "@/types/merchant-services";
import { MERCHANT_AI_AGENTS, PAYMENT_PROCESSORS } from "@/types/merchant-services";

type Props = {
  account: MerchantAccountRow | null;
  stats: MerchantDashboardStats;
  transactions: MerchantTransactionRow[];
  invoices: MerchantInvoiceRow[];
  paymentLinks: MerchantPaymentLinkRow[];
  subscriptions: MerchantSubscriptionRow[];
  refunds: MerchantRefundRow[];
  disputes: MerchantDisputeRow[];
  payouts: MerchantPayoutRow[];
};

function isActive(account: MerchantAccountRow | null): boolean {
  return account?.status === "active";
}

function isPending(account: MerchantAccountRow | null): boolean {
  return (
    account != null &&
    ["pending", "pending_approval", "onboarding"].includes(account.status)
  );
}

export function MerchantServicesClient({
  account,
  stats,
  transactions,
  invoices,
  paymentLinks,
  subscriptions,
  refunds,
  disputes,
  payouts,
}: Props) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [linkName, setLinkName] = useState("");
  const [linkAmount, setLinkAmount] = useState("");

  const active = isActive(account);

  if (!account || account.status === "deactivated" || account.status === "rejected") {
    return (
      <div className="space-y-6">
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-violet-400" />
              Activate Merchant Services
            </CardTitle>
            <CardDescription>
              Accept payments, automate billing, and connect payments to your CRM, workflows,
              pipelines, and AI agents — all through Diazites.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stripe is the default processor. Square, PayPal, Authorize.net, and Clover are
              supported in the architecture and will roll out next. You can also connect an existing
              merchant account where API access is available.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await requestMerchantActivationAction({
                      processor: "stripe",
                      connectionType: "stripe_connect",
                    });
                    setMessage(res.success ? "Activation requested — admin will review" : res.error);
                  })
                }
              >
                Activate Merchant Services (Stripe)
              </Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await requestMerchantActivationAction({
                      processor: "external",
                      connectionType: "external_api",
                      notes: "Existing merchant account connection requested",
                    });
                    setMessage(res.success ? "External account request submitted" : res.error);
                  })
                }
              >
                Connect Existing Merchant Account
              </Button>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending(account)) {
    return (
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Merchant services {account.status.replace("_", " ")}</CardTitle>
          <CardDescription>
            {account.status === "onboarding"
              ? "Complete Stripe onboarding to start accepting payments."
              : "Your activation request is being reviewed by Diazites admin."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {account.status === "onboarding" ? (
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await connectStripeMerchantAction();
                  if (res.success && res.data.url) {
                    window.location.href = res.data.url;
                  } else {
                    setMessage(res.success ? "" : res.error);
                  }
                })
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect Stripe
            </Button>
          ) : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/[0.06]">
          <CardContent className="flex items-center gap-3 pt-6">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs text-muted-foreground">30d volume</p>
              <p className="text-lg font-semibold">${stats.volume30d.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="flex items-center gap-3 pt-6">
            <RefreshCw className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground">Failed (30d)</p>
              <p className="text-lg font-semibold">{stats.failedCount30d}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="flex items-center gap-3 pt-6">
            <Receipt className="h-5 w-5 text-violet-400" />
            <div>
              <p className="text-xs text-muted-foreground">Refunds (30d)</p>
              <p className="text-lg font-semibold">{stats.refundCount30d}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="flex items-center gap-3 pt-6">
            <Wallet className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-xs text-muted-foreground">Processor</p>
              <p className="text-lg font-semibold capitalize">{account.processor}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await connectStripeMerchantAction();
              if (res.success) window.location.href = res.data.url;
            })
          }
        >
          Connect Stripe
        </Button>
        <Button variant="outline" size="sm" disabled>
          Create Subscription
        </Button>
        <Button variant="outline" size="sm" disabled>
          Send Invoice
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <Tabs defaultValue="payments">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="links">Payment Links</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="automations">Billing Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Transaction history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                  >
                    <span>
                      ${Number(tx.amount).toFixed(2)} · {tx.status}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between text-sm">
                    <span>
                      {inv.invoice_number ?? inv.id.slice(0, 8)} · {inv.status} · $
                      {Number(inv.amount_due).toFixed(2)}
                    </span>
                    {inv.hosted_url ? (
                      <a href={inv.hosted_url} className="text-violet-400 hover:underline" target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Create payment link</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Name</Label>
                <Input value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Deposit" />
              </div>
              <div>
                <Label>Amount (optional)</Label>
                <Input
                  type="number"
                  value={linkAmount}
                  onChange={(e) => setLinkAmount(e.target.value)}
                  placeholder="99.00"
                />
              </div>
              <div className="flex items-end">
                <Button
                  disabled={pending || !linkName.trim() || !active}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await createPaymentLinkAction({
                        name: linkName,
                        amount: linkAmount ? Number(linkAmount) : undefined,
                      });
                      if (res.success) {
                        setMessage(`Link created: ${res.data.url}`);
                        setLinkName("");
                        setLinkAmount("");
                      } else {
                        setMessage(res.error);
                      }
                    })
                  }
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Create link
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Payment links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {paymentLinks.map((pl) => (
                <div key={pl.id} className="flex justify-between text-sm">
                  <span>
                    {pl.name} {pl.amount != null ? `· $${Number(pl.amount).toFixed(2)}` : ""}
                  </span>
                  {pl.url ? (
                    <a href={pl.url} target="_blank" rel="noreferrer" className="text-violet-400">
                      Open
                    </a>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
              ) : (
                subscriptions.map((s) => (
                  <div key={s.id} className="text-sm">
                    ${Number(s.amount).toFixed(2)}/{s.interval} · {s.status}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              {refunds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No refunds.</p>
              ) : (
                refunds.map((r) => (
                  <div key={r.id} className="text-sm">
                    ${Number(r.amount).toFixed(2)} · {r.status}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Disputes / chargebacks</CardTitle>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open disputes.</p>
              ) : (
                disputes.map((d) => (
                  <div key={d.id} className="text-sm">
                    ${Number(d.amount).toFixed(2)} · {d.status}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Payouts & deposits</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payouts recorded yet.</p>
              ) : (
                payouts.map((p) => (
                  <div key={p.id} className="text-sm">
                    ${Number(p.amount).toFixed(2)} · {p.status}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>AI merchant agents</CardTitle>
              <CardDescription>
                Payment events trigger CRM updates, pipeline moves, workflows, and these agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {MERCHANT_AI_AGENTS.map((a) => (
                <div key={a.key} className="rounded-lg border border-white/[0.06] p-3 text-sm">
                  <p className="font-medium">{a.label}</p>
                  <p className="text-muted-foreground">{a.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Processors</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {PAYMENT_PROCESSORS.map((p) => (
                <span
                  key={p.id}
                  className={`rounded-full px-3 py-1 text-xs ${
                    p.id === account.processor
                      ? "bg-violet-500/20 text-violet-300"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {p.label}
                </span>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
