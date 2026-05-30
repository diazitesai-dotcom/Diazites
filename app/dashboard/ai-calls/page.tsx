import Link from "next/link";

import { AiCallCommandCenterClient } from "@/components/ai-calls/ai-call-command-center-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { createAiCallsRepository } from "@/repositories/ai-calls.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { AiCallingAgentRow } from "@/types/diazites-platform";

export const dynamic = "force-dynamic";

export default async function AiCallCommandCenterPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="AI Call Command Center"
          title="Native AI calling"
          description="Outbound campaigns, inbound routing, and CRM actions — no third-party dialers."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Finish onboarding first</CardTitle>
            <CardDescription>Set up your business to launch AI calling agents.</CardDescription>
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

  const repo = createAiCallsRepository(supabase);
  const [agentsRes, stats, callsRes] = await Promise.all([
    repo.listAgents(business.id),
    repo.dashboardStats(business.id),
    repo.listCalls(business.id),
  ]);

  const agents = (agentsRes.data ?? []) as AiCallingAgentRow[];
  const recentCalls = (callsRes.data ?? []) as Parameters<
    typeof AiCallCommandCenterClient
  >[0]["recentCalls"];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="AI Call Command Center"
        title="AI-powered calling"
        description="Build agents, run campaigns, monitor live calls, and sync outcomes to CRM, workflows, and tasks."
      />
      <AiCallCommandCenterClient agents={agents} stats={stats} recentCalls={recentCalls} />
    </div>
  );
}
