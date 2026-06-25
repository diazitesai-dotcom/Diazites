"use client";

import { useRouter } from "next/navigation";

import { ProgressTracker } from "@/components/ceo-command-center/progress-tracker";
import type { LaunchReviewSection } from "@/lib/ceo-command-center/launch-review-data";
import type { ProgressStep } from "@/types/ceo-command-center";

type LaunchReviewOnboardingWorkspaceProps = {
  sections: LaunchReviewSection[];
};

const statusToProgressStatus: Record<LaunchReviewSection["status"], ProgressStep["status"]> = {
  active: "completed",
  paused: "review",
  draft: "review",
  needs_review: "review",
  not_connected: "pending",
};

export function LaunchReviewOnboardingWorkspace({
  sections,
}: LaunchReviewOnboardingWorkspaceProps) {
  const router = useRouter();
  const steps = sections.map((section): ProgressStep => ({
    id: section.stepNumber,
    label: section.title,
    status: statusToProgressStatus[section.status],
  }));
  const hrefByStep = new Map(sections.map((section) => [section.stepNumber, section.editHref]));

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-100">Onboarding workspace</p>
            <p className="mt-1 text-xs leading-5 text-violet-100/75">
              Edit any setup step, review your funnel, or relaunch the AI system from here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/onboarding?step=business_profile")}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08]"
            >
              Edit Setup
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding?step=launch")}
              className="rounded-xl bg-violet-500/30 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/40"
            >
              Review Launch
            </button>
          </div>
        </div>
      </div>
      <ProgressTracker
        steps={steps}
        onStepClick={(step) => {
          const href = hrefByStep.get(step.id);
          if (href) router.push(href);
        }}
      />
    </section>
  );
}
