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
import type { CeoCommandCenterData } from "@/types/ceo-command-center";

type CeoCommandCenterDashboardProps = {
  data: CeoCommandCenterData;
};

export function CeoCommandCenterDashboard({ data }: CeoCommandCenterDashboardProps) {
  const router = useRouter();
  const leadTotal = data.leadSources.reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <Header
        userName={data.user.name}
        userInitials={data.user.avatarInitials}
        onLaunch={() => router.push("/onboarding?step=launch")}
      />

      <div className="flex-1 space-y-6 overflow-y-auto px-0 py-6 sm:px-2 lg:px-4">
        <ProgressTracker steps={data.progressSteps} />
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
