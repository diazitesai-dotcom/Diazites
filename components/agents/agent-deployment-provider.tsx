"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  agents: AgentRow[];
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [launch, setLaunch] = useState<DeploymentLaunchParams>({});
  const cleanUrlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDeployment = useCallback((params?: DeploymentLaunchParams) => {
    setLaunch(params ?? {});
    setOpen(true);
  }, []);

  const closeDeployment = useCallback(() => {
    setOpen(false);
    setLaunch({});
  }, []);

  const stripDeployParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("deploy") && !params.has("goal") && !params.has("stack") && !params.has("agent")) {
      return;
    }
    params.delete("deploy");
    params.delete("goal");
    params.delete("stack");
    params.delete("agent");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const deploy = searchParams.get("deploy");
    if (!deploy) return;

    if (deploy === "retargeting") {
      openDeployment({
        preset: "retargeting",
        agent: "retargeting",
        goal: "improve_conversion",
        mode: "autonomous",
        step: "readiness",
        source: "opportunity",
      });
    } else if (deploy === "1" || deploy === "true") {
      const goal = normalizeDeploymentGoalId(searchParams.get("goal") ?? undefined);
      const stack = searchParams.get("stack") as AgentStackId | null;
      const agent = searchParams.get("agent") as AgentType | null;

      openDeployment({
        goal: goal ?? undefined,
        stack: stack && AGENT_STACKS.some((s) => s.id === stack) ? stack : undefined,
        agent: agent ?? undefined,
        source: "activate_agent",
      });
    } else {
      return;
    }

    if (cleanUrlTimerRef.current) clearTimeout(cleanUrlTimerRef.current);
    cleanUrlTimerRef.current = setTimeout(() => {
      stripDeployParams();
      cleanUrlTimerRef.current = null;
    }, 400);

    return () => {
      if (cleanUrlTimerRef.current) {
        clearTimeout(cleanUrlTimerRef.current);
        cleanUrlTimerRef.current = null;
      }
    };
  }, [searchParams, openDeployment, stripDeployParams]);

  useEffect(() => {
    if (!open && searchParams.get("deploy")) {
      stripDeployParams();
    }
  }, [open, searchParams, stripDeployParams]);

  return (
    <DeploymentContext.Provider value={{ openDeployment, closeDeployment, isOpen: open, agents }}>
      {children}
      <AgentDeploymentDrawer
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            closeDeployment();
            stripDeployParams();
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
        initialPreset={launch.preset}
        initialMode={launch.mode}
        launchSource={launch.source}
        key={`${open}-${launch.goal ?? ""}-${launch.stack ?? ""}-${launch.agent ?? ""}-${launch.preset ?? ""}`}
      />
    </DeploymentContext.Provider>
  );
}
