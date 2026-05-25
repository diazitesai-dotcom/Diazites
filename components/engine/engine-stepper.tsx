import { Check, CircleDot, Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ENGINE_STEPS, stepIndex } from "@/lib/engine-steps";
import type { EngineStep } from "@/repositories/engine.repository";

type EngineStepperProps = {
  currentStep: EngineStep;
  status: "running" | "needs_approval" | "launched" | "failed" | "archived";
};

export function EngineStepper({ currentStep, status }: EngineStepperProps) {
  const currentIdx = stepIndex(currentStep);
  const launched = status === "launched";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ENGINE_STEPS.map((stage) => {
        const idx = stepIndex(stage.key);
        const state =
          launched || idx < currentIdx
            ? "complete"
            : idx === currentIdx
              ? "current"
              : "upcoming";

        return (
          <Card
            key={stage.key}
            size="sm"
            className={cn(
              "relative border transition",
              state === "complete" &&
                "border-emerald-500/30 bg-emerald-500/[0.04]",
              state === "current" &&
                "border-violet-500/50 bg-violet-500/[0.06] shadow-[0_0_32px_-12px_rgba(167,139,250,0.55)]",
              state === "upcoming" && "border-border/60",
            )}
          >
            <CardContent className="flex flex-col gap-3 pt-5">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                    state === "complete" && "bg-emerald-500/20 text-emerald-300",
                    state === "current" && "bg-violet-500/20 text-violet-200",
                    state === "upcoming" && "bg-muted/50 text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {state === "complete" ? (
                    <Check className="size-3.5" />
                  ) : state === "current" ? (
                    <CircleDot className="size-3.5" />
                  ) : (
                    stage.index
                  )}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                    state === "complete" &&
                      "border-emerald-500/30 text-emerald-300",
                    state === "current" &&
                      "border-violet-500/40 text-violet-200",
                    state === "upcoming" &&
                      "border-border/60 text-muted-foreground",
                  )}
                >
                  {state === "complete"
                    ? "Done"
                    : state === "current"
                      ? "Active"
                      : "Queued"}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold leading-tight">
                  {stage.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stage.subtitle}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                {stage.description}
              </p>
              {state === "upcoming" ? (
                <Lock
                  className="absolute right-3 top-3 size-3 text-muted-foreground/40"
                  aria-hidden
                />
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
