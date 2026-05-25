import Link from "next/link";

import { FunnelBuilderClient } from "@/components/funnel/funnel-builder-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { loadFunnelPageData } from "@/lib/dashboard/load-funnel-page";

export default async function FunnelDashboardPage() {
  const { businessId, pages } = await loadFunnelPageData();

  if (!businessId) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Funnel Studio"
          title="Conversion systems"
          description="Landing pages, forms, offers, variants, and conversion analytics."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg">No business yet</CardTitle>
            <CardDescription>Finish onboarding to use the landing page editor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding" className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}>
              Onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <PageHeader
        eyebrow="Funnel Studio"
        title="Build & optimize funnels"
        description="Landing pages, forms, surveys, offers, A/B tests, heatmaps, and conversion analytics — publish to /lp/[slug]."
      />
      <FunnelBuilderClient
        businessId={businessId}
        initialPages={pages as Array<{
          id: string;
          slug: string;
          headline: string | null;
          published: boolean;
          status: string | null;
        }>}
      />
    </div>
  );
}
