"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bot,
  Building2,
  Inbox,
  MousePointerClick,
  Users,
} from "lucide-react";

import { AiCoachCard } from "@/components/ceo-command-center/ai-coach-card";
import { AiEmployees } from "@/components/ceo-command-center/ai-employees";
import { ConnectedAccounts } from "@/components/ceo-command-center/connected-accounts";
import { FloatingChatButton } from "@/components/ceo-command-center/floating-chat-button";
import { Header } from "@/components/ceo-command-center/header";
import { HealthScoreCard } from "@/components/ceo-command-center/health-score-card";
import { KpiCardRow } from "@/components/ceo-command-center/kpi-card";
import { LeadsBySource } from "@/components/ceo-command-center/leads-by-source";
import { PipelineOverview } from "@/components/ceo-command-center/pipeline-overview";
import { RecentActivity } from "@/components/ceo-command-center/recent-activity";
import { RevenueGoalCard } from "@/components/ceo-command-center/revenue-goal-card";
import { Tasks } from "@/components/ceo-command-center/tasks";
import {
  DEFAULT_HOMEPAGE_TOOL_IDS,
  HOMEPAGE_TOOL_OPTIONS,
  HOMEPAGE_TOOL_STORAGE_KEY,
  isHomepageToolId,
  type HomepageToolId,
} from "@/lib/ceo-command-center/homepage-tools";
import type {
  CeoCommandCenterData,
} from "@/types/ceo-command-center";

type CeoCommandCenterDashboardProps = {
  data: CeoCommandCenterData;
};

const HOME_TOOL_ICONS: Record<HomepageToolId, typeof Users> = {
  leads: Users,
  analytics: BarChart3,
  ai_agents: Bot,
  business_profile: Building2,
  conversations: Inbox,
  landing_page: MousePointerClick,
};

function readHomepageToolIds(): HomepageToolId[] {
  if (typeof window === "undefined") return DEFAULT_HOMEPAGE_TOOL_IDS;

  try {
    const raw = window.localStorage.getItem(HOMEPAGE_TOOL_STORAGE_KEY);
    if (!raw) return DEFAULT_HOMEPAGE_TOOL_IDS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_HOMEPAGE_TOOL_IDS;
    const ids = parsed.filter((item): item is HomepageToolId => {
      return typeof item === "string" && isHomepageToolId(item);
    });
    return ids.length > 0 ? ids : DEFAULT_HOMEPAGE_TOOL_IDS;
  } catch {
    return DEFAULT_HOMEPAGE_TOOL_IDS;
  }
}

export function CeoCommandCenterDashboard({ data }: CeoCommandCenterDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visibleToolIds, setVisibleToolIds] = useState<HomepageToolId[]>(DEFAULT_HOMEPAGE_TOOL_IDS);
  const leadTotal = data.leadSources.reduce((sum, s) => sum + s.count, 0);
  const visibleTools = useMemo(
    () => HOMEPAGE_TOOL_OPTIONS.filter((tool) => visibleToolIds.includes(tool.id)),
    [visibleToolIds],
  );

  useEffect(() => {
    const syncToolIds = () => setVisibleToolIds(readHomepageToolIds());
    const timeoutId = window.setTimeout(syncToolIds, 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === HOMEPAGE_TOOL_STORAGE_KEY) {
        syncToolIds();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("section") !== "home") return;

    window.setTimeout(() => {
      document.getElementById("home-shortcuts")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }, [searchParams]);

  return (
    <>
      <Header
        userName={data.user.name}
        userInitials={data.user.avatarInitials}
        onLaunch={() => router.push("/onboarding?step=launch")}
      />

      <div className="flex-1 space-y-6 overflow-y-auto px-0 py-6 sm:px-2 lg:px-4">
        <section
          id="home-shortcuts"
          className="scroll-mt-6 rounded-2xl border border-white/[0.08] bg-[#0c1222]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                Home shortcuts
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                What do you want to work on?
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Pick a button below. Each one opens the exact business window you need.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/settings?tab=homepage")}
              className="w-fit rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08]"
            >
              Choose buttons in Settings
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTools.map((tool) => {
              const Icon = HOME_TOOL_ICONS[tool.id];

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => router.push(tool.href)}
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition hover:border-violet-400/40 hover:bg-violet-500/10"
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-violet-500/15 p-2 text-violet-200 transition group-hover:bg-violet-500/25">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-white">{tool.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400">
                        {tool.description}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

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
