import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BILLING_PLANS } from "@/utils/constants";

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Commercial"
        title="Billing"
        description="Plans, payment status, and upgrade paths — Stripe-ready when you flip the switch."
      />

      <Card className="border-white/[0.06]">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-lg">Current plan</CardTitle>
            <CardDescription>Payment status and renewal window.</CardDescription>
          </div>
          <Badge variant="info" className="uppercase tracking-wide">
            Stripe-ready
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold tracking-tight">Growth — $997/month</p>
            <p className="text-sm text-muted-foreground">Payment status: active</p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 md:grid-cols-3">
        {BILLING_PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`border-white/[0.06] ${plan.name === "Growth" ? "ring-1 ring-violet-500/30 shadow-[0_0_40px_-20px_rgba(139,92,246,0.45)]" : ""}`}
          >
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>Per month, billed monthly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-semibold tracking-tight">${plan.price}</p>
              <Button
                className="w-full rounded-xl"
                variant={plan.name === "Growth" ? "secondary" : "outline"}
              >
                {plan.name === "Growth" ? "Current plan" : `Switch to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
