import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AgentWorkspaceClient } from "@/components/agents/workspace/agent-workspace-client";
import { AgentLifecycleBadge } from "@/components/agents/agent-lifecycle-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getAgentWorkspaceProfile,
  isDeployableAgentKey,
} from "@/lib/agents/agent-workspace-catalog";
import { loadAgentWorkspace } from "@/lib/agents/load-agent-workspace";
import { mapDbStatusToLifecycle } from "@/lib/agents/deployment-catalog";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { getUserAgents } from "@/services/agents/agent.service";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ agentKey: string }>;
};

export default async function AgentWorkspacePage({ params }: PageProps) {
  const { agentKey } = await params;
  if (!isDeployableAgentKey(agentKey)) {
    notFound();
  }

  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  const agentsResult = await getUserAgents(supabase, user.id);
  const rows =
    agentsResult.success && agentsResult.data
      ? (agentsResult.data as { agent_type: string; status: string; activated_at: string | null }[])
      : [];
  const row = rows.find((a) => a.agent_type === agentKey);
  const status = row?.status ?? "inactive";
  const profile = getAgentWorkspaceProfile(agentKey);
  const lifecycle = mapDbStatusToLifecycle(status, false);

  const workspace =
    business != null
      ? await loadAgentWorkspace(
          supabase,
          user.id,
          business.id,
          agentKey,
          status,
          row?.activated_at ?? null,
        )
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/agents"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "rounded-xl text-muted-foreground",
          )}
        >
          <ArrowLeft className="mr-1 size-4" />
          Agents
        </Link>
        <AgentLifecycleBadge state={lifecycle} />
      </div>

      <div className="space-y-1 border-b border-white/[0.08] pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400/90">
          Agent workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {profile.workspaceTitle}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {workspace?.description ??
            "Drill-down environment — queue, logs, reasoning, permissions, and approvals in one place."}
        </p>
      </div>

      {workspace ? (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading workspace…</p>}>
          <AgentWorkspaceClient data={workspace} />
        </Suspense>
      ) : (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Complete onboarding to load live queue, leads, and campaign ownership for this workspace.
        </p>
      )}
    </div>
  );
}
