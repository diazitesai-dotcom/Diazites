"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { AgentDeploymentUrlBridge } from "@/components/agents/agent-deployment-url-bridge";
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
  openOperator: () => void;
  closeOperator: () => void;
  isOperatorOpen: boolean;
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
  const [open, setOpen] = useState(false);
  const [launch, setLaunch] = useState<DeploymentLaunchParams>({});
  const [operatorOpen, setOperatorOpen] = useState(false);

  const openDeployment = useCallback((params?: DeploymentLaunchParams) => {
    setLaunch(params ?? {});
    setOpen(true);
  }, []);

  const closeDeployment = useCallback(() => {
    setOpen(false);
    setLaunch({});
  }, []);

  const openOperator = useCallback(() => setOperatorOpen(true), []);
  const closeOperator = useCallback(() => setOperatorOpen(false), []);

  return (
    <DeploymentContext.Provider
      value={{
        openDeployment,
        closeDeployment,
        isOpen: open,
        agents,
        openOperator,
        closeOperator,
        isOperatorOpen: operatorOpen,
      }}
    >
      {children}
      <AgentDeploymentUrlBridge
        agents={agents}
        deploymentContext={deploymentContext}
        open={open}
        launch={launch}
        onOpenChange={setOpen}
        onClose={closeDeployment}
      />
    </DeploymentContext.Provider>
  );
}
