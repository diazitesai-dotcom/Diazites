"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Loader2,
  Rocket,
  Save,
  Sparkles,
} from "lucide-react";

import { LaunchStepCard } from "@/components/onboarding/launch-step-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { allLaunchSystemsReady } from "@/lib/launch-builder/generate-launch-plan";
import type { LaunchPlan, LaunchStep } from "@/lib/launch-builder/types";
import { LAUNCH_STEP_LABELS } from "@/lib/launch-builder/types";
import type { OnboardingDraft } from "@/lib/onboarding/draft";
import {
  approveAndLaunchAction,
  deleteLaunchStepAction,
  duplicateLaunchStepAction,
  editLaunchStepFieldAction,
  regenerateLaunchStepAction,
  reorderLaunchStepsAction,
  saveLaunchDraftAction,
} from "@/services/onboarding/launch-builder.actions";
import { cn } from "@/lib/utils";

type LaunchBuilderReviewProps = {
  draft: OnboardingDraft;
  initialPlan: LaunchPlan;
  onBack: () => void;
};

export function LaunchBuilderReview({ draft, initialPlan, onBack }: LaunchBuilderReviewProps) {
  const [plan, setPlan] = useState<LaunchPlan>(initialPlan);
  const [error, setError] = useState<string | null>(null);
  const [previewStep, setPreviewStep] = useState<LaunchStep | null>(null);
  const [editStep, setEditStep] = useState<LaunchStep | null>(null);
  const [editJson, setEditJson] = useState("");
  const [isPending, startTransition] = useTransition();

  const sortedSteps = useMemo(
    () => [...plan.steps].sort((a, b) => a.order - b.order),
    [plan.steps],
  );

  const readiness = useMemo(() => {
    const kinds = Object.keys(LAUNCH_STEP_LABELS) as Array<keyof typeof LAUNCH_STEP_LABELS>;
    return kinds.map((kind) => ({
      kind,
      label: LAUNCH_STEP_LABELS[kind],
      ready: plan.steps.some((s) => s.kind === kind),
    }));
  }, [plan.steps]);

  const allReady = allLaunchSystemsReady(plan);

  function runAction(fn: () => Promise<{ success: boolean; plan?: LaunchPlan; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.success) {
        setError(res.error ?? "Action failed");
        return;
      }
      if (res.plan) setPlan(res.plan);
    });
  }

  function moveStep(stepId: string, direction: -1 | 1) {
    const ids = sortedSteps.map((s) => s.id);
    const idx = ids.indexOf(stepId);
    const swap = idx + direction;
    if (swap < 0 || swap >= ids.length) return;
    [ids[idx], ids[swap]] = [ids[swap]!, ids[idx]!];
    runAction(async () => reorderLaunchStepsAction(plan, ids));
  }

  function handleApproveLaunch() {
    startTransition(async () => {
      setError(null);
      const res = await approveAndLaunchAction(draft, plan);
      if (!res.success) {
        setError(res.error ?? "Launch failed");
        return;
      }
      window.location.assign(res.redirectTo);
    });
  }

  function handleSaveDraft() {
    startTransition(async () => {
      const res = await saveLaunchDraftAction(draft, plan);
      if (!res.success) setError(res.error ?? "Could not save draft");
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
          Diazites AI Launch Builder
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          {plan.nicheDisplayName} launch system for {plan.businessName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI built your draft from onboarding data. Preview, edit, duplicate, delete, or regenerate
          any step — nothing is locked.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{plan.sourceSummary}</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {readiness.map((r) => (
          <div
            key={r.kind}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
              r.ready
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-white/[0.08] bg-white/[0.02] text-muted-foreground",
            )}
          >
            {r.ready ? <Check className="size-4 shrink-0 text-emerald-400" /> : null}
            {r.label} {r.ready ? "Ready" : "Pending"}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {sortedSteps.map((step, index) => (
          <LaunchStepCard
            key={step.id}
            step={step}
            stepNumber={index + 1}
            busy={isPending}
            canMoveUp={index > 0}
            canMoveDown={index < sortedSteps.length - 1}
            onMoveUp={() => moveStep(step.id, -1)}
            onMoveDown={() => moveStep(step.id, 1)}
            onPreview={() => setPreviewStep(step)}
            onEdit={() => {
              setEditStep(step);
              setEditJson(JSON.stringify(step.data, null, 2));
            }}
            onRegenerate={() =>
              runAction(async () => regenerateLaunchStepAction(draft, plan, step.kind))
            }
            onDuplicate={() => runAction(async () => duplicateLaunchStepAction(plan, step.id))}
            onDelete={() => runAction(async () => deleteLaunchStepAction(plan, step.id))}
          />
        ))}
      </div>

      <div className="sticky bottom-0 z-10 rounded-2xl border border-white/[0.1] bg-background/95 p-4 backdrop-blur-md">
        <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
          {allReady
            ? "All launch systems generated — review and launch when ready."
            : "Some sections were removed — regenerate or add steps before launch."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
            Back
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={handleSaveDraft} disabled={isPending}>
            <Save className="size-4" />
            Save Draft
          </Button>
          <Button
            type="button"
            variant="gradient"
            className="gap-2 rounded-xl"
            onClick={handleApproveLaunch}
            disabled={isPending || sortedSteps.length === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Launching…
              </>
            ) : (
              <>
                <Rocket className="size-4" />
                Approve & Launch
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={!!previewStep} onOpenChange={(o) => !o && setPreviewStep(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewStep?.title}</DialogTitle>
            <DialogDescription>Preview — editable after launch in Mission Control.</DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-black/40 p-4 text-xs">
            {previewStep ? JSON.stringify(previewStep.data, null, 2) : ""}
          </pre>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editStep} onOpenChange={(o) => !o && setEditStep(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit step manually</DialogTitle>
            <DialogDescription>
              Update JSON fields below. Invalid JSON will not save.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="step-json">Step data (JSON)</Label>
            <textarea
              id="step-json"
              className="min-h-[280px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              value={editJson}
              onChange={(e) => setEditJson(e.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditStep(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient"
              className="gap-1"
              onClick={() => {
                if (!editStep) return;
                try {
                  const data = JSON.parse(editJson) as Record<string, unknown>;
                  runAction(async () => editLaunchStepFieldAction(plan, editStep.id, data));
                  setEditStep(null);
                } catch {
                  setError("Invalid JSON — fix the syntax and try again.");
                }
              }}
            >
              <Sparkles className="size-4" />
              Save edits
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
