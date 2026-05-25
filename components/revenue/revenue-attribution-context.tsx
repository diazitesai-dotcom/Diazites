"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { RevenueAttributionSnapshot } from "@/types/revenue-attribution";

type RevenueAttributionContextValue = {
  attribution: RevenueAttributionSnapshot;
  drawerOpen: boolean;
  journeyId: string | null;
  openDrawer: (journeyId?: string | null) => void;
  closeDrawer: () => void;
};

const RevenueAttributionContext = createContext<RevenueAttributionContextValue | null>(null);

export function RevenueAttributionProvider({
  attribution,
  children,
}: {
  attribution: RevenueAttributionSnapshot;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [journeyId, setJourneyId] = useState<string | null>(null);

  const openDrawer = useCallback((id?: string | null) => {
    setJourneyId(id ?? null);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setJourneyId(null);
  }, []);

  const value = useMemo(
    () => ({ attribution, drawerOpen, journeyId, openDrawer, closeDrawer }),
    [attribution, drawerOpen, journeyId, openDrawer, closeDrawer],
  );

  return (
    <RevenueAttributionContext.Provider value={value}>
      {children}
    </RevenueAttributionContext.Provider>
  );
}

export function useRevenueAttribution() {
  const ctx = useContext(RevenueAttributionContext);
  if (!ctx) {
    throw new Error("useRevenueAttribution must be used within RevenueAttributionProvider");
  }
  return ctx;
}

export function useRevenueAttributionOptional() {
  return useContext(RevenueAttributionContext);
}
