"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, CheckCircle2, Globe2, Loader2, Mail, Rocket, Sparkles, UserRound } from "lucide-react";

import { startAiLaunchSetupAction } from "@/services/onboarding/actions";
import type {
  AiLaunchSetupProgressStep,
  AiLaunchSetupStepStatus,
} from "@/types/ceo-command-center";

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
};

export function AiLaunchSetup({ defaultEmail }: AiLaunchSetupProps) {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AiLaunchSetupProgressStep[]>(SETUP_STEPS);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();

  const completedCount = useMemo(
    () => steps.filter((step) => step.status === "complete").length,
    [steps],
  );

  useEffect(() => {
    if (!isPending) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = Math.min(current + 1, SETUP_STEPS.length - 1);
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
  }, [isPending]);

  const startSetup = () => {
    setError(null);
    setActiveIndex(0);
    setSteps((current) =>
      current.map((step, index) => ({
        ...step,
        status: index === 0 ? "running" : "pending",
        message: undefined,
      })),
    );

    startTransition(async () => {
      const result = await startAiLaunchSetupAction({
        websiteUrl,
        email,
        businessName,
      });

      if (!result.success) {
        setError(result.error);
        if ("progress" in result && result.progress) {
          setSteps(result.progress);
        } else {
          setSteps((current) =>
            current.map((step, index) =>
              index === activeIndex ? { ...step, status: "failed" } : step,
            ),
          );
        }
        return;
      }

      setSteps(result.progress);
      router.push(result.redirectTo);
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

          <button
            type="button"
            onClick={startSetup}
            disabled={isPending}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_22px_70px_rgba(79,70,229,0.42)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
            {isPending ? "AI setup running" : "Start AI Setup"}
          </button>
        </section>

        <aside className="rounded-[2rem] border border-violet-500/20 bg-[#090e1d]/90 p-6 shadow-2xl backdrop-blur-xl">
          <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
            <div className="absolute inset-3 rounded-full border border-violet-400/30" />
            <div className="absolute inset-6 animate-spin rounded-full border-2 border-transparent border-t-cyan-300 border-r-violet-400" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-violet-600/30 shadow-[0_0_80px_rgba(124,58,237,0.65)]">
              <Sparkles className="h-9 w-9 text-violet-100" />
            </div>
          </div>

          <div className="mb-5 flex items-center justify-between text-sm">
            <span className="text-slate-400">Setup progress</span>
            <span className="font-semibold text-violet-200">
              {completedCount}/{steps.length}
            </span>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <ProgressRow key={step.id} step={step} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProgressRow({ step }: { step: AiLaunchSetupProgressStep }) {
  const icon = statusIcon(step.status);
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">{step.label}</p>
          <p className="mt-0.5 text-xs capitalize text-slate-500">{step.message || step.status.replace("_", " ")}</p>
        </div>
      </div>
    </div>
  );
}

function statusIcon(status: AiLaunchSetupStepStatus) {
  if (status === "complete") return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />;
  if (status === "running") return <Loader2 className="h-5 w-5 shrink-0 animate-spin text-cyan-300" />;
  if (status === "failed") return <span className="h-3 w-3 shrink-0 rounded-full bg-rose-400" />;
  if (status === "needs_review") return <span className="h-3 w-3 shrink-0 rounded-full bg-amber-300" />;
  return <span className="h-3 w-3 shrink-0 rounded-full bg-slate-700" />;
}
