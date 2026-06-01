"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AgentDeploymentDrawer } from "@/components/agents/agent-deployment-drawer";
import { parseUrlDeployLaunch } from "@/lib/agents/parse-url-deploy-launch";
import { dispatchOperatorOpen } from "@/lib/ai-operator/operator-ui-events";
import type {
  AgentDeploymentContext,
  DeploymentLaunchParams,
} from "@/types/agent-deployment";

type AgentRow = { agent_type: string; status: string; activated_at?: string | null };

type BridgeProps = {
  agents: AgentRow[];
  deploymentContext: AgentDeploymentContext | null;
  open: boolean;
  launch: DeploymentLaunchParams;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
};

function AgentDeploymentUrlBridgeInner({
  agents,
  deploymentContext,
  open,
  launch,
  onOpenChange,
  onClose,
}: BridgeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cleanUrlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operatorHandledRef = useRef(false);

  const stripDeployParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    for (const key of ["deploy", "goal", "stack", "agent", "operator"]) {
      if (params.has(key)) {
        params.delete(key);
        changed = true;
      }
    }
    if (!changed) return;
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
    const op = searchParams.get("operator");
    if (op !== "1" && op !== "open") return;
    if (operatorHandledRef.current) return;
    operatorHandledRef.current = true;
    dispatchOperatorOpen();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("operator");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

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
    <AgentDeploymentDrawer
      open={drawerOpen}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
          stripDeployParams();
          router.refresh();
        } else {
          onOpenChange(true);
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
  );
}

export function AgentDeploymentUrlBridge(props: BridgeProps) {
  return (
    <Suspense fallback={null}>
      <AgentDeploymentUrlBridgeInner {...props} />
    </Suspense>
  );
}
