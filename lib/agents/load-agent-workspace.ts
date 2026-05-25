import { agentDisplayName } from "@/lib/agents/deployment-catalog";
import { getAgentWorkspaceProfile } from "@/lib/agents/agent-workspace-catalog";
import { bucketLabel, type LeadScoreBucket } from "@/lib/lead-scoring";
import { AGENT_PLAYBOOKS } from "@/services/agents/agent-playbooks";
import { getCampaignsByBusiness } from "@/services/campaigns/campaign.service";
import { getLeadsForBoard } from "@/services/leads/lead.service";
import type { AgentWorkspaceData, AgentWorkspaceLeadRow } from "@/types/agent-workspace";
import type { AgentType } from "@/types/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

function leadRationale(name: string, score: number, bucket: string): string {
  return `Score ${score} (${bucket}) — ${name}: contact completeness, pipeline stage, source quality, and recency weighted by the scoring engine.`;
}

type BoardLead = {
  id: string;
  name: string;
  score: number;
  scoreBucket: LeadScoreBucket;
  status: string;
  campaign: string;
  source?: string;
};

function mapLeadRows(leads: BoardLead[], mode: "qualified" | "rejected"): AgentWorkspaceLeadRow[] {
  const list = leads;
  const filtered =
    mode === "qualified"
      ? list.filter(
          (l) =>
            l.scoreBucket === "qualified" ||
            l.scoreBucket === "hot" ||
            l.status === "qualified" ||
            l.status === "booked" ||
            l.status === "won",
        )
      : list.filter(
          (l) =>
            l.status === "lost" ||
            (l.scoreBucket === "cold" && l.score < 45) ||
            (l.status === "new" && l.score < 35),
        );

  return filtered.slice(0, 12).map((l) => ({
    id: l.id,
    name: l.name,
    score: l.score,
    bucket: bucketLabel(l.scoreBucket),
    status: l.status,
    rationale: leadRationale(l.name, l.score, bucketLabel(l.scoreBucket)),
    source: l.campaign || l.source || "—",
  }));
}

export async function loadAgentWorkspace(
  supabase: SupabaseClient,
  userId: string,
  businessId: string,
  agentKey: AgentType,
  dbStatus: string,
  activatedAt: string | null,
): Promise<AgentWorkspaceData> {
  const profile = getAgentWorkspaceProfile(agentKey);
  const playbook = AGENT_PLAYBOOKS[agentKey];
  const isActive = dbStatus === "active";
  const agentName = agentDisplayName(agentKey);

  const leadsRes = await getLeadsForBoard(supabase, userId, businessId);
  const leads = leadsRes.success ? leadsRes.data : [];

  const campaignsRes = await getCampaignsByBusiness(supabase, userId, businessId);
  const rawCampaigns = campaignsRes.success ? campaignsRes.data : [];

  type CampaignRow = { id: string; name?: string; platform?: string; budget?: number; status?: string };
  const googleCampaigns = ((rawCampaigns ?? []) as CampaignRow[])
    .filter((c) => String(c.platform ?? "").toLowerCase().includes("google"))
    .slice(0, 6);

  const queue =
    agentKey === "lead_qualification"
      ? [
          {
            id: "q1",
            title: "Score inbound form submissions",
            priority: "high" as const,
            status: isActive ? ("running" as const) : ("queued" as const),
            eta: "2m",
          },
          {
            id: "q2",
            title: "Route hot leads to booking automations",
            priority: "high" as const,
            status: "queued" as const,
          },
          {
            id: "q3",
            title: "Re-score stale pipeline (7d+)",
            priority: "medium" as const,
            status: "queued" as const,
          },
        ]
      : [
          {
            id: "q1",
            title:
              agentKey === "search_ads"
                ? "Sync keyword bids from performance signal"
                : "Process engine launch webhook payload",
            priority: "high" as const,
            status: isActive ? ("running" as const) : ("queued" as const),
            eta: "4m",
          },
          {
            id: "q2",
            title: "Validate campaign ownership mapping",
            priority: "medium" as const,
            status: "queued" as const,
          },
        ];

  const logs: AgentWorkspaceData["logs"] = [
    {
      id: "l1",
      at: new Date().toISOString(),
      level: "info",
      message: isActive
        ? `${agentName} heartbeat OK — orchestration loop active`
        : `${agentName} inactive — workspace in preview mode`,
    },
    ...playbook.rules.map((r, i) => ({
      id: `rule-${i}`,
      at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
      level: "info" as const,
      message: `Rule provisioned: ${r.name}`,
    })),
  ];

  const reasoning: AgentWorkspaceData["reasoning"] = [
    {
      id: "r1",
      at: new Date().toISOString(),
      summary: isActive ? "Continue current strategy" : "Activation recommended",
      detail: isActive
        ? `${agentName} is executing playbook rules with no blocking errors. Queue depth is within SLA.`
        : `Deploy ${agentName} to enable autonomous execution, reasoning traces, and approval-gated changes.`,
      confidence: isActive ? 88 : 72,
    },
    {
      id: "r2",
      at: new Date(Date.now() - 7200000).toISOString(),
      summary:
        agentKey === "lead_qualification"
          ? "Prioritize hot bucket leads for same-day follow-up"
          : "Shift budget toward top ROAS campaigns",
      detail:
        agentKey === "lead_qualification"
          ? "Qualified and hot leads show higher booking conversion when contacted within 2 hours."
          : "Search intent campaigns with stable CPL should receive +15% budget until CPA guardrail triggers.",
      confidence: 81,
    },
  ];

  const scoringRules: AgentWorkspaceData["scoringRules"] = [
    {
      id: "sr1",
      label: "Contact completeness",
      weight: "Up to +36",
      description: "Email and phone present on the lead record.",
    },
    {
      id: "sr2",
      label: "Pipeline stage",
      weight: "−25 to +35",
      description: "Booked/won lifts score; lost penalizes.",
    },
    {
      id: "sr3",
      label: "Source quality",
      weight: "+4 to +16",
      description: "Landing page and form sources score higher than manual import.",
    },
    {
      id: "sr4",
      label: "Intent signals",
      weight: "Up to +20",
      description: "Timeline urgency, notes depth, and stated need.",
    },
    {
      id: "sr5",
      label: "Recency",
      weight: "Up to +7",
      description: "14-day decay — newer leads score higher.",
    },
  ];

  return {
    agentKey,
    agentName,
    workspaceTitle: profile.workspaceTitle,
    status: dbStatus,
    activatedAt,
    description: playbook.description,
    tabs: profile.tabs,
    queue,
    logs,
    reasoning,
    platforms:
      agentKey === "search_ads" || agentKey === "social_ads"
        ? [
            {
              id: "google",
              name: "Google Ads",
              status: agentKey === "search_ads" ? "connected" : "disconnected",
              detail: "Search campaigns & conversion tags",
            },
            {
              id: "meta",
              name: "Meta Ads",
              status: agentKey === "social_ads" ? "connected" : "disconnected",
              detail: "Social prospecting & retargeting",
            },
          ]
        : agentKey === "landing_page"
          ? [
              {
                id: "host",
                name: "Funnel Studio",
                status: "connected",
                detail: "Published landing variants",
              },
            ]
          : [],
    campaigns: googleCampaigns.map((c) => ({
      id: c.id,
      name: c.name ?? "Campaign",
      platform: String(c.platform ?? "google"),
      role: "owner" as const,
      spend: c.budget != null ? `$${c.budget}` : undefined,
      status: String(c.status ?? "active"),
    })),
    tasks: [
      {
        id: "t1",
        label: playbook.rules[0]?.name ?? "Configure automations",
        status: isActive ? "in_progress" : "scheduled",
        due: "Today",
      },
      {
        id: "t2",
        label: "Review approval queue",
        status: "scheduled",
        due: "This week",
      },
    ],
    memory: [
      {
        id: "m1",
        label: "Last optimization",
        value: isActive ? "Bid rules refreshed 2h ago" : "—",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "m2",
        label: "Brand guardrails",
        value: "No discount language · local service area only",
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
    performance: {
      score: isActive ? (agentKey === "lead_qualification" ? 86 : 78) : 0,
      executions: isActive ? 24 : 0,
      successRate: isActive ? 82 : 0,
      resultLabel:
        agentKey === "lead_qualification"
          ? `${leads.filter((l) => l.scoreBucket === "qualified" || l.scoreBucket === "hot").length} leads qualified`
          : `${googleCampaigns.length} campaigns monitored`,
    },
    permissions: [
      {
        id: "p1",
        label: "Read campaign performance",
        enabled: true,
        scope: "Campaign Ops",
      },
      {
        id: "p2",
        label: "Propose budget changes",
        enabled: isActive,
        scope: "Approval Center",
      },
      {
        id: "p3",
        label: "Write CRM lead status",
        enabled: agentKey === "lead_qualification" && isActive,
        scope: "Leads OS",
      },
      {
        id: "p4",
        label: "Autonomous deploy",
        enabled: false,
        scope: "Organization policy",
      },
    ],
    approvals: isActive
      ? [
          {
            id: "a1",
            title:
              agentKey === "search_ads"
                ? "Increase daily budget +12% on top ROAS ad group"
                : "Auto-route 4 hot leads to booking sequence",
            state: "pending",
            requestedAt: new Date().toISOString(),
          },
        ]
      : [],
    scoringRules,
    qualifiedLeads: mapLeadRows(leads, "qualified"),
    rejectedLeads: mapLeadRows(leads, "rejected"),
  };
}
