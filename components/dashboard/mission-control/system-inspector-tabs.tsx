"use client";

import { cn } from "@/lib/utils";

export type InspectorTabId =
  | "overview"
  | "metrics"
  | "logs"
  | "reasoning"
  | "actions"
  | "history";

const TABS: { id: InspectorTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "metrics", label: "Metrics" },
  { id: "logs", label: "Logs" },
  { id: "reasoning", label: "AI Reasoning" },
  { id: "actions", label: "Actions" },
  { id: "history", label: "History" },
];

export function SystemInspectorTabs({
  active,
  onChange,
}: {
  active: InspectorTabId;
  onChange: (tab: InspectorTabId) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors",
            active === tab.id
              ? "bg-violet-500/20 text-violet-100"
              : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
