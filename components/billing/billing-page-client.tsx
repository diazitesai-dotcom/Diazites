"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BILLING_PLANS_DISPLAY, getPlanDefinition } from "@/lib/billing/plans";
import { UsageDashboardPanel } from "@/components/billing/usage-dashboard-panel";
import { TrialBanner } from "@/components/billing/trial-banner";
import { openBillingPortal, startSubscriptionCheckout } from "@/actions/billing-stripe.actions";
import type { TrialSnapshot } from "@/services/billing/trial.service";
import type { UsageDashboardRow } from "@/services/billing/usage-metering.service";

type BillingRow = {
  plan_name: string;
  amount: number;
  payment_status: string;
  subscription_status?: string | null;
  stripe_customer_id: string | null;
  trial?: TrialSnapshot | null;
};

export function BillingPageClient({
  billing,
  stripeReady,
  notice,
  usageRows,
  usageOverage,
}: {
  billing: BillingRow | null;
  stripeReady: boolean;
  notice?: string | null;
  usageRows: UsageDashboardRow[];
  usageOverage: number;
}) {
  const currentName = billing?.plan_name ?? "Growth";
  const planDef = getPlanDefinition(currentName);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Commercial"
        title="Billing"
        description="Subscribe with Stripe — checkout and customer portal are wired to your workspace billing row."
      />

      {notice ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {notice}
        </p>
      ) : null}

      <TrialBanner trial={billing?.trial ?? null} shouldShowUpgrade={Boolean(billing?.trial?.daysRemaining != null && billing.trial.daysRemaining <= 3)} />

      <Card className="border-white/[0.06]">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-lg">Current plan</CardTitle>
            <CardDescription>Synced from Supabase + Stripe webhooks.</CardDescription>
          </div>
          <Badge variant={stripeReady ? "success" : "secondary"} className="uppercase tracking-wide">
            {stripeReady ? "Stripe live" : "Stripe not configured"}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold tracking-tight">
              {billing?.plan_name ?? "Starter"} — $
              {Number(billing?.amount ?? 497).toLocaleString("en-US")}
              /month
            </p>
            <p className="text-sm text-muted-foreground">
              Status: {billing?.subscription_status ?? billing?.payment_status ?? "trialing"}
            </p>
          </div>
          {stripeReady && billing?.stripe_customer_id ? (
            <form action={openBillingPortal}>
              <Button type="submit" variant="secondary" className="rounded-xl">
                Manage billing & invoices
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <UsageDashboardPanel
        planName={planDef.name}
        rows={usageRows}
        estimatedOverage={usageOverage}
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {BILLING_PLANS_DISPLAY.filter((p) => p.name !== "Enterprise").map((plan) => {
          const isCurrent = plan.name === planDef.name;
          return (
            <Card
              key={plan.name}
              className={`border-white/[0.06] ${isCurrent ? "ring-1 ring-violet-500/30 shadow-[0_0_40px_-20px_rgba(139,92,246,0.45)]" : ""}`}
            >
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-semibold tracking-tight">${plan.priceMonthly}</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {stripeReady && plan.name !== "Enterprise" ? (
                  <form action={startSubscriptionCheckout.bind(null, plan.name)}>
                    <Button
                      type="submit"
                      className="w-full rounded-xl"
                      variant={isCurrent ? "secondary" : "outline"}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Current plan" : `Subscribe to ${plan.name}`}
                    </Button>
                  </form>
                ) : (
                  <Button className="w-full rounded-xl" variant="outline" disabled>
                    Configure Stripe env to subscribe
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
