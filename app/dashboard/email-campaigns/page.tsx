import Link from "next/link";

import { EmailCampaignCenterClient } from "@/components/email-campaigns/email-campaign-center-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createBusinessRepository } from "@/repositories/business.repository";
import { createEmailCampaignRepository } from "@/repositories/email-campaign.repository";
import type { EmailAudienceRow, EmailCampaignRow, EmailTemplateRow } from "@/types/diazites-platform";

export const dynamic = "force-dynamic";

export default async function EmailCampaignCenterPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Email Campaign Center"
          title="Email marketing & automations"
          description="Audiences, templates, campaigns, and analytics — Mailchimp-class tools native to Diazites."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Set up your business to send email campaigns.</CardDescription>
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

  const repo = createEmailCampaignRepository(supabase);
  const [stats, audiencesRes, templatesRes, campaignsRes] = await Promise.all([
    repo.dashboardStats(business.id),
    repo.listAudiences(business.id),
    repo.listTemplates(business.id),
    repo.listCampaigns(business.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Email Campaign Center"
        title="Email marketing & automations"
        description="Build audiences, design templates, launch campaigns, track opens & clicks, and connect sends to CRM, workflows, and AI agents."
      />
      <EmailCampaignCenterClient
        stats={stats}
        audiences={(audiencesRes.data ?? []) as EmailAudienceRow[]}
        templates={(templatesRes.data ?? []) as EmailTemplateRow[]}
        campaigns={(campaignsRes.data ?? []) as (EmailCampaignRow & {
          email_audiences?: { name: string } | null;
        })[]}
      />
    </div>
  );
}
