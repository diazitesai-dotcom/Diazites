import Link from "next/link";

import { DashboardHomeClient } from "@/components/dashboard/dashboard-home-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDashboardOverview } from "@/lib/dashboard/load-dashboard-overview";

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

  return <DashboardHomeClient data={data} />;
}
