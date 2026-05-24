"use client";

import { Check, Shield, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GrowthPlan } from "@/lib/agents/build-growth-plan";
import type { PlanRisk } from "@/lib/dashboard/mission-control-types";
import { cn } from "@/lib/utils";

const riskStyles: Record<PlanRisk, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-rose-400",
};

type Props = {
  plan: GrowthPlan;
  onApprove: () => void;
  onModify: () => void;
  onReject: () => void;
  pending?: boolean;
};

export function GrowthPlanApproval({ plan, onApprove, onModify, onReject, pending }: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card/40 to-cyan-500/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-100">
          <Sparkles className="size-4 text-violet-300" />
          AI Growth Plan
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Review outcome, stack, and guardrails before execution.
        </p>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Expected outcome
          </dt>
          <dd className="mt-0.5 font-medium text-emerald-300/95">{plan.expectedOutcome}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Confidence
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-cyan-200/90">
              {plan.confidence}%
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Risk
            </dt>
            <dd className={cn("mt-0.5 text-lg font-semibold capitalize", riskStyles[plan.risk])}>
              {plan.risk}
            </dd>
          </div>
        </div>
      </dl>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Included stack
        </p>
        <ul className="flex flex-wrap gap-2">
          {plan.stackItems.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200/90"
            >
              <Check className="size-3 shrink-0" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Shield className="size-3 text-violet-300" />
          Guardrails
        </p>
        <ul className="space-y-1.5">
          {plan.guardrails.map((rule) => (
            <li key={rule} className="flex items-center gap-2 text-xs text-foreground/90">
              <Check className="size-3.5 shrink-0 text-violet-300" aria-hidden />
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="gradient"
          className="mission-shimmer-btn flex-1 rounded-xl"
          onClick={onApprove}
          disabled={pending}
        >
          Approve Plan
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl border-white/10"
          onClick={onModify}
          disabled={pending}
        >
          Modify Plan
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-xl text-muted-foreground hover:text-rose-300"
          onClick={onReject}
          disabled={pending}
        >
          <X className="mr-1 size-3.5" />
          Reject
        </Button>
      </div>
    </div>
  );
}
