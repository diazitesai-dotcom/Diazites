"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Layers,
  Loader2,
  Rocket,
  Settings2,
  SkipForward,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";

import { deployAgentStackAction } from "@/actions/agent-deployment.actions";
import { AgentLifecycleBadge } from "@/components/agents/agent-lifecycle-badge";
import { AgentOrchestrationTimeline } from "@/components/agents/agent-orchestration-timeline";
import { AgentStackFlow } from "@/components/agents/agent-stack-flow";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  agentDisplayName,
  buildStackFlow,
  estimateSetupMinutes,
  expectedUpliftForGoal,
  impactForAgents,
  mapDbStatusToLifecycle,
  recommendAgentsForGoal,
} from "@/lib/agents/deployment-catalog";
import { getDeploymentPreset } from "@/lib/agents/deployment-presets";
import type { AgentDeploymentPresetId } from "@/lib/agents/deployment-presets";
import { cn } from "@/lib/utils";
import {
  AGENT_STACKS,
  DEPLOYMENT_GOALS,
  type AgentDeploymentContext,
  type AutonomousMode,
  type DeploymentConfig,
  type DeploymentGoalId,
  type AgentStackId,
  type DeploymentLaunchSource,
  type ReadinessCheckId,
  type TimelineEvent,
} from "@/types/agent-deployment";
import type { AgentType } from "@/types/domain";

type AgentRow = { agent_type: string; status: string };

type StepId = "goal" | "stack" | "config" | "readiness" | "deploy" | "monitor";

const STEPS: { id: StepId; label: string }[] = [
  { id: "goal", label: "Goal" },
  { id: "stack", label: "Stack" },
  { id: "config", label: "Configure" },
  { id: "readiness", label: "Readiness" },
  { id: "deploy", label: "Deploy" },
  { id: "monitor", label: "Live" },
];

const DEPLOY_PHASES = [
  "Initializing orchestration…",
  "Provisioning agent infrastructure…",
  "Initializing agents…",
  "Connecting CRM & ads…",
  "Generating assets…",
  "Launching campaigns…",
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: AgentRow[];
  context: AgentDeploymentContext | null;
  initialGoal?: DeploymentGoalId;
  initialStack?: AgentStackId;
  initialAgent?: AgentType;
  initialStep?: StepId;
  initialPreset?: AgentDeploymentPresetId;
  initialMode?: AutonomousMode;
  launchSource?: DeploymentLaunchSource;
};

export function AgentDeploymentDrawer({
  open,
  onOpenChange,
  agents,
  context,
  initialGoal,
  initialStack,
  initialAgent,
  initialStep,
  initialPreset,
  initialMode,
  launchSource,
}: Props) {
  const presetBundle = initialPreset ? getDeploymentPreset(initialPreset) : null;
  const resolvedGoal: DeploymentGoalId =
    initialGoal ?? presetBundle?.goal ?? "generate_leads";

  const defaultConfig = {
    ...(context?.prefill ?? {
      budget: "50",
      platform: "meta_google",
      audience: "Homeowners · 25mi radius",
      offer: "Free roof inspection",
      cta: "Book Your Inspection",
      brandVoice: "Professional, trustworthy, local expert",
    }),
    ...(presetBundle?.config ?? {}),
  } satisfies DeploymentConfig;

  const [step, setStep] = useState<StepId>(initialStep ?? "goal");
  const [goalId, setGoalId] = useState<DeploymentGoalId>(resolvedGoal);
  const [selectedAgents, setSelectedAgents] = useState<AgentType[]>(() => {
    if (initialAgent) return [initialAgent];
    if (presetBundle) return [presetBundle.agent];
    if (initialStack) {
      return [...(AGENT_STACKS.find((s) => s.id === initialStack)?.agents ?? [])];
    }
    return recommendAgentsForGoal(resolvedGoal);
  });
  const [customizeStack, setCustomizeStack] = useState(false);
  const [config, setConfig] = useState<DeploymentConfig>(defaultConfig);
  const [skippedReadiness, setSkippedReadiness] = useState<Set<ReadinessCheckId>>(new Set());
  const [mode, setMode] = useState<AutonomousMode>(
    initialMode ?? presetBundle?.defaultMode ?? "guided",
  );
  const [deployPhase, setDeployPhase] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [deployingTypes, setDeployingTypes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const readiness = context?.readiness ?? [];
  const monitoring = context?.monitoring;
  const setupMinutes = estimateSetupMinutes(selectedAgents.length);
  const impact = impactForAgents(selectedAgents);
  const uplift = expectedUpliftForGoal(goalId);
  const stackFlow = useMemo(() => buildStackFlow(selectedAgents), [selectedAgents]);
  const readinessOk = readiness.filter(
    (r) => r.ok || skippedReadiness.has(r.id),
  ).length;
  const readinessTotal = readiness.length || 6;

  const byType = useMemo(() => new Map(agents.map((a) => [a.agent_type, a])), [agents]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "deploy") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange, step]);

  useEffect(() => {
    if (!open) return;
    if (initialPreset) {
      const p = getDeploymentPreset(initialPreset);
      setGoalId(p.goal);
      setSelectedAgents([p.agent]);
      setConfig({ ...defaultConfig, ...p.config });
      setMode(initialMode ?? p.defaultMode);
    }
    if (initialGoal) setGoalId(initialGoal);
    if (initialStack) {
      const stack = AGENT_STACKS.find((s) => s.id === initialStack);
      if (stack) setSelectedAgents([...stack.agents]);
    }
    if (initialAgent) {
      setSelectedAgents([initialAgent]);
      setStep(initialStep ?? "stack");
    } else if (initialStep) {
      setStep(initialStep);
    }
    if (initialMode) setMode(initialMode);
    if (!initialPreset && context?.prefill) setConfig({ ...defaultConfig, ...context.prefill });
  }, [open, initialGoal, initialStack, initialAgent, initialStep, initialPreset, initialMode, context?.prefill]);

  function selectGoal(id: DeploymentGoalId) {
    setGoalId(id);
    setSelectedAgents(recommendAgentsForGoal(id));
    setCustomizeStack(false);
  }

  function applyStack(stackId: AgentStackId) {
    const stack = AGENT_STACKS.find((s) => s.id === stackId);
    if (stack) {
      setSelectedAgents([...stack.agents]);
      setStep("stack");
    }
  }

  function toggleAgent(type: AgentType) {
    setSelectedAgents((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function runDeploySequence() {
    setStep("deploy");
    setDeployPhase(0);
    setError(null);
    setDeployingTypes(new Set(selectedAgents));

    let phase = 0;
    const phaseTimer = setInterval(() => {
      phase += 1;
      setDeployPhase(phase);
      if (phase >= DEPLOY_PHASES.length) clearInterval(phaseTimer);
    }, 750);

    startTransition(async () => {
      await new Promise((r) => setTimeout(r, DEPLOY_PHASES.length * 750 + 300));
      clearInterval(phaseTimer);

      const result = await deployAgentStackAction({
        goalId,
        agentTypes: selectedAgents,
        config,
        mode,
      });

      setDeployingTypes(new Set());

      if (!result.ok) {
        setError(result.error);
        setStep("readiness");
        return;
      }

      setTimeline(result.timeline);
      setStep("monitor");
    });
  }

  function resetAndClose() {
    setStep("goal");
    setError(null);
    setTimeline([]);
    setSkippedReadiness(new Set());
    onOpenChange(false);
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => step !== "deploy" && resetAndClose()}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.aside
            role="dialog"
            aria-label="Agent deployment"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-lg flex-col border-l border-white/10 bg-card/98 shadow-[-24px_0_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <header className="shrink-0 border-b border-white/10 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 shadow-[0_0_20px_-6px_rgba(139,92,246,0.5)]">
                    <Rocket className="size-4 text-violet-300" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Agent Deployment</p>
                    <p className="text-[11px] text-muted-foreground">
                      {launchSource
                        ? `Launched from ${launchSource.replace(/_/g, " ")}`
                        : "Unified orchestration"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg"
                  onClick={resetAndClose}
                  disabled={step === "deploy" && pending}
                  aria-label="Close deployment"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <nav className="mt-4 flex gap-1 overflow-x-auto pb-1" aria-label="Deployment steps">
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide",
                      i <= stepIndex ? "text-violet-200" : "text-muted-foreground/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full text-[9px]",
                        i < stepIndex
                          ? "bg-violet-500/30 text-violet-100"
                          : i === stepIndex
                            ? "bg-violet-500 text-white"
                            : "bg-white/10",
                      )}
                    >
                      {i < stepIndex ? <Check className="size-2.5" /> : i + 1}
                    </span>
                    {s.label}
                  </div>
                ))}
              </nav>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <AnimatePresence mode="wait">
                {step === "goal" ? (
                  <motion.div
                    key="goal"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-5"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Target className="size-4 text-violet-300" />
                        Select deployment goal
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Diazites AI will recommend the optimal agent stack for your objective.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Quick stacks
                      </p>
                      <div className="grid gap-2">
                        {AGENT_STACKS.map((stack) => (
                          <button
                            key={stack.id}
                            type="button"
                            onClick={() => applyStack(stack.id)}
                            className="mission-elevate flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm transition-all hover:border-violet-500/35"
                          >
                            <span className="flex items-center gap-2">
                              <Layers className="size-3.5 text-violet-300" />
                              {stack.label}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {DEPLOYMENT_GOALS.map((g) => (
                        <li key={g.id}>
                          <button
                            type="button"
                            onClick={() => selectGoal(g.id)}
                            className={cn(
                              "mission-elevate w-full rounded-xl border px-4 py-3 text-left transition-all",
                              goalId === g.id
                                ? "border-violet-500/50 bg-violet-500/10 shadow-[0_4px_24px_-8px_rgba(139,92,246,0.35)]"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20",
                            )}
                          >
                            <p className="text-sm font-medium">{g.label}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{g.description}</p>
                            <p className="mt-1 text-[10px] font-medium text-emerald-300/90">{g.uplift}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}

                {step === "stack" ? (
                  <motion.div
                    key="stack"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-5"
                  >
                    <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
                        <Sparkles className="size-4" />
                        AI recommended stack
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Based on <strong className="text-foreground">{DEPLOYMENT_GOALS.find((g) => g.id === goalId)?.label}</strong>
                      </p>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Setup time</dt>
                          <dd className="mt-0.5 font-semibold">~{setupMinutes} min</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Expected uplift</dt>
                          <dd className="mt-0.5 font-semibold text-emerald-300/90">{uplift}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-muted-foreground">Impact model</dt>
                          <dd className="mt-0.5 text-xs text-foreground/90">{impact}</dd>
                        </div>
                      </dl>
                    </div>

                    <AgentStackFlow flow={stackFlow} />

                    <ul className="space-y-2">
                      {(customizeStack ? (["social_ads", "search_ads", "landing_page", "lead_qualification", "ai_follow_up", "retargeting"] as AgentType[]) : selectedAgents).map(
                        (type) => {
                          const row = byType.get(type);
                          const lifecycle = mapDbStatusToLifecycle(
                            row?.status ?? "inactive",
                            deployingTypes.has(type),
                            mode,
                          );
                          const checked = selectedAgents.includes(type);
                          return (
                            <li
                              key={type}
                              className={cn(
                                "flex items-center justify-between rounded-xl border px-3 py-2.5",
                                checked ? "border-white/15 bg-white/[0.04]" : "border-white/[0.06] opacity-60",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {customizeStack ? (
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleAgent(type)}
                                    className="size-4 rounded border-white/20 accent-violet-500"
                                  />
                                ) : null}
                                <div>
                                  <p className="text-sm font-medium">{agentDisplayName(type)}</p>
                                </div>
                              </div>
                              <AgentLifecycleBadge state={lifecycle} />
                            </li>
                          );
                        },
                      )}
                    </ul>

                    {!customizeStack ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="gradient"
                          className="mission-shimmer-btn flex-1 rounded-xl"
                          onClick={() => setStep("config")}
                        >
                          Deploy recommended
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-xl border-white/10"
                          onClick={() => setCustomizeStack(true)}
                        >
                          Customize stack
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="gradient"
                        className="w-full rounded-xl"
                        disabled={selectedAgents.length === 0}
                        onClick={() => {
                          setCustomizeStack(false);
                          setStep("config");
                        }}
                      >
                        Save stack ({selectedAgents.length} agents)
                      </Button>
                    )}
                  </motion.div>
                ) : null}

                {step === "config" ? (
                  <motion.div
                    key="config"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-5"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Settings2 className="size-4 text-violet-300" />
                        Agent configuration
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        AI-prefilled for {selectedAgents.length} agent{selectedAgents.length !== 1 ? "s" : ""} — edit before deploy.
                      </p>
                    </div>

                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-200/90">
                      <Sparkles className="mr-1.5 inline size-3.5" />
                      Prefilled from your business profile · {context?.expectedUplift ?? uplift}
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Autonomous mode
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-1">
                        {(["manual", "guided", "autonomous"] as AutonomousMode[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={cn(
                              "rounded-lg border px-2 py-2 text-xs capitalize transition-all",
                              mode === m
                                ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
                                : "border-white/10 text-muted-foreground hover:border-white/20",
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {mode === "manual" && "You approve every campaign and asset change."}
                        {mode === "guided" && "AI proposes; you approve high-impact actions."}
                        {mode === "autonomous" && "Agents optimize within guardrails you set below."}
                      </p>
                    </div>

                    <div className="grid gap-4">
                      {(
                        [
                          ["budget", "Daily budget ($)", "50"],
                          ["platform", "Ad platforms", "meta_google"],
                          ["audience", "Target audience", "Homeowners · 25mi"],
                          ["offer", "Primary offer", "Free roof inspection"],
                          ["cta", "Call to action", "Book Your Inspection"],
                          ["brandVoice", "Brand voice", "Professional, local expert"],
                        ] as const
                      ).map(([key, label, placeholder]) => (
                        <div key={key} className="space-y-1.5">
                          <Label htmlFor={`deploy-${key}`} className="text-xs">
                            {label}
                          </Label>
                          <Input
                            id={`deploy-${key}`}
                            value={config[key]}
                            onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="rounded-xl border-white/10 bg-white/[0.03]"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}

                {step === "readiness" ? (
                  <motion.div
                    key="readiness"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-5"
                  >
                    <div>
                      <p className="text-sm font-medium">Deployment readiness</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {readinessOk}/{readinessTotal} systems verified · {mode} mode
                      </p>
                    </div>

                    {error ? (
                      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {error}
                      </p>
                    ) : null}

                    <ul className="space-y-2">
                      {readiness.map((item) => {
                        const skipped = skippedReadiness.has(item.id);
                        const passed = item.ok || skipped;
                        return (
                          <li
                            key={item.id}
                            className={cn(
                              "rounded-xl border px-3 py-2.5",
                              passed
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : "border-white/10 bg-white/[0.02]",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.detail}</p>
                              </div>
                              {passed ? (
                                <Check className="size-4 shrink-0 text-emerald-400" />
                              ) : null}
                            </div>
                            {!passed ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 rounded-lg border-white/10 text-[11px]"
                                  onClick={() => window.open(item.href, "_blank")}
                                >
                                  <Zap className="mr-1 size-3" />
                                  Auto fix
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 rounded-lg text-[11px]"
                                  onClick={() =>
                                    setSkippedReadiness((s) => new Set([...s, item.id]))
                                  }
                                >
                                  <SkipForward className="mr-1 size-3" />
                                  Skip
                                </Button>
                                <Link
                                  href={item.settingsHref ?? item.href}
                                  className={cn(
                                    buttonVariants({ variant: "ghost", size: "sm" }),
                                    "h-7 rounded-lg text-[11px]",
                                  )}
                                >
                                  <Settings2 className="mr-1 size-3" />
                                  Settings
                                </Link>
                              </div>
                            ) : skipped ? (
                              <p className="mt-1 text-[10px] text-amber-300/80">Skipped for this deploy</p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>

                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-white/10"
                        onClick={() => {
                          readiness
                            .filter((r) => !r.ok && !skippedReadiness.has(r.id))
                            .forEach((r) => window.open(r.href, "_blank"));
                        }}
                      >
                        <Zap className="mr-2 size-4" />
                        Auto fix all
                      </Button>
                      <Button
                        type="button"
                        variant="gradient"
                        className="mission-shimmer-btn rounded-xl"
                        onClick={runDeploySequence}
                        disabled={pending}
                      >
                        {readinessOk < readinessTotal ? "Deploy anyway" : "Begin deployment"}
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </div>
                  </motion.div>
                ) : null}

                {step === "deploy" ? (
                  <motion.div
                    key="deploy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="relative size-24">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-violet-500/20"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-2 rounded-full border border-violet-400/40"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="size-10 animate-spin text-violet-300" />
                      </span>
                    </div>
                    <p className="mt-8 text-lg font-semibold">
                      {DEPLOY_PHASES[Math.min(deployPhase, DEPLOY_PHASES.length - 1)]}
                    </p>
                    <ul className="mt-6 w-full max-w-xs space-y-2 text-left text-sm text-muted-foreground">
                      {DEPLOY_PHASES.map((label, i) => (
                        <li
                          key={label}
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            i <= deployPhase ? "text-violet-200" : "opacity-40",
                          )}
                        >
                          {i < deployPhase ? (
                            <Check className="size-3.5 text-emerald-400" />
                          ) : i === deployPhase ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <span className="size-3.5 rounded-full border border-white/20" />
                          )}
                          {label}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}

                {step === "monitor" ? (
                  <motion.div
                    key="monitor"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                      <p className="text-sm font-semibold text-emerald-100">Agents are live</p>
                      <p className="mt-1 text-xs text-emerald-200/80">
                        {selectedAgents.length} agents deployed · {mode} mode active
                      </p>
                    </div>

                    {monitoring ? (
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            ["traffic", "Traffic", monitoring.traffic],
                            ["leadVelocity", "Lead velocity", monitoring.leadVelocity],
                            ["agentHealth", "Agent health", monitoring.agentHealth],
                            ["optimizationScore", "Optimization score", monitoring.optimizationScore],
                          ] as const
                        ).map(([key, label, value]) => (
                          <div
                            key={key}
                            className="mission-elevate rounded-xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {label}
                            </p>
                            <p className="mt-1 text-sm font-semibold">{value}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <AgentOrchestrationTimeline events={timeline} />

                    <Link
                      href="/dashboard"
                      className={cn(buttonVariants({ variant: "gradient" }), "mission-shimmer-btn w-full rounded-xl")}
                      onClick={resetAndClose}
                    >
                      Open Mission Control
                    </Link>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {step !== "deploy" && step !== "monitor" ? (
              <footer className="shrink-0 border-t border-white/10 p-5">
                <div className="flex gap-2">
                  {step !== "goal" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-white/10"
                      onClick={() => {
                        const prev: Record<StepId, StepId> = {
                          goal: "goal",
                          stack: "goal",
                          config: "stack",
                          readiness: "config",
                          deploy: "readiness",
                          monitor: "monitor",
                        };
                        setStep(prev[step]);
                      }}
                    >
                      <ArrowLeft className="mr-1 size-4" />
                      Back
                    </Button>
                  ) : null}
                  {step === "goal" ? (
                    <Button
                      type="button"
                      variant="gradient"
                      className="mission-shimmer-btn ml-auto flex-1 rounded-xl"
                      onClick={() => setStep("stack")}
                    >
                      Continue
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  ) : null}
                  {step === "config" ? (
                    <Button
                      type="button"
                      variant="gradient"
                      className="mission-shimmer-btn ml-auto flex-1 rounded-xl"
                      onClick={() => setStep("readiness")}
                    >
                      Check readiness
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  ) : null}
                </div>
              </footer>
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
