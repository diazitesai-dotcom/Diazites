"use client";

import { useRouter } from "next/navigation";

import { AiCoachCard } from "@/components/ceo-command-center/ai-coach-card";
import { AiEmployees } from "@/components/ceo-command-center/ai-employees";
import { ConnectedAccounts } from "@/components/ceo-command-center/connected-accounts";
import { FloatingChatButton } from "@/components/ceo-command-center/floating-chat-button";
import { Header } from "@/components/ceo-command-center/header";
import { HealthScoreCard } from "@/components/ceo-command-center/health-score-card";
import { KpiCardRow } from "@/components/ceo-command-center/kpi-card";
import { LeadsBySource } from "@/components/ceo-command-center/leads-by-source";
import { PipelineOverview } from "@/components/ceo-command-center/pipeline-overview";
import { ProgressTracker } from "@/components/ceo-command-center/progress-tracker";
import { RecentActivity } from "@/components/ceo-command-center/recent-activity";
import { RevenueGoalCard } from "@/components/ceo-command-center/revenue-goal-card";
import { Tasks } from "@/components/ceo-command-center/tasks";
import type {
  CeoCommandCenterData,
  OnboardingStepId,
  ProgressStep,
} from "@/types/ceo-command-center";

type CeoCommandCenterDashboardProps = {
  data: CeoCommandCenterData;
};

const ONBOARDING_STEP_BY_NUMBER: Record<number, OnboardingStepId> = {
  1: "business_profile",
  2: "offer_goals",
  3: "landing_pages",
  4: "pipeline_workflow",
  5: "connect_accounts",
  6: "ai_agents",
  7: "ads_agent",
  8: "tracking",
  9: "review",
  10: "launch",
};

export function CeoCommandCenterDashboard({ data }: CeoCommandCenterDashboardProps) {
  const router = useRouter();
  const leadTotal = data.leadSources.reduce((sum, s) => sum + s.count, 0);
  const openOnboardingStep = (step: ProgressStep) => {
    const stepId = ONBOARDING_STEP_BY_NUMBER[step.id];
    if (stepId) router.push(`/onboarding?step=${stepId}`);
  };

  return (
    <>
      <Header
        userName={data.user.name}
        userInitials={data.user.avatarInitials}
        onLaunch={() => router.push("/onboarding?step=launch")}
      />

      <div className="flex-1 space-y-6 overflow-y-auto px-0 py-6 sm:px-2 lg:px-4">
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
        <ProgressTracker steps={data.progressSteps} onStepClick={openOnboardingStep} />
        <KpiCardRow kpis={data.kpis} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <HealthScoreCard data={data.healthScore} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PipelineOverview stages={data.pipeline} />
              <LeadsBySource sources={data.leadSources} total={leadTotal} />
            </div>
            <AiEmployees employees={data.aiEmployees} />
          </div>

          <div className="space-y-6 xl:col-span-5">
            <RevenueGoalCard data={data.revenueGoal} />
            <AiCoachCard data={data.aiCoach} />
            <ConnectedAccounts accounts={data.connectedAccounts} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentActivity items={data.recentActivity} />
          <Tasks items={data.tasks} />
        </div>
      </div>

      <FloatingChatButton />
    </>
  );
}
