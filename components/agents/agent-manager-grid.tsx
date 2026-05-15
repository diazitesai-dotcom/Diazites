"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bot, CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENT_PLAYBOOKS } from "@/services/agents/agent-playbooks";
import { activateAgentAction, deactivateAgentAction } from "@/services/agents/actions";
import { AGENTS } from "@/utils/constants";
import type { AgentType } from "@/types/domain";

type AgentRow = {
  agent_type: string;
  status: string;
  activated_at: string | null;
};

export function AgentManagerGrid({ agents }: { agents: AgentRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const byType = new Map(agents.map((a) => [a.agent_type, a]));

  function activate(type: AgentType) {
    const fd = new FormData();
    fd.set("agent_type", type);
    startTransition(async () => {
      await activateAgentAction(fd);
      router.refresh();
    });
  }

  function deactivate(type: AgentType) {
    const fd = new FormData();
    fd.set("agent_type", type);
    startTransition(async () => {
      await deactivateAgentAction(fd);
      router.refresh();
    });
  }

  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {AGENTS.map((agent) => {
        const row = byType.get(agent.key);
        const status = row?.status ?? "inactive";
        const playbook = AGENT_PLAYBOOKS[agent.key];
        const isActive = status === "active";
        const isPending = status === "pending";

        return (
          <Card key={agent.key} className="border-white/[0.06]">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300">
                  <Bot className="size-5" aria-hidden />
                </span>
              </div>
              <CardDescription>{playbook.description}</CardDescription>
              <div className="flex items-center gap-2 text-xs">
                {isActive ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <Clock className="size-3.5 text-muted-foreground" />
                )}
                <span className="capitalize text-muted-foreground">
                  Status: {status}
                  {isActive ? ` · ${playbook.rules.length} automation rule(s) provisioned` : ""}
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
                  className="w-full rounded-xl"
                  disabled={pending || isPending}
                  onClick={() => activate(agent.key)}
                >
                  {isPending ? "Setup in progress…" : "Activate agent"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
