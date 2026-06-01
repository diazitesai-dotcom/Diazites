"use client";

import { useState } from "react";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import {
  Bot,
  Check,
  GripVertical,
  LayoutTemplate,
  Loader2,
  Megaphone,
  Pencil,
  Rocket,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import type {
  FunnelStepKind,
  FunnelStepPlan,
  SetupArtifact,
  SetupPanelKind,
} from "@/actions/mission-control-setup.actions";
import { SetupArtifactCard } from "@/components/dashboard/mission-control/setup-artifact-card";
import { cn } from "@/lib/utils";

export type StepStatus = "suggested" | "building" | "ready" | "error";

export type LiveFunnelStep = FunnelStepPlan & {
  status: StepStatus;
  artifact?: SetupArtifact;
  error?: string;
};

const KIND_META: Record<
  FunnelStepKind,
  { icon: typeof LayoutTemplate; accent: string; ring: string; dot: string }
> = {
  landing_page: {
    icon: LayoutTemplate,
    accent: "text-violet-200",
    ring: "border-violet-500/30 bg-violet-500/15",
    dot: "bg-violet-400",
  },
  campaign: {
    icon: Megaphone,
    accent: "text-cyan-200",
    ring: "border-cyan-500/30 bg-cyan-500/15",
    dot: "bg-cyan-400",
  },
  ad_setup: {
    icon: Target,
    accent: "text-fuchsia-200",
    ring: "border-fuchsia-500/30 bg-fuchsia-500/15",
    dot: "bg-fuchsia-400",
  },
  follow_up: {
    icon: Bot,
    accent: "text-emerald-200",
    ring: "border-emerald-500/30 bg-emerald-500/15",
    dot: "bg-emerald-400",
  },
  qualification: {
    icon: Sparkles,
    accent: "text-amber-200",
    ring: "border-amber-500/30 bg-amber-500/15",
    dot: "bg-amber-400",
  },
};

type FunnelPreviewProps = {
  steps: LiveFunnelStep[];
  pending: boolean;
  onReorder: (next: LiveFunnelStep[]) => void;
  onLaunch: (step: LiveFunnelStep) => void;
  onLaunchAll: () => void;
  onDiscard: (id: string) => void;
  onEdit: (id: string, patch: Partial<LiveFunnelStep>) => void;
  onOpenPanel?: (panel: SetupPanelKind) => void;
};

export function FunnelPreview({
  steps,
  pending,
  onReorder,
  onLaunch,
  onLaunchAll,
  onDiscard,
  onEdit,
  onOpenPanel,
}: FunnelPreviewProps) {
  if (steps.length === 0) return null;

  const readyCount = steps.filter((s) => s.status === "ready").length;
  const allReady = readyCount === steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/30 via-background/60 to-cyan-950/20 p-4 backdrop-blur-xl"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 15% -10%, rgba(167,139,250,0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 100% 10%, rgba(34,211,238,0.12), transparent 55%)",
        }}
      />

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/15">
            <Rocket className="size-3.5 text-violet-200" />
          </span>
          <div>
            <p className="text-sm font-semibold">Your funnel</p>
            <p className="text-[11px] text-muted-foreground">
              {allReady
                ? "All steps launched 🎉"
                : `${readyCount}/${steps.length} launched · drag to reorder, edit, then launch`}
            </p>
          </div>
        </div>
        {!allReady ? (
          <button
            type="button"
            disabled={pending}
            onClick={onLaunchAll}
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
          >
            <Rocket className="size-3.5" />
            Launch all
          </button>
        ) : null}
      </div>

      <Reorder.Group
        axis="y"
        values={steps}
        onReorder={onReorder}
        className="relative space-y-2.5"
      >
        {/* Neon connector spine */}
        <div
          className="pointer-events-none absolute bottom-4 left-[18px] top-4 w-px bg-gradient-to-b from-violet-500/40 via-fuchsia-500/30 to-cyan-500/40"
          aria-hidden
        />
        {steps.map((step, index) => (
          <FunnelNode
            key={step.id}
            step={step}
            index={index}
            pending={pending}
            onLaunch={onLaunch}
            onDiscard={onDiscard}
            onEdit={onEdit}
            onOpenPanel={onOpenPanel}
          />
        ))}
      </Reorder.Group>
    </motion.div>
  );
}

function FunnelNode({
  step,
  index,
  pending,
  onLaunch,
  onDiscard,
  onEdit,
  onOpenPanel,
}: {
  step: LiveFunnelStep;
  index: number;
  pending: boolean;
  onLaunch: (step: LiveFunnelStep) => void;
  onDiscard: (id: string) => void;
  onEdit: (id: string, patch: Partial<LiveFunnelStep>) => void;
  onOpenPanel?: (panel: SetupPanelKind) => void;
}) {
  const meta = KIND_META[step.kind];
  const Icon = meta.icon;
  const locked = step.status === "ready" || step.status === "building";

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(step.title);
  const [draftSummary, setDraftSummary] = useState(step.summary);
  const [draftBudget, setDraftBudget] = useState(step.budget ?? 0);

  function saveEdit() {
    onEdit(step.id, {
      title: draftTitle.trim() || step.title,
      summary: draftSummary.trim() || step.summary,
      ...(step.kind === "campaign" ? { budget: Number(draftBudget) || step.budget } : {}),
    });
    setEditing(false);
  }

  return (
    <Reorder.Item
      value={step}
      dragListener={!locked && !pending}
      className="relative z-10 list-none"
      whileDrag={{ scale: 1.02 }}
    >
      <motion.div
        layout
        className={cn(
          "flex gap-3 rounded-xl border bg-background/70 p-3 backdrop-blur transition-colors",
          step.status === "ready"
            ? "border-emerald-500/30"
            : step.status === "error"
              ? "border-rose-500/30"
              : "border-white/10",
        )}
      >
        {/* Status node + drag handle */}
        <div className="flex flex-col items-center gap-2">
          <span
            className={cn(
              "relative flex size-9 items-center justify-center rounded-lg border",
              meta.ring,
            )}
          >
            <Icon className={cn("size-4", meta.accent)} />
            <StatusBadge status={step.status} />
          </span>
          {!locked && !pending ? (
            <GripVertical className="size-3.5 cursor-grab text-muted-foreground/50 active:cursor-grabbing" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-background/80 px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-violet-500/40"
              />
              <textarea
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-white/10 bg-background/80 px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-violet-500/40"
              />
              {step.kind === "campaign" ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Daily budget $
                  <input
                    type="number"
                    value={draftBudget}
                    onChange={(e) => setDraftBudget(Number(e.target.value))}
                    className="w-20 rounded-lg border border-white/10 bg-background/80 px-2 py-1 text-foreground outline-none focus:ring-1 focus:ring-violet-500/40"
                  />
                </label>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-lg border border-violet-400/40 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-100"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {index + 1}.
                    </span>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {step.summary}
                  </p>
                  {step.kind === "campaign" && step.budget ? (
                    <p className="mt-1 text-[11px] text-cyan-200/80">
                      {step.platform} · ${step.budget}/day
                    </p>
                  ) : null}
                  {step.status === "error" && step.error ? (
                    <p className="mt-1 text-[11px] text-rose-300">{step.error}</p>
                  ) : null}
                </div>
                {!locked ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftTitle(step.title);
                        setDraftSummary(step.summary);
                        setDraftBudget(step.budget ?? 0);
                        setEditing(true);
                      }}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                      aria-label="Edit step"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDiscard(step.id)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Discard step"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>

              <AnimatePresence>
                {step.status === "ready" && step.artifact ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2.5"
                  >
                    <SetupArtifactCard artifact={step.artifact} onOpenPanel={onOpenPanel} />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {step.status === "suggested" || step.status === "error" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onLaunch(step)}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-violet-400/40 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/25 px-3 py-1.5 text-xs font-semibold text-violet-50 transition-colors hover:from-violet-600/45 hover:to-fuchsia-600/40 disabled:opacity-60"
                >
                  <Rocket className="size-3.5" />
                  {step.status === "error" ? "Retry" : "Approve & launch"}
                </button>
              ) : null}

              {step.status === "building" ? (
                <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-amber-200">
                  <Loader2 className="size-3.5 animate-spin" />
                  Building…
                </p>
              ) : null}
            </>
          )}
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  if (status === "ready") {
    return (
      <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border border-background bg-emerald-500">
        <Check className="size-2.5 text-white" />
      </span>
    );
  }
  if (status === "building") {
    return (
      <span className="absolute -bottom-1 -right-1 flex size-3 items-center justify-center rounded-full border border-background bg-amber-400">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400/70" />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="absolute -bottom-1 -right-1 flex size-3 items-center justify-center rounded-full border border-background bg-rose-500" />
    );
  }
  return (
    <span className="absolute -bottom-1 -right-1 size-3 rounded-full border border-background bg-violet-400/60" />
  );
}
