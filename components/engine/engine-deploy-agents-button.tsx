"use client";

import { Rocket } from "lucide-react";

import { AgentDeployTrigger } from "@/components/agents/agent-deploy-trigger";

export function EngineDeployAgentsButton({ className }: { className?: string }) {
  return (
    <AgentDeployTrigger
      label="Deploy agent stack"
      deploy={{
        goal: "deploy_full_growth_engine",
        stack: "growth_engine",
        source: "growth_engine",
      }}
      className={className}
      icon={<Rocket className="mr-2 size-4" />}
    />
  );
}
