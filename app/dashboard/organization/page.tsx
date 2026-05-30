import Link from "next/link";
import { Suspense } from "react";

import { BillingPageClient } from "@/components/billing/billing-page-client";
import { ModulePurpose } from "@/components/layout/module-purpose";
import { PageHeader } from "@/components/layout/page-header";
import { OrganizationPlaceholderPanel } from "@/components/organization/organization-placeholder-panel";
import { OrganizationSettingsPanel } from "@/components/organization/organization-settings-panel";
import { OrganizationShell, type OrganizationTab } from "@/components/organization/organization-shell";
import { TeamManager } from "@/components/team/team-manager";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicAppUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { BusinessProfile } from "@/types/platform-growth";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import {
  createTeamMemberRepository,
  type TeamMemberRow,
} from "@/repositories/cross-cutting.repository";
import { getUserPlan } from "@/services/billing/billing.service";
import { getUsageDashboard } from "@/services/billing/usage-metering.service";

export const dynamic = "force-dynamic";

function parseTab(raw: string | string[] | undefined): OrganizationTab {
  const t = typeof raw === "string" ? raw : "team";
  if (t === "billing" || t === "settings" || t === "security" || t === "api" || t === "audit") {
    return t;
  }
  return "team";
}

export default async function OrganizationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const sp = await searchParams;
  const tab = parseTab(sp.tab);

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Organization"
          title="Workspace administration"
          description="Team, billing, security, and workspace settings in one place."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business profile to manage the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding" className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}>
              Go to onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamRepo = createTeamMemberRepository(supabase);
  const { data: teamData } = await teamRepo.listForBusiness(business.id);
  const members = (teamData ?? []) as TeamMemberRow[];

  const planRes = await getUserPlan(supabase, user.id);
  const billing = planRes.success ? planRes.data : null;
  const usageRes =
    billing && business
      ? await getUsageDashboard(supabase, business.id, String(billing.plan_name))
      : null;
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Organization"
        title="Workspace administration"
        description="Team permissions, billing, API access, security, and audit — your enterprise trust layer."
      />
      <ModulePurpose
        title="Workspace control"
        description="Manage who can operate the growth OS, how agents are billed, and how notifications and security policies apply across Mission Control and autonomous agents."
      />
      <Suspense fallback={null}>
        <OrganizationShell>
          {tab === "team" ? <TeamManager members={members} /> : null}
          {tab === "billing" ? (
            <BillingPageClient
              billing={
                billing && typeof billing === "object" && "plan_name" in billing
                  ? {
                      plan_name: String(billing.plan_name),
                      amount: Number(billing.amount),
                      payment_status: String(billing.payment_status),
                      subscription_status:
                        "subscription_status" in billing
                          ? (billing.subscription_status as string | null)
                          : null,
                      stripe_customer_id: billing.stripe_customer_id ?? null,
                      trial: "trial" in billing ? billing.trial : null,
                    }
                  : null
              }
              stripeReady={stripeReady}
              notice={notice}
              usageRows={usageRes?.success ? usageRes.data.rows : []}
              usageOverage={usageRes?.success ? usageRes.data.estimatedOverage : 0}
            />
          ) : null}
          {tab === "settings" ? (
            <OrganizationSettingsPanel
              businessId={business.id}
              profile={(business.profile ?? {}) as BusinessProfile}
              appUrl={getPublicAppUrl()}
            />
          ) : null}
          {tab === "security" ? (
            <OrganizationPlaceholderPanel
              title="Security"
              description="SSO, session policies, and workspace hardening."
            />
          ) : null}
          {tab === "api" ? (
            <OrganizationPlaceholderPanel
              title="API access"
              description="Service tokens and scoped API keys for developers."
            />
          ) : null}
          {tab === "audit" ? (
            <OrganizationPlaceholderPanel
              title="Audit logs"
              description="Immutable history of agent actions, approvals, and operator overrides."
            />
          ) : null}
        </OrganizationShell>
      </Suspense>
    </div>
  );
}
