"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Bot, CheckCircle2, Globe2, Loader2, Mail, Rocket, Sparkles, UserRound } from "lucide-react";

import { startAiLaunchSetupAction } from "@/services/onboarding/actions";
import type { AiLaunchSetupProgressStep } from "@/types/ceo-command-center";

const SETUP_STEPS: AiLaunchSetupProgressStep[] = [
  { id: "scan_website", label: "Scanning website", status: "pending" },
  { id: "business_profile", label: "Building business profile", status: "pending" },
  { id: "offer_goals", label: "Creating offer and goals", status: "pending" },
  { id: "website", label: "Generating landing page / website", status: "pending" },
  { id: "pipeline", label: "Setting up CRM pipeline", status: "pending" },
  { id: "workflows", label: "Creating workflows", status: "pending" },
  { id: "ai_agents", label: "Configuring AI agents", status: "pending" },
  { id: "launch_review", label: "Preparing launch review", status: "pending" },
];

type AiLaunchSetupProps = {
  defaultEmail: string;
  defaultWebsite?: string;
  defaultBusinessName?: string;
};

export function AiLaunchSetup({
  defaultEmail,
  defaultWebsite = "",
  defaultBusinessName = "",
}: AiLaunchSetupProps) {
  const [websiteUrl, setWebsiteUrl] = useState(defaultWebsite);
  const [email, setEmail] = useState(defaultEmail);
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AiLaunchSetupProgressStep[]>(SETUP_STEPS);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [launchReviewHref, setLaunchReviewHref] = useState<string | null>(null);
  const [setupRunning, setSetupRunning] = useState(false);
  const [isPending, startTransition] = useTransition();

  const completedCount = useMemo(
    () => steps.filter((step) => step.status === "complete").length,
    [steps],
  );
  const currentStep = useMemo(() => {
    return (
      steps.find((step) => step.status === "running") ??
      steps.find((step) => step.status === "needs_review" || step.status === "failed") ??
      steps[Math.max(0, Math.min(activeIndex, steps.length - 1))] ??
      steps[0]
    );
  }, [activeIndex, steps]);
  const progressPercent = useMemo(() => {
    const weighted = steps.reduce((total, step) => {
      if (step.status === "complete") return total + 1;
      if (step.status === "running") return total + 0.55;
      if (step.status === "needs_review") return total + 0.85;
      return total;
    }, 0);

    return Math.min(100, Math.max(setupRunning ? 8 : 0, Math.round((weighted / steps.length) * 100)));
  }, [setupRunning, steps]);
  const setupComplete = Boolean(launchReviewHref);

  useEffect(() => {
    if (!setupRunning || setupComplete) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = current < 0 ? 0 : Math.min(current + 1, SETUP_STEPS.length - 1);
        setSteps((currentSteps) =>
          currentSteps.map((step, index) => {
            if (index < next) return { ...step, status: "complete" };
            if (index === next) return { ...step, status: "running" };
            return { ...step, status: "pending" };
          }),
        );
        return next;
      });
    }, 1100);

    return () => window.clearInterval(timer);
  }, [setupComplete, setupRunning]);

  const startSetup = () => {
    if (setupRunning) return;

    const trimmedWebsite = websiteUrl.trim();
    const trimmedEmail = email.trim();
    if (!trimmedWebsite) {
      setError("Enter your website URL to start AI setup.");
      return;
    }
    if (!trimmedEmail) {
      setError("Enter your email address to start AI setup.");
      return;
    }

    setError(null);
    setLaunchReviewHref(null);
    setSetupRunning(true);
    setActiveIndex(0);
    setSteps((current) =>
      current.map((step, index) => ({
        ...step,
        status: index === 0 ? "running" : "pending",
        message: undefined,
      })),
    );

    startTransition(async () => {
      try {
        const result = await startAiLaunchSetupAction({
          websiteUrl: trimmedWebsite,
          email: trimmedEmail,
          businessName,
        });

        if (!result.success) {
          setError(result.error);
          setSetupRunning(false);
          if ("progress" in result && result.progress) {
            setSteps(result.progress);
          } else {
            setSteps((current) =>
              current.map((step, index) =>
                index === Math.max(activeIndex, 0) ? { ...step, status: "failed" } : step,
              ),
            );
          }
          return;
        }

        setSteps(result.progress);
        setActiveIndex(SETUP_STEPS.length - 1);
        setLaunchReviewHref(result.redirectTo);
        setSetupRunning(false);
      } catch (e) {
        setSetupRunning(false);
        setError(
          e instanceof Error
            ? e.message
            : "AI setup could not finish. Please try again or open onboarding manually.",
        );
        setSteps((current) =>
          current.map((step, index) =>
            index === Math.max(activeIndex, 0)
              ? { ...step, status: "failed", message: "This step could not complete." }
              : step,
          ),
        );
      }
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050812] px-4 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.34),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.2),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
      <div className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_420px]">
        <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/25 text-violet-200 shadow-[0_0_60px_rgba(124,58,237,0.55)]">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                Diazites AI Launch Setup
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">
                Your AI business system builds itself.
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
            Enter your website and email. Diazites scans your business, builds your profile,
            creates offer goals, generates a landing page, configures CRM pipeline defaults,
            prepares workflows, and sends you to Launch Review to edit everything.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <Globe2 className="h-4 w-4 text-violet-300" />
                Website URL
              </span>
              <input
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://yourbusiness.com"
                className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none ring-violet-500/30 transition focus:ring-4"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <Mail className="h-4 w-4 text-violet-300" />
                Email
              </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@business.com"
                type="email"
                className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none ring-violet-500/30 transition focus:ring-4"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <UserRound className="h-4 w-4 text-violet-300" />
                Business name optional
              </span>
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Business name"
                className="w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none ring-violet-500/30 transition focus:ring-4"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          {setupComplete ? (
            <div className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 shadow-[0_0_55px_rgba(34,211,238,0.18)]">
              <div className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-white">Check your email</h2>
                  <p className="mt-1 text-sm leading-6 text-cyan-50/75">
                    We prepared your AI setup and sent the full registration form to your email.
                    Finish it there or open Launch Review now to see what the agents built.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (launchReviewHref) window.location.assign(launchReviewHref);
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_18px_55px_rgba(34,211,238,0.25)] transition hover:scale-[1.01] md:w-auto"
              >
                <CheckCircle2 className="h-4 w-4" />
                Open Launch Review
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startSetup}
              disabled={setupRunning || isPending}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_22px_70px_rgba(79,70,229,0.42)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
            >
              {setupRunning || isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
              {setupRunning || isPending ? "AI setup running" : "Start AI Setup"}
            </button>
          )}
        </section>

        <aside className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#070d1d]/90 p-6 shadow-[0_30px_100px_rgba(34,211,238,0.14)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),transparent_36%),radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_38%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:28px_28px] opacity-30" />
          <div className="relative">
            <div className="relative mx-auto mb-8 flex h-44 w-44 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-300/15 bg-cyan-300/5 blur-sm" />
              <div className="absolute inset-2 animate-spin rounded-full border border-transparent border-t-cyan-300/80 border-r-violet-400/70" />
              <div className="absolute inset-7 animate-[spin_7s_linear_infinite_reverse] rounded-full border border-transparent border-b-fuchsia-300/70 border-l-cyan-200/60" />
              <div className="absolute h-32 w-32 animate-pulse rounded-full bg-violet-500/15 shadow-[0_0_90px_rgba(124,58,237,0.55)]" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-violet-600/70 to-cyan-500/50 shadow-[0_0_70px_rgba(34,211,238,0.45)]">
                <Sparkles className="h-9 w-9 text-white" />
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between text-sm">
              <span className="text-slate-400">Neural setup progress</span>
              <span className="font-semibold text-cyan-100">{progressPercent}%</span>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-black/25 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                Current operation
              </p>
              <h2 className="mt-2 min-h-14 text-2xl font-semibold leading-tight text-white">
                {setupComplete ? "AI setup prepared" : currentStep?.label}
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {setupComplete
                  ? "Launch Review is ready. Full registration email sent."
                  : "Diazites is syncing your profile, funnel, CRM, workflows, and agent defaults."}
              </p>

              <div className="mt-6">
                <div className="relative h-4 overflow-hidden rounded-full border border-cyan-300/20 bg-slate-950 shadow-inner">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] animate-pulse" />
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-300 to-fuchsia-400 shadow-[0_0_35px_rgba(34,211,238,0.7)] transition-all duration-700"
                    style={{ width: `${setupComplete ? 100 : progressPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  <span>Initialize</span>
                  <span>{completedCount}/{steps.length} systems</span>
                  <span>Launch</span>
                </div>
              </div>

            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
