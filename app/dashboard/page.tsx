import Link from "next/link";

import { DashboardHomeClient } from "@/components/dashboard/dashboard-home-client";
import { PageHeader } from "@/components/layout/page-header";
import { PostSetupChecklist } from "@/components/onboarding/post-setup-checklist";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDashboardOverview } from "@/lib/dashboard/load-dashboard-overview";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadPostSetupChecklist } from "@/services/onboarding/draft.service";

export default async function DashboardPage() {
  const data = await loadDashboardOverview();

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Mission Control"
          title="Growth Command Center"
          description="Connect your business profile to unlock revenue, campaigns, leads, AI agents, and growth opportunities in one central hub."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg">No business on file</CardTitle>
            <CardDescription>
              Finish onboarding so we can attach campaigns, leads, and billing to your workspace.
            </CardDescription>
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

  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const checklistItems = await loadPostSetupChecklist(supabase, user.id);

  return (
    <div className="space-y-6">
      <PostSetupChecklist items={checklistItems} />
      <DashboardHomeClient data={data} />
    </div>
  );
}
