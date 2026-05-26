"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AgentDeploymentDrawer } from "@/components/agents/agent-deployment-drawer";
import { AiOperatorConsole } from "@/components/ai-operator/ai-operator-console";
import { parseUrlDeployLaunch } from "@/lib/agents/parse-url-deploy-launch";
import type {
  AgentDeploymentContext,
  DeploymentLaunchParams,
} from "@/types/agent-deployment";

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

  const { fromUrl, launch: urlLaunch } = useMemo(
    () => parseUrlDeployLaunch(searchParams),
    [searchParams],
  );

  const drawerOpen = open || fromUrl;
  const drawerLaunch = open ? launch : urlLaunch;

  useEffect(() => {
    if (!fromUrl) return;
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
  }, [fromUrl, stripDeployParams]);

  useEffect(() => {
    if (!open && searchParams.get("deploy")) {
      stripDeployParams();
    }
  }, [open, searchParams, stripDeployParams]);

  return (
    <DeploymentContext.Provider value={{ openDeployment, closeDeployment, isOpen: open, agents }}>
      {children}
      <AgentDeploymentDrawer
        open={drawerOpen}
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
        initialGoal={drawerLaunch.goal}
        initialStack={drawerLaunch.stack}
        initialAgent={drawerLaunch.agent}
        initialStep={drawerLaunch.step}
        initialPreset={drawerLaunch.preset}
        initialMode={drawerLaunch.mode}
        launchSource={drawerLaunch.source}
        key={`${drawerOpen}-${drawerLaunch.goal ?? ""}-${drawerLaunch.stack ?? ""}-${drawerLaunch.agent ?? ""}-${drawerLaunch.preset ?? ""}`}
      />
      <AiOperatorConsole />
    </DeploymentContext.Provider>
  );
}
