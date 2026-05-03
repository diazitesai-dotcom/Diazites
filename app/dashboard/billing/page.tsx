import { BillingPageClient } from "@/components/billing/billing-page-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { getUserPlan } from "@/services/billing/billing.service";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const planRes = await getUserPlan(supabase, user.id);
  const billing = planRes.success ? planRes.data : null;

  const sp = await searchParams;
  const rawErr = sp.error;
  const errorStr = typeof rawErr === "string" ? rawErr : undefined;
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY?.trim());

  let notice: string | undefined;
  if (errorStr === "no_business") {
    notice = "Create a business profile before subscribing.";
  } else if (errorStr === "no_stripe_customer") {
    notice = "Start a subscription once to create your Stripe customer, then you can use the billing portal.";
  } else if (errorStr) {
    notice = decodeURIComponent(errorStr).slice(0, 400);
  }

  return (
    <BillingPageClient
      billing={
        billing && typeof billing === "object" && "plan_name" in billing
          ? {
              plan_name: String(billing.plan_name),
              amount: Number(billing.amount),
              payment_status: String(billing.payment_status),
              stripe_customer_id: billing.stripe_customer_id ?? null,
            }
          : null
      }
      stripeReady={stripeReady}
      notice={notice}
    />
  );
}
