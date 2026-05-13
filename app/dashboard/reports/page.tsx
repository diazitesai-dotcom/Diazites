import Link from "next/link";

import { ReportsPageClient } from "@/components/reports/reports-page-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadReportsPageData } from "@/lib/dashboard/load-reports-page";

export default async function ReportsPage() {
  const loaded = await loadReportsPageData();
  if (!loaded || !loaded.hasBusiness) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg">No business yet</CardTitle>
            <CardDescription>
              Complete onboarding to generate reports from live data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
            >
              Onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ReportsPageClient
      metrics={loaded.metrics}
      extra={loaded.extra}
      chartSeries={loaded.chartSeries}
    />
  );
}
