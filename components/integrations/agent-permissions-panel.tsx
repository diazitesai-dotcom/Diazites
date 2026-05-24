"use client";

import { useState } from "react";
import { ScrollText, Shield } from "lucide-react";

import { DEFAULT_BUDGET_CONTROLS } from "@/lib/integrations/growth-integrations-catalog";
import type { AgentPermissionLevel } from "@/lib/integrations/integration-types";
import { cn } from "@/lib/utils";

const PERMISSIONS: { id: AgentPermissionLevel; label: string; description: string }[] = [
  { id: "read_only", label: "Read-only", description: "View metrics and logs only" },
  { id: "recommend_only", label: "Recommend only", description: "Suggest actions — no execution" },
  { id: "requires_approval", label: "Requires approval", description: "Execute after human sign-off" },
  { id: "auto_execute", label: "Auto-execute within limits", description: "Run within spend and policy caps" },
  { id: "full_autonomous", label: "Full autonomous mode", description: "High-trust — audit all actions" },
];

export function AgentPermissionsPanel() {
  const [level, setLevel] = useState<AgentPermissionLevel>("requires_approval");

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/30 to-card/60 p-5">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-violet-300" />
        <h2 className="text-sm font-semibold">Agent permissions manager</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Control what AI agents can do across connected platforms. High-risk actions require approval.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PERMISSIONS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setLevel(p.id)}
            className={cn(
              "rounded-xl border p-3 text-left text-xs transition-colors",
              level === p.id
                ? "border-violet-500/40 bg-violet-500/15"
                : "border-white/10 bg-white/[0.02] hover:border-white/20",
            )}
          >
            <p className="font-medium">{p.label}</p>
            <p className="mt-0.5 text-muted-foreground">{p.description}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/20 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Budget safety</p>
        <ul className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          <li>Daily cap: {DEFAULT_BUDGET_CONTROLS.dailySpendCap}</li>
          <li>Campaign cap: {DEFAULT_BUDGET_CONTROLS.campaignSpendCap}</li>
          <li>{DEFAULT_BUDGET_CONTROLS.approvalThreshold}</li>
          <li>Auto-pause CPL spike: {DEFAULT_BUDGET_CONTROLS.autoPauseCplSpike ? "On" : "Off"}</li>
          <li>Auto-pause ROAS drop: {DEFAULT_BUDGET_CONTROLS.autoPauseRoasDrop ? "On" : "Off"}</li>
          <li>Alert failed tracking: {DEFAULT_BUDGET_CONTROLS.alertFailedTracking ? "On" : "Off"}</li>
        </ul>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <ScrollText className="size-3" />
        All agent actions are written to audit log · rollback available where supported
      </p>
    </div>
  );
}
