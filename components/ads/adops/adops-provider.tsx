"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { buildPlatformWorkspace } from "@/lib/ads/build-adops-payload";
import type {
  AdopsAgentView,
  AdopsPagePayload,
  AdopsPlatformId,
  ExecutionSafetyPolicy,
  LiveCampaignRow,
  PlatformWorkspaceData,
} from "@/lib/ads/adops-types";

type AdopsContextValue = {
  payload: AdopsPagePayload;
  selectedPlatform: AdopsPlatformId | null;
  setSelectedPlatform: (id: AdopsPlatformId | null) => void;
  platformWorkspace: PlatformWorkspaceData | null;
  selectedCampaign: LiveCampaignRow | null;
  setSelectedCampaign: (c: LiveCampaignRow | null) => void;
  selectedAgent: AdopsAgentView | null;
  setSelectedAgent: (a: AdopsAgentView | null) => void;
  policy: ExecutionSafetyPolicy;
  setPolicy: (p: Partial<ExecutionSafetyPolicy>) => void;
  filter: string;
  setFilter: (f: string) => void;
  search: string;
  setSearch: (s: string) => void;
};

const AdopsContext = createContext<AdopsContextValue | null>(null);

export function AdopsProvider({
  children,
  payload,
}: {
  children: ReactNode;
  payload: AdopsPagePayload;
}) {
  const [selectedPlatform, setSelectedPlatform] = useState<AdopsPlatformId | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<LiveCampaignRow | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AdopsAgentView | null>(null);
  const [policy, setPolicyState] = useState(payload.policy);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const platformWorkspace = useMemo(() => {
    if (!selectedPlatform) return null;
    return buildPlatformWorkspace(
      selectedPlatform,
      payload.businessName,
      payload.rawAccounts,
      payload.liveCampaigns,
    );
  }, [selectedPlatform, payload]);

  const setPolicy = (patch: Partial<ExecutionSafetyPolicy>) => {
    setPolicyState((p) => ({ ...p, ...patch }));
  };

  const value = useMemo(
    () => ({
      payload,
      selectedPlatform,
      setSelectedPlatform,
      platformWorkspace,
      selectedCampaign,
      setSelectedCampaign,
      selectedAgent,
      setSelectedAgent,
      policy,
      setPolicy,
      filter,
      setFilter,
      search,
      setSearch,
    }),
    [
      payload,
      selectedPlatform,
      platformWorkspace,
      selectedCampaign,
      selectedAgent,
      policy,
      filter,
      search,
    ],
  );

  return <AdopsContext.Provider value={value}>{children}</AdopsContext.Provider>;
}

export function useAdops() {
  const ctx = useContext(AdopsContext);
  if (!ctx) throw new Error("useAdops must be used within AdopsProvider");
  return ctx;
}
