import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProgressStep } from "@/types/ceo-command-center";

type ProgressTrackerProps = {
  steps: ProgressStep[];
};

const statusStyles: Record<ProgressStep["status"], string> = {
  completed: "border-violet-500 bg-violet-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.45)]",
  active: "border-violet-400 bg-violet-500/90 text-white shadow-[0_0_16px_rgba(139,92,246,0.35)]",
  review: "border-pink-400 bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-[0_0_16px_rgba(236,72,153,0.4)]",
  pending: "border-white/10 bg-white/[0.04] text-slate-500",
};

const lineStyles: Record<ProgressStep["status"], string> = {
  completed: "bg-violet-500/70",
  active: "bg-violet-500/70",
  review: "bg-pink-500/50",
  pending: "bg-white/10",
};

export function ProgressTracker({ steps }: ProgressTrackerProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0c1222]/60 px-4 py-5 backdrop-blur-xl">
      <div className="flex min-w-[900px] items-start justify-between gap-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const lineStatus =
            step.status === "completed" || step.status === "active"
              ? "completed"
              : step.status === "review"
                ? "review"
                : "pending";

          return (
            <div key={step.id} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                    statusStyles[step.status],
                  )}
                >
                  {step.status === "completed" ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </div>
                <p
                  className={cn(
                    "mt-2 max-w-[5.5rem] text-center text-[10px] leading-tight sm:text-xs",
                    step.status === "pending" ? "text-slate-500" : "text-slate-300",
                    step.status === "review" && "font-medium text-pink-200",
                  )}
                >
                  {step.label}
                </p>
              </div>
              {!isLast ? (
                <div className="mt-[1.125rem] h-0.5 flex-1 self-start">
                  <div className={cn("h-full w-full rounded-full", lineStyles[lineStatus])} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
