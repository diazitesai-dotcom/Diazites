import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENTS } from "@/utils/constants";
import { activateAgentAction } from "@/services/agents/actions";
import { Button } from "@/components/ui/button";

export default function AgentManagerPage() {
  return (
    <main className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Agent Manager</h1>
      <p className="text-sm text-muted-foreground">
        Activate specialized AI agents for your roofing growth engine.
      </p>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent) => (
          <Card key={agent.key}>
            <CardHeader>
              <CardTitle>{agent.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Status after activation: pending. Setup in progress (24-72
                hours).
              </p>
              <form action={activateAgentAction}>
                <input type="hidden" name="agent_type" value={agent.key} />
                <Button type="submit" className="w-full">
                  Activate agent
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
