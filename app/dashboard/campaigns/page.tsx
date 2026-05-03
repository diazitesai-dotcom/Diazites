import Link from "next/link";

import { CampaignsTable } from "@/components/dashboard/campaigns-table";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCampaignsPageData } from "@/lib/dashboard/load-campaigns-page";

export default async function CampaignManagerPage() {
  const { campaigns, businessId } = await loadCampaignsPageData();

  if (!businessId) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Acquisition"
          title="Campaigns"
          description="Spend, efficiency, and conversion in one command view."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg">No business yet</CardTitle>
            <CardDescription>Finish onboarding to manage campaigns.</CardDescription>
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
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Acquisition"
        title="Campaigns"
        description="Spend, efficiency, and conversion in one command view — tuned for weekly optimization reviews."
      />
      <CampaignsTable campaigns={campaigns} />
    </div>
  );
}
