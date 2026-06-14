import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  ClipboardCheck,
  Crosshair,
  FileText,
  Flag,
  Globe,
  PencilLine,
  PlugZap,
  ShieldCheck,
  Target,
} from "lucide-react";

import {
  loadLaunchReviewData,
  type LaunchReviewAccent,
  type LaunchReviewSection,
  type LaunchReviewStatus,
} from "@/lib/ceo-command-center/launch-review-data";
import {
  activateFullOnboardingSetupAction,
  pauseFullOnboardingSetupAction,
} from "@/services/onboarding/actions";
import { cn } from "@/lib/utils";

const statusStyles: Record<LaunchReviewStatus, string> = {
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  paused: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  draft: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  needs_review: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  not_connected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

const statusLabels: Record<LaunchReviewStatus, string> = {
  active: "Active",
  paused: "Paused",
  draft: "Draft",
  needs_review: "Needs Review",
  not_connected: "Not Connected",
};

const accentStyles: Record<
  LaunchReviewAccent,
  {
    card: string;
    icon: string;
    glow: string;
    button: string;
  }
> = {
  blue: {
    card: "border-blue-400/20 bg-blue-400/[0.06]",
    icon: "bg-blue-400/15 text-blue-200",
    glow: "bg-blue-400/20",
    button: "border-blue-300/20 text-blue-100 hover:bg-blue-400/10",
  },
  green: {
    card: "border-green-400/20 bg-green-400/[0.06]",
    icon: "bg-green-400/15 text-green-200",
    glow: "bg-green-400/20",
    button: "border-green-300/20 text-green-100 hover:bg-green-400/10",
  },
  purple: {
    card: "border-purple-400/20 bg-purple-400/[0.06]",
    icon: "bg-purple-400/15 text-purple-200",
    glow: "bg-purple-400/20",
    button: "border-purple-300/20 text-purple-100 hover:bg-purple-400/10",
  },
  amber: {
    card: "border-amber-400/20 bg-amber-400/[0.06]",
    icon: "bg-amber-400/15 text-amber-200",
    glow: "bg-amber-400/20",
    button: "border-amber-300/20 text-amber-100 hover:bg-amber-400/10",
  },
  cyan: {
    card: "border-cyan-400/20 bg-cyan-400/[0.06]",
    icon: "bg-cyan-400/15 text-cyan-200",
    glow: "bg-cyan-400/20",
    button: "border-cyan-300/20 text-cyan-100 hover:bg-cyan-400/10",
  },
  violet: {
    card: "border-violet-400/20 bg-violet-400/[0.06]",
    icon: "bg-violet-400/15 text-violet-200",
    glow: "bg-violet-400/20",
    button: "border-violet-300/20 text-violet-100 hover:bg-violet-400/10",
  },
  pink: {
    card: "border-pink-400/20 bg-pink-400/[0.06]",
    icon: "bg-pink-400/15 text-pink-200",
    glow: "bg-pink-400/20",
    button: "border-pink-300/20 text-pink-100 hover:bg-pink-400/10",
  },
  orange: {
    card: "border-orange-400/20 bg-orange-400/[0.06]",
    icon: "bg-orange-400/15 text-orange-200",
    glow: "bg-orange-400/20",
    button: "border-orange-300/20 text-orange-100 hover:bg-orange-400/10",
  },
  slate: {
    card: "border-slate-400/20 bg-slate-400/[0.06]",
    icon: "bg-slate-400/15 text-slate-200",
    glow: "bg-slate-400/20",
    button: "border-slate-300/20 text-slate-100 hover:bg-slate-400/10",
  },
  emerald: {
    card: "border-emerald-400/20 bg-emerald-400/[0.06]",
    icon: "bg-emerald-400/15 text-emerald-200",
    glow: "bg-emerald-400/20",
    button: "border-emerald-300/20 text-emerald-100 hover:bg-emerald-400/10",
  },
  red: {
    card: "border-red-400/20 bg-red-400/[0.06]",
    icon: "bg-red-400/15 text-red-200",
    glow: "bg-red-400/20",
    button: "border-red-300/20 text-red-100 hover:bg-red-400/10",
  },
};

const sectionIcons: Record<string, typeof BriefcaseBusiness> = {
  "business-profile": BriefcaseBusiness,
  "offer-goal": Target,
  "landing-page": Globe,
  "pipeline-workflow": Flag,
  "connected-accounts": PlugZap,
  "ai-agents": Bot,
  "ads-campaign": Crosshair,
  tracking: BarChart3,
  review: ClipboardCheck,
  "launch-status": ShieldCheck,
};

async function pauseFullSetupFormAction() {
  "use server";
  await pauseFullOnboardingSetupAction();
}

async function activateFullSetupFormAction() {
  "use server";
  await activateFullOnboardingSetupAction();
}

function StatusBadge({ status }: { status: LaunchReviewStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function ReviewSectionListItem({ section }: { section: LaunchReviewSection }) {
  const Icon = sectionIcons[section.id] ?? FileText;
  const accent = accentStyles[section.accent];
  const canControl =
    section.control.state === "can_pause" || section.control.state === "can_activate";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:border-white/15 sm:p-5",
        accent.card,
      )}
    >
      <div className={cn("absolute right-0 top-0 h-20 w-20 rounded-full blur-3xl", accent.glow)} />
      <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 gap-4">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xs font-bold text-slate-200">
              {section.stepNumber}
            </span>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", accent.icon)}>
            <Icon className="h-6 w-6" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-start">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <StatusBadge status={section.status} />
            </div>
            <p className="mt-1 text-sm font-medium text-slate-200">{section.created}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p>
            <p className="mt-3 rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2 text-xs leading-5 text-slate-400">
              {section.control.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:w-52 lg:flex-col">
          <Link
            href={section.editHref}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border bg-white/[0.04] px-3 py-2.5 text-xs font-semibold transition",
              accent.button,
            )}
          >
            <PencilLine className="h-3.5 w-3.5" />
            Edit Step
          </Link>
          <button
            type="button"
            disabled={!canControl}
            className={cn(
              "inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold transition",
              canControl
                ? "bg-white/[0.08] text-white hover:bg-white/[0.12]"
                : "cursor-not-allowed bg-white/[0.03] text-slate-500",
            )}
          >
            {section.control.label}
          </button>
        </div>
      </div>
    </article>
  );
}

export default async function LaunchReviewPage() {
  const data = await loadLaunchReviewData();
  if (!data) redirect("/onboarding");

  const paused = data.launchStatus === "paused";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            Post-launch workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Launch Review</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Review every onboarding step your AI business system created, then edit, pause, or
            activate the setup when you&apos;re ready.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="w-fit rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
        >
          Back to dashboard
        </Link>
      </div>

      <section
        className={cn(
          "rounded-3xl border p-5 shadow-[0_12px_44px_rgba(0,0,0,0.25)] sm:p-6",
          paused
            ? "border-amber-400/20 bg-amber-400/10"
            : "border-emerald-400/20 bg-emerald-400/10",
        )}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                paused ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/15 text-emerald-200",
              )}
            >
              {paused ? <CirclePause className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {paused
                  ? "Your AI business system is paused"
                  : "Your AI business system is active"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {paused
                  ? "Your setup is saved, but agents, campaigns, automations, and connected tool activity are currently stopped."
                  : "Agents, campaigns, follow-ups, tracking, and connected tools are currently running."}
              </p>
            </div>
          </div>

          <form action={paused ? activateFullSetupFormAction : pauseFullSetupFormAction}>
            <button
              type="submit"
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition sm:w-auto",
                paused
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                  : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500",
              )}
            >
              {paused ? <CirclePlay className="h-4 w-4" /> : <CirclePause className="h-4 w-4" />}
              {paused ? "Activate Full Setup" : "Pause Full Setup"}
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-[#0c1222]/60 p-3 shadow-[0_12px_44px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-4">
        <div className="mb-3 flex flex-col gap-1 px-1 sm:px-2">
          <h2 className="text-lg font-semibold text-white">Onboarding Launch Checklist</h2>
          <p className="text-sm leading-6 text-slate-400">
            Follow this list from top to bottom to review what was built for the account.
          </p>
        </div>
        <div className="space-y-3">
        {data.sections.map((section) => (
          <ReviewSectionListItem key={section.id} section={section} />
        ))}
        </div>
      </section>

      <section className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-200" />
          <div>
            <h2 className="text-sm font-semibold text-violet-100">What pausing means</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/75">
              Pausing never deletes your onboarding profile, landing page, workflows, agents,
              campaigns, or connected accounts. It stops activity and stores what was active so
              you can activate the same setup again later.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
