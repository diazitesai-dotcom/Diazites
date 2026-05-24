"use client";

import { Check, X } from "lucide-react";

import { AiModeCallout } from "@/components/agents/ai-mode-callout";
import { AI_MODE_BEHAVIOR } from "@/lib/agents/ai-mode-behavior";
import { MODE_GUARDRAILS } from "@/lib/agents/stack-deployment-catalog";
import { cn } from "@/lib/utils";
import type { AutonomousMode } from "@/types/agent-deployment";

export function AiModeSelector({
  mode,
  onChange,
  className,
}: {
  mode: AutonomousMode;
  onChange: (mode: AutonomousMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.02] p-3",
        mode === "autonomous" && "mission-autonomous-glow border-violet-500/30",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        AI Mode
      </p>
      <div className="mt-2 flex gap-1">
        {(["manual", "guided", "autonomous"] as AutonomousMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-all",
              mode === m
                ? "border-violet-500/50 bg-violet-500/15 text-violet-100 shadow-[0_0_20px_-8px_rgba(139,92,246,0.5)]"
                : "border-white/10 text-muted-foreground hover:border-white/20",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs capitalize">
              <span
                className={cn(
                  "size-2 rounded-full border",
                  mode === m ? "border-violet-300 bg-violet-400" : "border-white/30",
                )}
              />
              {m}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/90">{AI_MODE_BEHAVIOR[mode].label}:</span>{" "}
        {AI_MODE_BEHAVIOR[mode].helper}
      </p>

      <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Guardrails
        </p>
        <ul className="mt-2 space-y-1.5">
          {MODE_GUARDRAILS[mode].map((g) => (
            <li key={g.label} className="flex items-center gap-2 text-[11px]">
              {g.enabled ? (
                <Check className="size-3 shrink-0 text-emerald-400" />
              ) : (
                <X className="size-3 shrink-0 text-muted-foreground/60" />
              )}
              <span className={g.enabled ? "text-foreground/90" : "text-muted-foreground"}>
                {g.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <AiModeCallout mode={mode} className="mt-2" />
    </div>
  );
}
