"use client";

import { Sparkles } from "lucide-react";

import { AI_MODE_BEHAVIOR } from "@/lib/agents/ai-mode-behavior";
import { cn } from "@/lib/utils";
import type { AutonomousMode } from "@/types/agent-deployment";

export function AiModeCallout({
  mode,
  className,
}: {
  mode: AutonomousMode;
  className?: string;
}) {
  const behavior = AI_MODE_BEHAVIOR[mode];
  if (!behavior.note) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>{behavior.summary}</p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-xs leading-relaxed",
        mode === "autonomous"
          ? "border-violet-500/30 bg-violet-500/10 text-violet-100/90"
          : "border-cyan-500/25 bg-cyan-500/10 text-cyan-100/90",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 font-medium">
        <Sparkles className="size-3.5 shrink-0" />
        {behavior.note}
      </p>
      <p className="mt-1 text-muted-foreground">{behavior.summary}</p>
    </div>
  );
}
