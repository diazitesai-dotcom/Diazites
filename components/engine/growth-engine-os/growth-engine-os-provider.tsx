"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { computeCostForecast } from "@/lib/engine/compute-cost-forecast";
import {
  buildEngineDeploymentTargets,
  ENGINE_AGENTS,
} from "@/lib/engine/growth-engine-os-catalog";
import type {
  BusinessIntakeFields,
  EngineAgentKey,
  GrowthEngineOsConfig,
  PipelineStageView,
} from "@/lib/engine/growth-engine-os-types";
import { DEFAULT_OS_CONFIG } from "@/lib/engine/growth-engine-os-types";
import type { CostForecast } from "@/lib/engine/growth-engine-os-types";
import type { EngineDeploymentTarget } from "@/lib/engine/growth-engine-os-types";

type GrowthEngineOsContextValue = {
  config: GrowthEngineOsConfig;
  intake: BusinessIntakeFields;
  targets: EngineDeploymentTarget[];
  forecast: CostForecast;
  selectedStage: PipelineStageView | null;
  setSelectedStage: (s: PipelineStageView | null) => void;
  setIntake: (patch: Partial<BusinessIntakeFields>) => void;
  setAutonomyMode: (mode: GrowthEngineOsConfig["autonomyMode"]) => void;
  setPolicy: (patch: Partial<GrowthEngineOsConfig["policy"]>) => void;
  toggleAgent: (key: EngineAgentKey) => void;
  togglePlatform: (id: string) => void;
  selectedAgentKey: EngineAgentKey | null;
  setSelectedAgentKey: (key: EngineAgentKey | null) => void;
};

const GrowthEngineOsContext = createContext<GrowthEngineOsContextValue | null>(null);

export function GrowthEngineOsProvider({
  children,
  connectedIds,
  defaults,
}: {
  children: ReactNode;
  connectedIds: string[];
  defaults: Partial<BusinessIntakeFields>;
}) {
  const [config, setConfig] = useState<GrowthEngineOsConfig>(DEFAULT_OS_CONFIG);
  const [intake, setIntakeState] = useState<BusinessIntakeFields>({
    websiteUrl: defaults.websiteUrl ?? "",
    businessName: defaults.businessName ?? "",
    niche: defaults.niche ?? "",
    location: defaults.location ?? "",
    monthlyBudget: defaults.monthlyBudget ?? null,
    goal: defaults.goal ?? "",
    targetAudience: defaults.targetAudience ?? "",
    revenueTarget: defaults.revenueTarget ?? "",
    trafficSources: defaults.trafficSources ?? "",
    competitors: defaults.competitors ?? "",
    painPoints: defaults.painPoints ?? "",
    usp: defaults.usp ?? "",
    brandTone: defaults.brandTone ?? "Professional, direct, trustworthy",
    servicesProducts: defaults.servicesProducts ?? "",
    testimonials: defaults.testimonials ?? "",
    complianceRestrictions: defaults.complianceRestrictions ?? "",
    contactInfo: defaults.contactInfo ?? "",
    crmDestination: defaults.crmDestination ?? "Native Leads CRM",
    landingStyle: defaults.landingStyle ?? "High-converting local service",
  });
  const [selectedStage, setSelectedStage] = useState<PipelineStageView | null>(null);
  const [selectedAgentKey, setSelectedAgentKey] = useState<EngineAgentKey | null>(null);

  const connected = useMemo(() => new Set(connectedIds), [connectedIds]);
  const targets = useMemo(() => buildEngineDeploymentTargets(connected), [connected]);
  const forecast = useMemo(
    () => computeCostForecast(intake.monthlyBudget, config),
    [intake.monthlyBudget, config],
  );

  const setIntake = useCallback((patch: Partial<BusinessIntakeFields>) => {
    setIntakeState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setAutonomyMode = useCallback((mode: GrowthEngineOsConfig["autonomyMode"]) => {
    setConfig((c) => ({ ...c, autonomyMode: mode }));
  }, []);

  const setPolicy = useCallback((patch: Partial<GrowthEngineOsConfig["policy"]>) => {
    setConfig((c) => ({ ...c, policy: { ...c.policy, ...patch } }));
  }, []);

  const toggleAgent = useCallback((key: EngineAgentKey) => {
    setConfig((c) => {
      const has = c.enabledAgents.includes(key);
      return {
        ...c,
        enabledAgents: has
          ? c.enabledAgents.filter((k) => k !== key)
          : [...c.enabledAgents, key],
      };
    });
  }, []);

  const togglePlatform = useCallback((id: string) => {
    setConfig((c) => {
      const has = c.selectedPlatforms.includes(id);
      return {
        ...c,
        selectedPlatforms: has
          ? c.selectedPlatforms.filter((p) => p !== id)
          : [...c.selectedPlatforms, id],
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      config,
      intake,
      targets,
      forecast,
      selectedStage,
      setSelectedStage,
      setIntake,
      setAutonomyMode,
      setPolicy,
      toggleAgent,
      togglePlatform,
      selectedAgentKey,
      setSelectedAgentKey,
    }),
    [
      config,
      intake,
      targets,
      forecast,
      selectedStage,
      setIntake,
      setAutonomyMode,
      setPolicy,
      toggleAgent,
      togglePlatform,
      selectedAgentKey,
    ],
  );

  return (
    <GrowthEngineOsContext.Provider value={value}>{children}</GrowthEngineOsContext.Provider>
  );
}

export function useGrowthEngineOs() {
  const ctx = useContext(GrowthEngineOsContext);
  if (!ctx) throw new Error("useGrowthEngineOs must be used within GrowthEngineOsProvider");
  return ctx;
}

export { ENGINE_AGENTS };
