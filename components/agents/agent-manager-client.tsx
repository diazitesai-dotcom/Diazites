"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bot, CheckCircle2, Clock, Layers, Rocket } from "lucide-react";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { AgentLifecycleBadge } from "@/components/agents/agent-lifecycle-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapDbStatusToLifecycle } from "@/lib/agents/deployment-catalog";
import { AGENT_PLAYBOOKS } from "@/services/agents/agent-playbooks";
import { deactivateAgentAction } from "@/services/agents/actions";
import { AGENTS } from "@/utils/constants";
import type { AgentStackId } from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";

type AgentRow = {
  agent_type: string;
  status: string;
  activated_at: string | null;
};

export function AgentManagerClient({ agents }: { agents: AgentRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { openDeployment } = useAgentDeployment();

  const byType = new Map(agents.map((a) => [a.agent_type, a]));
  const liveCount = agents.filter((a) => a.status === "active").length;

  function deactivate(type: AgentType) {
    const fd = new FormData();
    fd.set("agent_type", type);
    startTransition(async () => {
      await deactivateAgentAction(fd);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {liveCount} of {AGENTS.length} agents live · Unified deployment orchestration
        </p>
        <Button
          type="button"
          variant="gradient"
          className="mission-shimmer-btn rounded-xl"
          onClick={() => openDeployment({ source: "activate_agent" })}
        >
          <Rocket className="mr-2 size-4" />
          Activate Agent
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            { id: "lead_engine" as const, label: "Lead Engine" },
            { id: "paid_ads" as const, label: "Paid Ads" },
            { id: "growth_engine" as const, label: "Growth Engine" },
          ] as { id: AgentStackId; label: string }[]
        ).map((stack) => (
          <button
            key={stack.id}
            type="button"
            onClick={() => openDeployment({ stack: stack.id, source: "activate_agent" })}
            className="mission-elevate flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm transition-all hover:border-violet-500/35"
          >
            <Layers className="size-4 shrink-0 text-violet-300" />
            <span className="font-medium">{stack.label}</span>
          </button>
        ))}
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((agent) => {
          const row = byType.get(agent.key);
          const status = row?.status ?? "inactive";
          const playbook = AGENT_PLAYBOOKS[agent.key];
          const isActive = status === "active";
          const isPending = status === "pending";
          const lifecycle = mapDbStatusToLifecycle(status, false);

          return (
            <Card key={agent.key} className="border-white/[0.06]">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300">
                      <Bot className="size-5" aria-hidden />
                    </span>
                    <AgentLifecycleBadge state={lifecycle} />
                  </div>
                </div>
                <CardDescription>{playbook.description}</CardDescription>
                <div className="flex items-center gap-2 text-xs">
                  {isActive ? (
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                  ) : (
                    <Clock className="size-3.5 text-muted-foreground" />
                  )}
                  <span className="text-muted-foreground">
                    {isActive
                      ? `${playbook.rules.length} automation rule(s) provisioned`
                      : isPending
                        ? "Setup in progress"
                        : "Ready to deploy"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isActive ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Enable webhook URLs under{" "}
                      <Link href="/dashboard/automations" className="text-violet-300 underline">
                        Automations
                      </Link>{" "}
                      for each rule this agent created.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl"
                      disabled={pending}
                      onClick={() => deactivate(agent.key)}
                    >
                      Deactivate
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="gradient"
                    className="mission-shimmer-btn w-full rounded-xl"
                    disabled={pending || isPending}
                    onClick={() =>
                      openDeployment({ agent: agent.key, source: "activate_agent" })
                    }
                  >
                    {isPending ? "Setup in progress…" : "Activate agent"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </>
  );
}
