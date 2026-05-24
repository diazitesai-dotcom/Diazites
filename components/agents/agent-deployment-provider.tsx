"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AgentDeploymentDrawer } from "@/components/agents/agent-deployment-drawer";
import { AGENT_STACKS, normalizeDeploymentGoalId } from "@/types/agent-deployment";
import type {
  AgentDeploymentContext,
  AgentStackId,
  DeploymentLaunchParams,
} from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";

type AgentRow = { agent_type: string; status: string; activated_at?: string | null };

type DeploymentContextValue = {
  openDeployment: (params?: DeploymentLaunchParams) => void;
  closeDeployment: () => void;
  isOpen: boolean;
};

const DeploymentContext = createContext<DeploymentContextValue | null>(null);

export function useAgentDeployment() {
  const ctx = useContext(DeploymentContext);
  if (!ctx) {
    throw new Error("useAgentDeployment must be used within AgentDeploymentProvider");
  }
  return ctx;
}

export function useAgentDeploymentOptional() {
  return useContext(DeploymentContext);
}

type ProviderProps = {
  children: ReactNode;
  agents: AgentRow[];
  deploymentContext: AgentDeploymentContext | null;
};

export function AgentDeploymentProvider({
  children,
  agents,
  deploymentContext,
}: ProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [launch, setLaunch] = useState<DeploymentLaunchParams>({});

  const openDeployment = useCallback((params?: DeploymentLaunchParams) => {
    setLaunch(params ?? {});
    setOpen(true);
  }, []);

  const closeDeployment = useCallback(() => {
    setOpen(false);
    setLaunch({});
  }, []);

  useEffect(() => {
    const deploy = searchParams.get("deploy");
    if (deploy !== "1" && deploy !== "true") return;

    const goal = normalizeDeploymentGoalId(searchParams.get("goal") ?? undefined);
    const stack = searchParams.get("stack") as AgentStackId | null;
    const agent = searchParams.get("agent") as AgentType | null;

    openDeployment({
      goal: goal ?? undefined,
      stack: stack && AGENT_STACKS.some((s) => s.id === stack) ? stack : undefined,
      agent: agent ?? undefined,
      source: "activate_agent",
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("deploy");
    url.searchParams.delete("goal");
    url.searchParams.delete("stack");
    url.searchParams.delete("agent");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [searchParams, openDeployment, router]);

  return (
    <DeploymentContext.Provider value={{ openDeployment, closeDeployment, isOpen: open }}>
      {children}
      <AgentDeploymentDrawer
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            closeDeployment();
            router.refresh();
          } else {
            setOpen(true);
          }
        }}
        agents={agents}
        context={deploymentContext}
        initialGoal={launch.goal}
        initialStack={launch.stack}
        initialAgent={launch.agent}
        initialStep={launch.step}
        launchSource={launch.source}
        key={`${open}-${launch.goal ?? ""}-${launch.stack ?? ""}-${launch.agent ?? ""}`}
      />
    </DeploymentContext.Provider>
  );
}
