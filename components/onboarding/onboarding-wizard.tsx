"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Bot,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plug,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUSINESS_TYPE_OPTIONS,
  ONBOARDING_AI_AGENTS,
  ONBOARDING_CONNECTIONS,
} from "@/lib/marketing/platform-data";
import {
  emptyOnboardingDraft,
  type OnboardingAccountIntent,
  type OnboardingDraft,
} from "@/lib/onboarding/draft";
import {
  completeOnboardingFromDraftAction,
  saveOnboardingDraftAction,
} from "@/services/onboarding/actions";
import { OnboardingAiAutofill } from "@/components/onboarding/onboarding-ai-autofill";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "business",
    title: "Business Profile",
    description: "Tell us about your business",
    icon: Building2,
    globalStep: 2,
  },
  {
    id: "workspace",
    title: "Workspace Type",
    description: "How you'll use Diazites",
    icon: Users,
    globalStep: 3,
  },
  {
    id: "agents",
    title: "Activate AI Stack",
    description: "Choose agents to deploy",
    icon: Bot,
    globalStep: 4,
  },
  {
    id: "connect",
    title: "Connect Accounts",
    description: "Optional — connect later",
    icon: Plug,
    globalStep: 5,
  },
  {
    id: "generate",
    title: "Generate Workspace",
    description: "Build your command center",
    icon: Sparkles,
    globalStep: 6,
  },
] as const;

const WORKSPACE_TYPES: Array<{
  value: OnboardingAccountIntent;
  label: string;
  description: string;
}> = [
  {
    value: "direct",
    label: "Business Account",
    description: "For owners running one business with a single growth workspace.",
  },
  {
    value: "agency",
    label: "Agency Account",
    description: "For agencies managing multiple clients, subaccounts, and white-label workspaces.",
  },
  {
    value: "sub_account",
    label: "Subaccount",
    description: "For clients, departments, or locations under an agency — invite required.",
  },
];

const GENERATE_PHASES = [
  "Provisioning workspace…",
  "Deploying CRM pipeline…",
  "Configuring AI agents…",
  "Setting entitlements…",
  "Building your AI business command center…",
];

export function OnboardingWizard({ initialDraft }: { initialDraft?: OnboardingDraft }) {
  const [draft, setDraft] = useState<OnboardingDraft>(
    initialDraft ?? emptyOnboardingDraft(),
  );
  const [step, setStep] = useState(initialDraft?.wizardStep ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generatePhase, setGeneratePhase] = useState(0);
  const [generating, setGenerating] = useState(false);

  const isSubAccount = draft.accountIntent === "sub_account";

  function patch(partial: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  async function persistDraft(nextStep: number) {
    const payload = { ...draft, wizardStep: nextStep };
    const result = await saveOnboardingDraftAction(payload);
    if (!result.success) {
      setError(result.error ?? "Could not save progress");
      return false;
    }
    setError(null);
    setDraft(payload);
    return true;
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!draft.businessName.trim()) return "Business name is required.";
      if (!draft.industry.trim()) return "Industry is required.";
      if (!draft.businessType.trim()) return "Business type is required.";
    }
    if (step === 2 && draft.selectedAgents.length === 0) {
      return "Select at least one AI agent to activate.";
    }
    return null;
  }

  function handleContinue() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (isSubAccount && step === 1) {
      setError(
        "Sub-accounts are created by your agency. Use their invite link or contact support.",
      );
      return;
    }
    startTransition(async () => {
      const nextStep = Math.min(STEPS.length - 1, step + 1);
      const saved = await persistDraft(nextStep);
      if (saved) setStep(nextStep);
    });
  }

  function handleBack() {
    const prev = Math.max(0, step - 1);
    setStep(prev);
    void persistDraft(prev);
  }

  function handleGenerate() {
    setError(null);
    setGenerating(true);
    setGeneratePhase(0);

    const phaseTimer = window.setInterval(() => {
      setGeneratePhase((p) => Math.min(p + 1, GENERATE_PHASES.length - 1));
    }, 900);

    startTransition(async () => {
      try {
        await new Promise((r) => setTimeout(r, 3200));
        const result = await completeOnboardingFromDraftAction({
          ...draft,
          wizardStep: step,
          leadNotifyEmail: draft.leadNotifyEmail || draft.email,
        });
        window.clearInterval(phaseTimer);
        if (!result.success) {
          setGenerating(false);
          setError(result.error ?? "Could not complete setup.");
          return;
        }
        window.location.assign(result.redirectTo);
      } catch (err) {
        window.clearInterval(phaseTimer);
        setGenerating(false);
        setError(err instanceof Error ? err.message : "Setup failed.");
      }
    });
  }

  function toggleAgent(key: string) {
    const selected = draft.selectedAgents.includes(key)
      ? draft.selectedAgents.filter((k) => k !== key)
      : [...draft.selectedAgents, key];
    patch({ selectedAgents: selected });
  }

  function toggleConnectionSkip(key: string) {
    const skipped = draft.skippedConnections.includes(key)
      ? draft.skippedConnections.filter((k) => k !== key)
      : [...draft.skippedConnections, key];
    patch({ skippedConnections: skipped });
  }

  function handleAutofillApply(next: OnboardingDraft, _meta: { usedAi: boolean }) {
    setDraft(next);
    setError(null);
    void saveOnboardingDraftAction(next);
  }

  const StepIcon = STEPS[step]?.icon ?? Building2;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
            Step {STEPS[step]?.globalStep ?? step + 2} of 6
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            {STEPS[step]?.title}
          </h2>
          <p className="text-sm text-muted-foreground">{STEPS[step]?.description}</p>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 w-8 rounded-full transition-colors",
                i <= step ? "bg-violet-500" : "bg-white/10",
              )}
            />
          ))}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          {error}
        </p>
      ) : null}

      <Card className="border-white/[0.08] bg-card/40 backdrop-blur-sm">
        <CardHeader className="border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
              <StepIcon className="size-5 text-violet-400" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg">{STEPS[step]?.title}</CardTitle>
              <CardDescription>{STEPS[step]?.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 0 ? (
            <div className="space-y-5">
              <OnboardingAiAutofill draft={draft} onApply={handleAutofillApply} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business name" required>
                  <Input
                    value={draft.businessName}
                    onChange={(e) => patch({ businessName: e.target.value })}
                    placeholder="Acme Growth Co."
                  />
                </Field>
                <Field label="Website">
                  <Input
                    value={draft.website}
                    onChange={(e) => patch({ website: e.target.value })}
                    placeholder="https://"
                  />
                </Field>
                <Field label="Industry" required>
                  <Input
                    value={draft.industry}
                    onChange={(e) => patch({ industry: e.target.value })}
                    placeholder="Marketing, SaaS, Home services…"
                  />
                </Field>
                <Field label="Business type" required>
                  <select
                    value={draft.businessType}
                    onChange={(e) => patch({ businessType: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select type</option>
                    {BUSINESS_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-1">
              {WORKSPACE_TYPES.map((type) => {
                const selected = draft.accountIntent === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => patch({ accountIntent: type.value })}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-violet-500/25",
                    )}
                  >
                    <p className="font-medium">{type.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {ONBOARDING_AI_AGENTS.map((agent) => {
                const active = draft.selectedAgents.includes(agent.key);
                return (
                  <button
                    key={agent.key}
                    type="button"
                    onClick={() => toggleAgent(agent.key)}
                    className={cn(
                      "flex flex-col rounded-xl border p-4 text-left transition",
                      active
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-violet-500/25",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{agent.label}</p>
                      {active ? <Check className="size-4 text-violet-400" /> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{agent.description}</p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect now or skip — you can link accounts anytime from Integrations.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ONBOARDING_CONNECTIONS.map((conn) => {
                  const skipped = draft.skippedConnections.includes(conn.key);
                  return (
                    <div
                      key={conn.key}
                      className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                    >
                      <p className="font-medium">{conn.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{conn.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/integrations?connect=${conn.key}`}
                          className="text-xs font-medium text-violet-400 hover:underline"
                        >
                          Connect in dashboard →
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleConnectionSkip(conn.key)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {skipped ? "Marked skip for now" : "Skip for now"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-6 text-center">
              {generating ? (
                <div className="py-8">
                  <Loader2 className="mx-auto size-10 animate-spin text-violet-400" />
                  <p className="mt-4 text-lg font-medium">
                    {GENERATE_PHASES[generatePhase]}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Building your AI business command center…
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    We&apos;ll provision your workspace, CRM pipeline, selected AI agents, and
                    Mission Control dashboard.
                  </p>
                  <ul className="mx-auto max-w-md space-y-2 text-left text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-400" />
                      {draft.businessName || "Your business"} workspace
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-400" />
                      {draft.selectedAgents.length} AI agent
                      {draft.selectedAgents.length === 1 ? "" : "s"} selected
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-400" />
                      {WORKSPACE_TYPES.find((w) => w.value === draft.accountIntent)?.label ??
                        "Business"}{" "}
                      account type
                    </li>
                  </ul>
                </>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={step === 0 || isPending || generating}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="gradient"
            onClick={handleContinue}
            disabled={isPending}
            className="gap-1 rounded-xl"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="gradient"
            onClick={handleGenerate}
            disabled={isPending || generating}
            className="gap-2 rounded-xl"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate workspace
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
