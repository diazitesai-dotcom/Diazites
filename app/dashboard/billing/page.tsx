import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BILLING_PLANS } from "@/utils/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <main className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Billing</h1>
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Growth - $997/month</p>
            <p className="text-sm text-muted-foreground">Payment status: active</p>
          </div>
          <Badge>Stripe-ready</Badge>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {BILLING_PLANS.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-semibold">${plan.price}</p>
              <p className="text-sm text-muted-foreground">Per month</p>
              <Button className="w-full" variant="outline">
                {plan.name === "Growth" ? "Current plan" : `Switch to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
