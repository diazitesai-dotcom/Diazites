import { Suspense } from "react";
import Link from "next/link";

import { AutomationHubClient } from "@/components/automations/automation-hub-client";
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
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import { loadPipelinesHub } from "@/services/pipelines/pipeline.service";
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
          eyebrow="Automation Center"
          title="Pipelines & automations"
          description="Build GHL-style pipelines, attach workflows per stage, and orchestrate email and AI."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business profile to create pipelines.</CardDescription>
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

  const autoRepo = createAutomationRepository(supabase);
  const [rulesRes, runsRes, pipelineHub] = await Promise.all([
    autoRepo.listForBusiness(business.id),
    autoRepo.listRecentRuns(business.id, 30),
    loadPipelinesHub(supabase, business.id),
  ]);

  const rules = (rulesRes.data ?? []) as AutomationRuleRow[];
  const runs = (runsRes.data ?? []) as Parameters<typeof AutomationHubClient>[0]["recentRuns"];
  const triggers = Object.values(EVENT_TYPES) as ReadonlyArray<string>;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <PageHeader
        eyebrow="Automation Center"
        title="Pipelines & automations"
        description="GoHighLevel-style pipelines under Automations — create stages, attach workflows, email, tags, and tasks on stage entry."
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <AutomationHubClient
          pipelines={pipelineHub.pipelines}
          stageCounts={pipelineHub.stageCounts}
          rules={rules}
          recentRuns={runs}
          triggers={triggers}
        />
      </Suspense>
    </div>
  );
}
