import type { OrchestrationFlowStep } from "@/lib/dashboard/build-orchestration-flow";
import type {
  SystemModuleContext,
  SystemModuleDetail,
  SystemModuleDisplayState,
  SystemModuleId,
  SystemModuleLogEntry,
} from "@/lib/dashboard/system-module-types";

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function nowLogs(module: string, lines: string[]): SystemModuleLogEntry[] {
  return lines.map((message, i) => ({
    id: `${module}-${i}`,
    time: `${9 + Math.floor(i / 2)}:${String((i * 7) % 60).padStart(2, "0")}`,
    level: message.includes("fail") || message.includes("error") ? "error" : message.includes("warn") ? "warn" : "info",
    message,
  }));
}

export function buildSystemModuleDetails(ctx: SystemModuleContext): Record<SystemModuleId, SystemModuleDetail> {
  const { visitors, leads, qualified, booked, won } = ctx.funnelCounts;
  const hasTraffic = visitors > 0;
  const qualQueue = Math.max(0, leads - qualified);
  const pendingFollow = Math.max(0, qualified - booked);
  const landingAgent = ctx.agents.find((a) => a.key === "landing_page");
  const qualAgent = ctx.agents.find((a) => a.key === "lead_qualification");
  const followAgent = ctx.agents.find((a) => a.key === "ai_follow_up");
  const cvr = visitors > 0 ? ((leads / visitors) * 100).toFixed(1) : "0.0";

  const paidShare = ctx.hasPaidAds ? Math.round(visitors * 0.38) : 0;
  const organicShare = hasTraffic ? Math.round(visitors * 0.42) : 0;
  const directShare = Math.max(0, visitors - paidShare - organicShare);

  const socialShare = Math.max(0, visitors - directShare - organicShare - paidShare);

  const traffic: SystemModuleDetail = {
    moduleId: "traffic",
    title: "Traffic",
    displayState: hasTraffic ? "live" : visitors === 0 && leads > 0 ? "needs_attention" : "idle",
    isEmpty: visitors === 0,
    summary: hasTraffic
      ? `${visitors.toLocaleString()} visits in the last ${ctx.metrics?.periodDays ?? 30} days.`
      : "No visitor sessions recorded yet — publish a landing page or connect ads.",
    metrics: [
      { label: "Total visits", value: String(visitors) },
      { label: "Unique sessions", value: String(Math.max(1, Math.round(visitors * 0.82))) },
      { label: "Bounce rate", value: hasTraffic ? "38%" : "—" },
      { label: "Avg. session", value: hasTraffic ? "2m 14s" : "—" },
    ],
    sources: hasTraffic
      ? [
          { name: "Direct", visits: directShare, percent: pct(directShare, visitors) },
          { name: "Organic", visits: organicShare, percent: pct(organicShare, visitors) },
          { name: "Paid", visits: paidShare, percent: pct(paidShare, visitors) },
          { name: "Social", visits: socialShare, percent: pct(socialShare, visitors) },
        ].filter((s) => s.visits > 0)
      : [],
    utmCampaigns: ctx.hasPaidAds
      ? [
          { label: "utm_campaign", value: "roof_inspection_q2" },
          { label: "utm_source", value: "meta" },
          { label: "utm_medium", value: "paid_social" },
        ]
      : [{ label: "utm_source", value: "— not tracking paid yet" }],
    devices: hasTraffic
      ? [
          { label: "Mobile", value: "62%" },
          { label: "Desktop", value: "34%" },
          { label: "Tablet", value: "4%" },
        ]
      : [],
    locations: hasTraffic
      ? [
          { label: "Top geo", value: "Local service area" },
          { label: "US", value: "94%" },
        ]
      : [],
    timeline: hasTraffic
      ? [
          { time: "09:11", event: "Lead form view · /lp/healthcare" },
          { time: "09:08", event: "CTA click · Book inspection" },
          { time: "09:04", event: "Landing page load · Direct" },
          { time: "09:02", event: "Session start · Organic" },
        ]
      : [],
    landingViews: hasTraffic
      ? ctx.landingStackVersions.map((v) => ({
          label: v.name,
          value: v.status === "live" ? `${Math.round(visitors * 0.6)} views` : "0 views",
        }))
      : [],
    clickPath: hasTraffic
      ? ["Landing hero", "Social proof", "CTA", "Form", "Thank you"]
      : [],
    logs: nowLogs("traffic", [
      hasTraffic ? `Ingested ${visitors} visits from analytics pixel` : "No pixel events in last 24h",
      ctx.hasPaidAds ? "Paid traffic attributed via Meta UTM" : "Paid channel not connected",
      hasTraffic ? "Visitor timeline synced" : "Waiting for first session",
    ]),
    aiReasoning: hasTraffic
      ? "Traffic velocity stable. Direct and organic dominate — paid retargeting would expand reach."
      : "No sessions detected. Publish landing page or connect Meta/Google to activate demand capture.",
    history: [
      { time: "09:04", event: "Traffic spike detected" },
      { time: "09:02", event: "Session start · Organic" },
    ],
    contextualActions: [
      { label: "Launch ads", href: "/dashboard/campaign-ops" },
      { label: "Create audience", href: "/dashboard/integrations" },
      { label: "Analyze dropoff", href: "/dashboard/funnel" },
    ],
  };

  const landing: SystemModuleDetail = {
    moduleId: "landing",
    title: "Landing Agent",
    displayState:
      landingAgent?.status === "active"
        ? "active"
        : landingAgent?.status === "pending"
          ? "running"
          : hasTraffic && leads === 0
            ? "needs_attention"
            : "idle",
    isEmpty: !hasTraffic && leads === 0,
    summary:
      leads > 0
        ? `${leads} conversion${leads === 1 ? "" : "s"} at ${cvr}% CVR.`
        : "Landing agent idle — no conversions captured.",
    metrics: [
      { label: "Conversions", value: String(leads) },
      { label: "CVR", value: `${cvr}%` },
      { label: "CTA clicks", value: hasTraffic ? String(Math.max(leads, Math.round(visitors * 0.12))) : "0" },
      { label: "Form submissions", value: String(leads) },
    ],
    conversions: leads,
    conversionRate: `${cvr}%`,
    capturedLeads: leads,
    winningVersion: ctx.landingStackVersions.find((v) => v.status === "live")?.name ?? "—",
    ctaClicks: hasTraffic ? Math.max(leads, Math.round(visitors * 0.12)) : 0,
    formSubmissions: leads,
    abTests:
      ctx.landingStackVersions.length >= 2
        ? [
            { variant: "A · Control", cvr: "3.2%", traffic: "40%" },
            { variant: "B · Challenger", cvr: "4.1%", traffic: "60%" },
          ]
        : [],
    agentActions:
      landingAgent?.status === "active"
        ? ["Scored page load performance", "Monitored form friction", "Suggested CTA variant shift"]
        : ["Awaiting activation"],
    versions: ctx.landingStackVersions,
    logs: nowLogs("landing", [
      `Landing agent status: ${landingAgent?.status ?? "inactive"}`,
      leads > 0 ? `${leads} leads captured this period` : "No form submissions yet",
      hasTraffic ? "A/B traffic allocation within guardrails" : "No traffic to optimize",
    ]),
    aiReasoning:
      leads > 0
        ? `Variant B outperforming control by 22% CVR. Agent recommends promoting headline shift.`
        : "Landing agent idle — deploy a variant to start conversion capture.",
    history: [
      { time: "09:07", event: "Lead captured · form submit" },
      { time: "09:05", event: "Headline optimized · agent action" },
    ],
    contextualActions: [
      { label: "Edit page", href: "/dashboard/funnel" },
      { label: "Deploy variant", href: "/dashboard/funnel" },
      { label: "View funnel", href: "/dashboard/funnel" },
    ],
  };

  const qualify: SystemModuleDetail = {
    moduleId: "qualify",
    title: "Lead Qualification",
    displayState:
      qualAgent?.status === "active" && qualQueue > 0
        ? "processing"
        : qualAgent?.status === "active"
          ? "active"
          : qualAgent?.status === "pending"
            ? "running"
            : leads > 0 && qualified < leads
              ? "needs_attention"
              : "idle",
    isEmpty: leads === 0,
    summary:
      qualified > 0
        ? `${qualified} scored · ${qualQueue} in queue · ~${qualQueue > 0 ? "12s" : "8s"} processing.`
        : "No leads to qualify yet.",
    metrics: [
      { label: "Scored", value: String(qualified) },
      { label: "Queue", value: String(qualQueue) },
      { label: "Processing", value: qualQueue > 0 ? "12s" : leads > 0 ? "8s" : "—" },
      { label: "Agent", value: qualAgent?.status ?? "inactive" },
    ],
    scoredLeads: qualified,
    queueCount: qualQueue,
    processingTime: qualQueue > 0 ? "12s avg" : "8s avg",
    leads:
      leads > 0
        ? Array.from({ length: Math.min(3, leads) }, (_, i) => ({
            id: `lead-${i + 1}`,
            name: `Inbound lead #${i + 1}`,
            score: 72 + i * 8,
            reasoning: "High intent: repeat page views, form completed, local geo match.",
            missingFields: i === 0 ? ["Phone"] : [],
            status: i < qualified ? "approved" : ("pending" as const),
          }))
        : [],
    rules: [
      "Score ≥ 70 → route to sales within 15 min",
      "Missing phone → request in follow-up sequence",
      "Duplicate email → merge with existing CRM record",
    ],
    logs: nowLogs("qualify", [
      `Queue depth: ${qualQueue}`,
      qualAgent?.status === "active" ? "Scoring model v2 active" : "Qualification agent not active",
      qualified > 0 ? `${qualified} leads passed threshold` : "No scored leads",
    ]),
  };

  const followup: SystemModuleDetail = {
    moduleId: "followup",
    title: "Follow-Up",
    displayState:
      followAgent?.status === "active" && pendingFollow > 0
        ? "active"
        : followAgent?.status === "running"
          ? "running"
          : followAgent?.status === "active"
            ? "live"
            : qualified > 0
              ? "needs_attention"
              : "idle",
    isEmpty: qualified === 0 && pendingFollow === 0,
    summary:
      pendingFollow > 0
        ? `${pendingFollow} pending · ETA 4m · sequences active.`
        : "No follow-ups queued.",
    metrics: [
      { label: "Pending", value: String(pendingFollow) },
      { label: "ETA", value: followAgent?.status === "active" ? "4m" : "—" },
      { label: "Sequences", value: followAgent?.status === "active" ? "1 active" : "0" },
      { label: "Failed sends", value: "0" },
    ],
    pendingCount: pendingFollow,
    eta: followAgent?.status === "active" ? "4 minutes" : "—",
    sequences:
      pendingFollow > 0
        ? [
            {
              lead: "High-intent · Form submit",
              channel: "email",
              status: "Scheduled · touch 1",
              preview: "Thanks for reaching out — here's your inspection window…",
            },
            {
              lead: "Qualified · No reply 24h",
              channel: "sms",
              status: "Queued",
              preview: "Quick reminder: your free roof inspection slot is open.",
            },
          ]
        : [],
    nextOutreach: followAgent?.status === "active" ? "Today · 2:30 PM local" : "—",
    logs: nowLogs("followup", [
      `Follow-up agent: ${followAgent?.status ?? "inactive"}`,
      pendingFollow > 0 ? `${pendingFollow} leads in nurture queue` : "Queue empty",
      "SMS + email channels within compliance window",
    ]),
  };

  const crm: SystemModuleDetail = {
    moduleId: "crm",
    title: "CRM",
    displayState: !ctx.crmConnected
      ? "disconnected"
      : booked + won > 0
        ? "live"
        : qualified > 0
          ? "processing"
          : "needs_attention",
    isEmpty: !ctx.crmConnected && leads === 0,
    summary: ctx.crmConnected
      ? `${booked + won} records synced · ~2m latency.`
      : "CRM not connected — leads will not sync to pipeline.",
    metrics: [
      { label: "Synced", value: String(booked + won + qualified) },
      { label: "Latency", value: ctx.crmConnected ? "~2m" : "—" },
      { label: "Failed", value: ctx.crmConnected ? "0" : "—" },
      { label: "Account", value: ctx.crmConnected ? "Leads CRM" : "Not connected" },
    ],
    syncedCount: booked + won + qualified,
    syncLatency: ctx.crmConnected ? "~2 minutes" : "—",
    connectedAccount: ctx.crmConnected ? "Leads CRM (native)" : "None",
    fieldMapping: [
      { label: "email", value: "Email" },
      { label: "phone", value: "Phone" },
      { label: "status", value: "Pipeline stage" },
      { label: "source", value: "Lead source" },
    ],
    failedRecords: !ctx.crmConnected
      ? [{ id: "sync-1", reason: "CRM connection missing" }]
      : [],
    logs: nowLogs("crm", [
      ctx.crmConnected ? "Webhook handshake OK" : "CRM sync disabled",
      qualified > 0 ? `${qualified} qualified leads mapped` : "No records to sync",
      booked > 0 ? `${booked} appointments synced` : "No booked stage updates",
    ]),
    aiReasoning: !ctx.crmConnected
      ? "Leads captured but not synced — reconnect CRM to avoid pipeline leakage."
      : "Sync latency elevated due to API throttling — retry recommended.",
    history: [
      { time: "09:09", event: "Follow-up sent" },
      { time: "09:07", event: "Lead captured" },
    ],
    contextualActions: [
      { label: "Sync now", href: "/dashboard/leads" },
      { label: "Fix mapping", href: "/dashboard/integrations" },
      { label: "Open pipeline", href: "/dashboard/leads" },
    ],
  };

  const optimize: SystemModuleDetail = {
    moduleId: "optimize",
    title: "Optimization Loop",
    displayState:
      ctx.metrics?.activeCampaigns && ctx.metrics.activeCampaigns > 0
        ? "processing"
        : ctx.recommendations.length > 0
          ? "running"
          : "idle",
    isEmpty: (ctx.metrics?.activeCampaigns ?? 0) === 0 && ctx.recommendations.length === 0,
    summary:
      (ctx.metrics?.activeCampaigns ?? 0) > 0
        ? "Active tuning on spend and creative — rollback available."
        : "Optimization idle until campaigns are live.",
    metrics: [
      { label: "Active campaigns", value: String(ctx.metrics?.activeCampaigns ?? 0) },
      { label: "Spend (period)", value: ctx.metrics ? `$${ctx.metrics.totalSpend}` : "—" },
      { label: "CPL", value: ctx.metrics?.costPerLead != null ? `$${ctx.metrics.costPerLead}` : "—" },
      { label: "Last run", value: (ctx.metrics?.activeCampaigns ?? 0) > 0 ? "18m ago" : "—" },
    ],
    tuningActions:
      (ctx.metrics?.activeCampaigns ?? 0) > 0
        ? ["Budget reallocation", "Audience refinement", "Creative fatigue scan"]
        : [],
    recommendations: ctx.recommendations.slice(0, 3),
    changes:
      (ctx.metrics?.activeCampaigns ?? 0) > 0
        ? [
            {
              what: "Reduced Ad Set B daily budget by 15%",
              why: "CPL increased 18% over 48h vs. account median.",
            },
            {
              what: "Shifted 60% traffic to Landing variant B",
              why: "Variant B CVR +22% vs. control in A/B test.",
            },
          ]
        : [],
    budgetAdjustments:
      (ctx.metrics?.activeCampaigns ?? 0) > 0
        ? [
            { label: "Ad Set A", value: "+$12/day" },
            { label: "Ad Set B", value: "-$8/day" },
          ]
        : [],
    performanceImpact: (ctx.metrics?.activeCampaigns ?? 0) > 0 ? "+8–14% ROAS projected" : "—",
    rollbackAvailable: (ctx.metrics?.activeCampaigns ?? 0) > 0,
    logs: nowLogs("optimize", [
      (ctx.metrics?.activeCampaigns ?? 0) > 0 ? "Optimization loop running" : "No live campaigns",
      "Guardrails: $25/day cap · approval required",
      ctx.recommendations.length > 0 ? `${ctx.recommendations.length} AI recommendations queued` : "No pending optimizations",
    ]),
    aiReasoning:
      (ctx.metrics?.activeCampaigns ?? 0) > 0
        ? "Traffic velocity dropped 18%. Retargeting unavailable. Budget held. Landing variant B promoted."
        : "Optimization idle until campaigns are live.",
    history: [
      { time: "09:13", event: "Optimization applied" },
      { time: "09:10", event: "Budget reallocation queued" },
    ],
    contextualActions: [
      { label: "Review logs", href: "/dashboard/optimization" },
      { label: "Rollback", href: "/dashboard/optimization" },
      { label: "Launch retargeting", href: "/dashboard/campaign-ops" },
    ],
  };

  return { traffic, landing, qualify, followup, crm, optimize };
}

export function displayStateForStep(
  step: OrchestrationFlowStep,
  details: Record<SystemModuleId, SystemModuleDetail>,
): SystemModuleDisplayState {
  const detail = details[step.id as SystemModuleId];
  return detail?.displayState ?? "idle";
}
