import Link from "next/link";

import { AiTextCommandCenterClient } from "@/components/ai-text/ai-text-command-center-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createAiTextRepository } from "@/repositories/ai-text.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { AiTextAgentRow, SmsCampaignRow } from "@/types/diazites-platform";

export const dynamic = "force-dynamic";

export default async function AiTextCommandCenterPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="AI Text Command Center"
          title="SMS & text automation"
          description="AI-powered texting, campaigns, sequences, and CRM-connected inbox."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Set up your business to launch AI text agents.</CardDescription>
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

  const repo = createAiTextRepository(supabase);
  const [agentsRes, stats, campaignsRes, messagesRes] = await Promise.all([
    repo.listAgents(business.id),
    repo.dashboardStats(business.id),
    repo.listCampaigns(business.id),
    repo.listRecentMessages(business.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="AI Text Command Center"
        title="SMS & text automation"
        description="Build AI text agents, run SMS campaigns, manage sequences, and sync every message to CRM, workflows, and pipelines."
      />
      <AiTextCommandCenterClient
        agents={(agentsRes.data ?? []) as AiTextAgentRow[]}
        stats={stats}
        campaigns={(campaignsRes.data ?? []) as SmsCampaignRow[]}
        recentMessages={(messagesRes.data ?? []) as Parameters<typeof AiTextCommandCenterClient>[0]["recentMessages"]}
      />
    </div>
  );
}
