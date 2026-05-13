import Link from "next/link";

import { AutomationsManager } from "@/components/automations/automations-manager";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  type AutomationRuleRow,
  createAutomationRepository,
} from "@/repositories/automation.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { EVENT_TYPES } from "@/types/backend";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Automations"
          title="Event-driven workflows"
          description="Send webhooks and SMS when engine events fire."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business profile to wire automations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
            >
              Go to onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const repo = createAutomationRepository(supabase);
  const [rulesRes, runsRes] = await Promise.all([
    repo.listForBusiness(business.id),
    repo.listRecentRuns(business.id, 30),
  ]);

  const rules = (rulesRes.data ?? []) as AutomationRuleRow[];
  const runs = (runsRes.data ?? []) as Parameters<typeof AutomationsManager>[0]["recentRuns"];
  const triggers = Object.values(EVENT_TYPES) as ReadonlyArray<string>;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Automations"
        title="Event-driven workflows"
        description="Send webhooks and SMS when engine events fire — new lead, status change, AI follow-up sent, and more."
      />
      <AutomationsManager rules={rules} recentRuns={runs} triggers={triggers} />
    </div>
  );
}
