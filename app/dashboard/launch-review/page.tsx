import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CirclePause, CirclePlay, PencilLine, ShieldCheck } from "lucide-react";

import {
  loadLaunchReviewData,
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

function ReviewSectionCard({ section }: { section: LaunchReviewSection }) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">{section.title}</h2>
          <p className="mt-2 text-sm font-medium text-slate-200">{section.created}</p>
        </div>
        <StatusBadge status={section.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{section.description}</p>
      <Link
        href={section.editHref}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
      >
        <PencilLine className="h-3.5 w-3.5" />
        Edit setup step
      </Link>
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
            Review everything your AI business system created, then pause or activate the full
            setup when you&apos;re ready.
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

      <section className="grid gap-4 lg:grid-cols-2">
        {data.sections.map((section) => (
          <ReviewSectionCard key={section.id} section={section} />
        ))}
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
