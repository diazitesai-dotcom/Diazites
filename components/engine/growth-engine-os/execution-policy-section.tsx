"use client";

import { Shield } from "lucide-react";

import { useGrowthEngineOs } from "@/components/engine/growth-engine-os/growth-engine-os-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutonomyMode } from "@/lib/engine/growth-engine-os-types";
import { cn } from "@/lib/utils";

const MODES: { id: AutonomyMode; label: string; desc: string }[] = [
  { id: "recommend_only", label: "Recommend only", desc: "Agents suggest — you execute." },
  { id: "requires_approval", label: "Requires approval", desc: "High-risk actions need sign-off." },
  { id: "auto_execute", label: "Auto execute under limits", desc: "Bounded spend and scope." },
  { id: "full_autonomous", label: "Full autonomous mode", desc: "Agents run within guardrails." },
];

export function ExecutionPolicySection() {
  const { config, setAutonomyMode, setPolicy } = useGrowthEngineOs();
  const { policy } = config;

  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 p-6 shadow-lg">
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-violet-300" />
        <div>
          <h2 className="text-lg font-semibold">Execution policy</h2>
          <p className="text-sm text-muted-foreground">Approval mode and budget safety before deployment.</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setAutonomyMode(mode.id)}
            className={cn(
              "rounded-xl border p-3 text-left transition-all",
              config.autonomyMode === mode.id
                ? "border-violet-500/50 bg-violet-500/15 ring-1 ring-violet-400/30"
                : "border-white/[0.08] hover:border-white/15",
            )}
          >
            <p className="text-sm font-medium">{mode.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{mode.desc}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PolicyField label="Daily spend cap ($)" value={policy.dailySpendCap} onChange={(v) => setPolicy({ dailySpendCap: v })} />
        <PolicyField label="Campaign spend cap ($)" value={policy.campaignSpendCap} onChange={(v) => setPolicy({ campaignSpendCap: v })} />
        <PolicyField label="Approval over ($)" value={policy.approvalThresholdUsd} onChange={(v) => setPolicy({ approvalThresholdUsd: v })} />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 text-sm">
        <ToggleRow label="Auto-pause if CPL spikes" checked={policy.autoPauseCplSpike} onChange={(c) => setPolicy({ autoPauseCplSpike: c })} />
        <ToggleRow label="Auto-pause if ROAS drops" checked={policy.autoPauseRoasDrop} onChange={(c) => setPolicy({ autoPauseRoasDrop: c })} />
        <ToggleRow label="Alert if tracking breaks" checked={policy.alertTrackingBreak} onChange={(c) => setPolicy({ alertTrackingBreak: c })} />
        <ToggleRow label="Alert if account disconnects" checked={policy.alertAccountDisconnect} onChange={(c) => setPolicy({ alertAccountDisconnect: c })} />
        <ToggleRow label="Rollback failed deployment" checked={policy.rollbackOnFailure} onChange={(c) => setPolicy({ rollbackOnFailure: c })} />
      </ul>
    </section>
  );
}

function PolicyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.06] px-3 py-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-violet-500" />
      <span className="text-xs">{label}</span>
    </label>
  );
}
