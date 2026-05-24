"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buildSystemModuleDetails } from "@/lib/dashboard/build-system-module-details";
import type {
  SystemModuleContext,
  SystemModuleDetail,
  SystemModuleId,
} from "@/lib/dashboard/system-module-types";

type SystemModuleContextValue = {
  details: Record<SystemModuleId, SystemModuleDetail>;
  activeModule: SystemModuleId | null;
  drawerOpen: boolean;
  loading: boolean;
  openModule: (id: SystemModuleId) => void;
  closeModule: () => void;
  activeDetail: SystemModuleDetail | null;
};

const Ctx = createContext<SystemModuleContextValue | null>(null);

export function SystemModuleProvider({
  context,
  children,
}: {
  context: SystemModuleContext;
  children: ReactNode;
}) {
  const details = useMemo(() => buildSystemModuleDetails(context), [context]);
  const [activeModule, setActiveModule] = useState<SystemModuleId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openModule = useCallback((id: SystemModuleId) => {
    setActiveModule(id);
    setDrawerOpen(true);
    setLoading(true);
  }, []);

  const closeModule = useCallback(() => {
    setDrawerOpen(false);
    setLoading(false);
    window.setTimeout(() => setActiveModule(null), 280);
  }, []);

  useEffect(() => {
    if (!drawerOpen || !activeModule) return;
    const t = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(t);
  }, [drawerOpen, activeModule]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModule();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeModule]);

  const activeDetail = activeModule ? details[activeModule] : null;

  return (
    <Ctx.Provider
      value={{
        details,
        activeModule,
        drawerOpen,
        loading,
        openModule,
        closeModule,
        activeDetail,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSystemModule() {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("useSystemModule must be used within SystemModuleProvider");
  }
  return value;
}

export function useSystemModuleOptional() {
  return useContext(Ctx);
}
