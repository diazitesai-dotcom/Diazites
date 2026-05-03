import { Bot } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { activateAgentAction } from "@/services/agents/actions";
import { AGENTS } from "@/utils/constants";

export default function AgentManagerPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Automation"
        title="Agent Manager"
        description="Activate specialized AI agents for your roofing growth engine. Each agent coordinates with campaigns and CRM stages."
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((agent) => (
          <Card key={agent.key} className="border-white/[0.06]">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300">
                  <Bot className="size-5" aria-hidden />
                </span>
              </div>
              <CardDescription>
                Status after activation: pending. Setup in progress (24–72 hours).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={activateAgentAction}>
                <input type="hidden" name="agent_type" value={agent.key} />
                <Button type="submit" variant="gradient" className="w-full rounded-xl">
                  Activate agent
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
