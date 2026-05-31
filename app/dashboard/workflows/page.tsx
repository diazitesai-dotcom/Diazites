import Link from "next/link";

import { WorkflowsHubClient } from "@/components/workflows/workflows-hub-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDashboardService } from "@/lib/access-control/guard";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createWorkflowRepository } from "@/repositories/workflow.repository";
import type { DiazitesWorkflowRow } from "@/types/diazites-platform";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  await requireDashboardService("workflow_reporting");
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Workflows"
          title="Native workflow automation"
          description="Visual triggers, conditions, and actions — fully inside Diazites."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Connect your business profile to build workflows.</CardDescription>
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

  const repo = createWorkflowRepository(supabase);
  const [listRes, stats, runsRes] = await Promise.all([
    repo.listForBusiness(business.id),
    repo.dashboardStats(business.id),
    repo.recentRuns(business.id),
  ]);

  const workflows = (listRes.data ?? []) as DiazitesWorkflowRow[];
  const recentRuns = (runsRes.data ?? []) as Parameters<typeof WorkflowsHubClient>[0]["recentRuns"];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Workflows"
        title="Workflow command center"
        description="Create, edit, launch, and manage native automations — pipelines, SMS, email, AI agents, and tasks."
      />
      <WorkflowsHubClient workflows={workflows} stats={stats} recentRuns={recentRuns} />
    </div>
  );
}
