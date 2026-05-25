"use client";

import { Shield } from "lucide-react";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ExecutionSafetyPanel() {
  const { policy, setPolicy } = useAdops();

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-violet-400" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Execution safety
        </h2>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Daily caps, approval thresholds, tracking auto-pause, and rollback guardrails.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          label="Daily spend cap ($)"
          value={policy.dailySpendCap}
          onChange={(v) => setPolicy({ dailySpendCap: v })}
        />
        <Field
          label="Campaign spend cap ($)"
          value={policy.campaignSpendCap}
          onChange={(v) => setPolicy({ campaignSpendCap: v })}
        />
        <Field
          label="Max CPL ($)"
          value={policy.maxCpl}
          onChange={(v) => setPolicy({ maxCpl: v })}
        />
        <Field
          label="Min ROAS (×)"
          value={policy.minRoas}
          onChange={(v) => setPolicy({ minRoas: v })}
        />
        <Field
          label="Approval over spend ($)"
          value={policy.approvalThresholdUsd}
          onChange={(v) => setPolicy({ approvalThresholdUsd: v })}
        />
      </div>
      <ul className="mt-4 space-y-2 text-xs">
        <ToggleRow
          label="Pause on tracking failure"
          checked={policy.pauseOnTrackingFailure}
          onChange={(v) => setPolicy({ pauseOnTrackingFailure: v })}
        />
        <ToggleRow
          label="Alert on disconnected account"
          checked={policy.alertOnDisconnect}
          onChange={(v) => setPolicy({ alertOnDisconnect: v })}
        />
        <ToggleRow
          label="Rollback support enabled"
          checked={policy.rollbackEnabled}
          onChange={(v) => setPolicy({ rollbackEnabled: v })}
        />
      </ul>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <Input
        type="number"
        className="mt-1 h-9"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
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
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-violet-500" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
            checked ? "left-4" : "left-0.5",
          )}
        />
      </button>
    </li>
  );
}
