"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  GitBranch,
  MessageSquare,
  Mails,
  Phone,
  Target,
  Webhook,
  Workflow,
} from "lucide-react";

import { AutomationsManager } from "@/components/automations/automations-manager";
import { PipelinesHubClient } from "@/components/automations/pipelines-hub-client";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";
import type { AutomationRuleRow } from "@/repositories/automation.repository";
import type { PipelineRow } from "@/types/diazites-platform";

type AutomationRunRow = {
  id: string;
  rule_id: string;
  event_type: string;
  status: "success" | "error" | "skipped";
  detail: string | null;
  http_status: number | null;
  created_at: string;
};

type Tab = "pipelines" | "rules" | "tools";

type Props = {
  pipelines: PipelineRow[];
  stageCounts: Record<string, number>;
  rules: AutomationRuleRow[];
  recentRuns: AutomationRunRow[];
  triggers: ReadonlyArray<string>;
};

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "pipelines", label: "Pipelines", icon: Target },
  { id: "rules", label: "Event rules", icon: Webhook },
  { id: "tools", label: "Automation tools", icon: GitBranch },
];

const TOOL_LINKS = [
  {
    href: ROUTES.workflows,
    label: "Workflows",
    description: "Visual builder — triggers, waits, SMS, email, AI agents",
    icon: Workflow,
  },
  {
    href: ROUTES.aiTextCommandCenter,
    label: "AI Text / SMS",
    description: "Campaigns & sequences tied to pipeline stages",
    icon: MessageSquare,
  },
  {
    href: ROUTES.emailCampaignCenter,
    label: "Email campaigns",
    description: "Audiences by stage, tag, or list",
    icon: Mails,
  },
  {
    href: ROUTES.aiCallCommandCenter,
    label: "AI Call Command Center",
    description: "Calling agents linked to pipelines & workflows",
    icon: Phone,
  },
];

export function AutomationHubClient({
  pipelines,
  stageCounts,
  rules,
  recentRuns,
  triggers,
}: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab =
    tabParam === "rules" || tabParam === "tools" || tabParam === "pipelines" ? tabParam : "pipelines";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const href =
            t.id === "pipelines"
              ? ROUTES.automationPipelines
              : `${ROUTES.automationCenter}?tab=${t.id}`;
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "pipelines" ? (
        <PipelinesHubClient pipelines={pipelines} stageCounts={stageCounts} />
      ) : null}

      {tab === "rules" ? (
        <AutomationsManager rules={rules} recentRuns={recentRuns} triggers={triggers} />
      ) : null}

      {tab === "tools" ? (
        <section className="grid gap-4 sm:grid-cols-2">
          {TOOL_LINKS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-xl border border-white/[0.06] bg-card/40 p-4 transition hover:border-violet-500/30 hover:bg-violet-500/5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-violet-500/10 p-2">
                    <Icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium">{tool.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
