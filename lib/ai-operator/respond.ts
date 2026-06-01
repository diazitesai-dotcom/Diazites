import { ROUTES } from "@/lib/navigation/platform-nav";
import { resolveNavigation } from "@/lib/ai-operator/navigation";
import type {
  OperatorAction,
  OperatorAssistantMessage,
  OperatorMode,
  OperatorPlatformContext,
} from "@/types/ai-operator";
import type { DeploymentLaunchParams } from "@/types/agent-deployment";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function msg(
  partial: Omit<OperatorAssistantMessage, "id" | "role"> & { id?: string },
): OperatorAssistantMessage {
  return {
    id: partial.id ?? `a-${Date.now()}`,
    role: "assistant",
    mode: partial.mode,
    content: partial.content,
    bullets: partial.bullets,
    breadcrumb: partial.breadcrumb,
    actions: partial.actions,
    logLine: partial.logLine,
  };
}

function navAction(href: string, label: string): OperatorAction {
  return { id: `nav-${href}`, label, kind: "navigate", href };
}

function deployAction(label: string, deploy: DeploymentLaunchParams, requiresApproval = false): OperatorAction {
  return { id: `deploy-${label}`, label, kind: "deploy", deploy, requiresApproval };
}

function detectIntent(text: string): string {
  const t = text.toLowerCase().trim();
  if (/\b(what'?s broken|what is broken|system health)\b/.test(t)) return "diagnose_broken";
  if (/\b(why (are|is) leads? down|lead velocity|leads slowing)\b/.test(t)) return "diagnose_leads";
  if (/\b(why is (revenue|performance) down|revenue down|performance drop)\b/.test(t)) return "diagnose_performance";
  if (/\b(tracking|pixel|fix tracking)\b/.test(t)) return "tracking";
  if (/\b(connect meta|meta ads)\b/.test(t)) return "connect_meta";
  if (/\b(connect google|google ads)\b/.test(t)) return "connect_google";
  if (/\b(connect stripe|stripe)\b/.test(t)) return "connect_stripe";
  if (/\b(deploy|launch|create).*(retarget)/.test(t)) return "deploy_retargeting";
  if (/\b(deploy|launch).*(follow-?up|follow up)/.test(t)) return "deploy_followup";
  if (/\b(deploy|launch).*(lead stack|lead engine|funnel)/.test(t)) return "deploy_lead_stack";
  if (/\b(deploy|launch|create).*(campaign|google ads|meta)/.test(t)) return "deploy_ads";
  if (/\b(pause|poor performing)\b/.test(t)) return "pause_ads";
  if (/\b(review|audit).*(setup|growth|funnel|plan)/.test(t)) return "operator_audit";
  if (/\b(analyze|optimi[sz]e).*(campaign|revenue)/.test(t)) return "operator_analyze";
  if (/\b(explain roas|what is roas|what does roas)\b/.test(t)) return "explain_roas";
  if (/\b(explain|what (is|does)|mean)\b/.test(t) && /\b(pipeline|velocity|agent health)\b/.test(t))
    return "explain_metric";
  if (/\b(approval|pending approval)\b/.test(t)) return "approvals";
  if (resolveNavigation(t)) return "navigate";
  if (/\b(how do i|how to|help me|how does)\b/.test(t)) return "support";
  if (/\b(why is agent health)\b/.test(t)) return "agent_health";
  return "general";
}

export function processOperatorMessage(
  input: string,
  ctx: OperatorPlatformContext,
): OperatorAssistantMessage {
  const text = input.trim();
  const intent = detectIntent(text);
  const nav = resolveNavigation(text);

  if (!ctx.hasBusiness) {
    return msg({
      mode: "support",
      content: "Connect your business profile first so I can read live campaigns, leads, agents, and revenue.",
      actions: [navAction("/onboarding", "Finish onboarding")],
    });
  }

  if (intent === "navigate" && nav) {
    return msg({
      mode: "navigation",
      content: `Opening ${nav.label}.`,
      breadcrumb: nav.breadcrumb,
      actions: [navAction(nav.href, "Take me there")],
      logLine: `Navigate → ${nav.href}`,
    });
  }

  if (intent === "diagnose_broken" || /\bwhat'?s wrong\b/i.test(text)) {
    const bullets = [...ctx.agentIssues];
    if (ctx.pendingApprovals > 0) bullets.push(`${ctx.pendingApprovals} item(s) in approval queue.`);
    if (ctx.trackingStatus === "degraded") bullets.push("Tracking or ad sync may be degraded.");
    if (bullets.length === 0) bullets.push("No critical failures detected — monitor lead velocity and ROAS.");
    return msg({
      mode: "diagnostic",
      content: `System health is ${ctx.healthScore}% (${ctx.riskLevel} risk). Here's what needs attention:`,
      bullets,
      actions: [
        navAction(ROUTES.integrationsHub, "Open diagnostics"),
        deployAction("Fix tracking", { goal: "improve_conversion", step: "plan", source: "control_plane" }),
        navAction(ROUTES.missionControl, "Growth Command Center"),
      ],
      logLine: "Diagnostic scan complete",
    });
  }

  if (intent === "diagnose_leads" || /leads down/i.test(text)) {
    const bullets: string[] = [];
    if (!ctx.metaConnected && !ctx.googleConnected && !ctx.zernioConnected)
      bullets.push("Paid acquisition is offline — connect Meta, Google Ads, or Zernio.");
    if (ctx.activeAgents < 2)
      bullets.push("Qualification or follow-up agents may be inactive.");
    if (ctx.leadVelocity7d < 5) bullets.push(`Only ${ctx.leadVelocity7d} leads in the last 7 days — check landing traffic.`);
    bullets.push(`Pipeline value: ${formatMoney(ctx.pipeline)} — focus on converting qualified leads.`);
    return msg({
      mode: "diagnostic",
      content: "Lead flow is softer than target. Likely causes:",
      bullets,
      actions: [
        navAction(ROUTES.leadsOs, "Open Leads OS"),
        deployAction("Deploy follow-up", { goal: "follow_up_leads", step: "stack", source: "control_plane" }),
        navAction(ROUTES.campaignOps, "Campaign Ops"),
      ],
    });
  }

  if (intent === "diagnose_performance" || intent === "explain_metric" && /performance/i.test(text)) {
    const pct = ctx.leadVelocity7d > 0 ? "monitoring inbound trends" : "very low inbound volume";
    const bullets = [
      ctx.metaConnected
        ? "Meta connected — check ad set fatigue and CPL."
        : ctx.zernioConnected
          ? "Zernio connected — paid reach is active across linked platforms."
          : "Meta Ads disconnected — paid reach is limited.",
      ctx.trackingStatus === "degraded" ? "Tracking degraded — attribution may be incomplete." : "Tracking looks stable.",
      `Return on ad spend: ${ctx.roas != null ? `${ctx.roas.toFixed(1)}×` : "not enough spend data yet"}.`,
      `Lead velocity (7d): ${ctx.leadVelocity7d} leads — ${pct}.`,
    ];
    return msg({
      mode: "diagnostic",
      content: "Performance is under pressure. Summary:",
      bullets,
      actions: [
        navAction(ROUTES.reportsIntelligence, "Reports & Intelligence"),
        navAction(ROUTES.integrationsHub, "Fix tracking"),
        deployAction("Launch retargeting", { preset: "retargeting", agent: "retargeting", goal: "improve_conversion", mode: "guided", step: "plan", source: "control_plane" }, true),
      ],
    });
  }

  if (intent === "tracking" || /fix tracking/i.test(text)) {
    return msg({
      mode: intent === "support" ? "support" : "diagnostic",
      content:
        "Tracking issues usually come from missing pixel events, domain verification, or CRM webhook gaps. Verify Meta pixel, GA4, and lead form events in Integrations Hub.",
      bullets: [
        "Confirm domain verification in Meta Events Manager.",
        "Test lead and purchase events after publish.",
        "Reconnect CRM for closed-loop attribution.",
      ],
      actions: [
        navAction(ROUTES.integrationsHub, "Open Integrations Hub"),
        navAction(ROUTES.funnelStudio, "Funnel Studio"),
        deployAction("Validate stack", { goal: "improve_conversion", step: "plan", source: "control_plane" }),
      ],
    });
  }

  if (intent === "connect_meta") {
    return msg({
      mode: "action",
      content: "Connect Meta Ads to unlock paid acquisition, spend sync, and campaign deployment from Campaign Ops.",
      breadcrumb: "Integrations Hub → Meta Ads",
      actions: [
        navAction(ROUTES.integrationsHub, "Connect Meta"),
        navAction(ROUTES.campaignOps, "Campaign Ops"),
      ],
    });
  }

  if (intent === "connect_google") {
    return msg({
      mode: "action",
      content: "Connect Google Ads for search intent campaigns, keyword optimization, and ROAS reporting.",
      breadcrumb: "Integrations Hub → Google Ads",
      actions: [navAction(ROUTES.integrationsHub, "Connect Google Ads")],
    });
  }

  if (intent === "connect_stripe") {
    return msg({
      mode: "action",
      content:
        "Stripe revenue tracking is configured in Organization → Workspace. Add webhook metadata business_id on payments for automatic revenue attribution.",
      breadcrumb: "Organization → Workspace → Revenue webhooks",
      actions: [
        navAction(`${ROUTES.organization}?tab=settings`, "Workspace settings"),
        navAction(ROUTES.reportsIntelligence, "Revenue reports"),
      ],
    });
  }

  if (intent === "deploy_retargeting" || /launch retargeting/i.test(text)) {
    return msg({
      mode: "action",
      content: "Ready to deploy retargeting — recover visitors who didn't convert with audience sync and creative rotation.",
      bullets: ["Audience: site visitors + qualified non-converters", "Channels: Meta / Google where connected", "Approval may be required for budget changes"],
      actions: [
        deployAction("Deploy retargeting", { preset: "retargeting", agent: "retargeting", goal: "improve_conversion", mode: "guided", step: "plan", source: "control_plane" }, true),
        navAction(ROUTES.campaignOps, "Campaign Ops"),
      ],
      logLine: "Retargeting deployment queued",
    });
  }

  if (intent === "deploy_followup" || /launch follow-?up/i.test(text)) {
    return msg({
      mode: "action",
      content: "Ready to deploy follow-up automation across email and qualification triggers with CRM sync.",
      bullets: ["Trigger: new lead + qualified status", "Channels: email sequences", "Agent: AI Follow-Up"],
      actions: [
        deployAction("Deploy follow-up", { goal: "follow_up_leads", step: "stack", source: "control_plane" }, true),
        navAction(ROUTES.automationCenter, "Automation Center"),
      ],
    });
  }

  if (intent === "deploy_lead_stack" || /deploy.*lead/i.test(text)) {
    return msg({
      mode: "action",
      content: "Deploying lead stack: landing capture → qualification → follow-up → CRM handoff.",
      actions: [
        deployAction("Deploy lead stack", { stack: "lead_engine", goal: "generate_leads", step: "stack", source: "control_plane" }),
        navAction(ROUTES.growthEngine, "Growth Engine"),
      ],
    });
  }

  if (intent === "deploy_ads" || /create.*campaign/i.test(text)) {
    return msg({
      mode: "action",
      content: "Launch paid campaigns from Growth Engine or Campaign Ops — I'll open the deployment flow with guardrails.",
      actions: [
        deployAction("Launch ads", { goal: "launch_ads", step: "plan", source: "control_plane" }, true),
        navAction(ROUTES.campaignOps, "Campaign Ops"),
      ],
    });
  }

  if (intent === "pause_ads") {
    return msg({
      mode: "action",
      content: "Pausing poor performers requires Campaign Ops access. Review ROAS by campaign, then pause or reallocate budget.",
      actions: [
        navAction(ROUTES.campaignOps, "Open Campaign Ops"),
        navAction(ROUTES.optimizationLab, "Optimization Lab"),
      ],
      logLine: "High-risk action — confirm in Campaign Ops",
    });
  }

  if (intent === "approvals" || /approval queue/i.test(text)) {
    return msg({
      mode: "navigation",
      content: `You have ${ctx.pendingApprovals} item(s) awaiting decision in the approval queue.`,
      breadcrumb: "Approval Center",
      actions: [navAction(ROUTES.approvalCenter, "Open Approval Center")],
    });
  }

  if (intent === "explain_roas") {
    return msg({
      mode: "answer",
      content:
        "Return on ad spend (ROAS) is how much revenue you earn for each dollar spent on ads. A 3× ROAS means $3 revenue per $1 spent.",
      bullets: [
        `Your modeled ROAS: ${ctx.roas != null ? `${ctx.roas.toFixed(1)}×` : "connect ads to calculate"}.`,
        `Money generated: ${formatMoney(ctx.revenue)} · Spend: ${formatMoney(ctx.spend)}.`,
      ],
      actions: [navAction(ROUTES.reportsIntelligence, "Revenue reports")],
    });
  }

  if (intent === "agent_health") {
    return msg({
      mode: "answer",
      content: `Agent health reflects ${ctx.activeAgents} of ${ctx.totalAgents} agents actively running. Low health usually means inactive qualification, follow-up, or ads agents.`,
      bullets: ctx.agentIssues.length ? ctx.agentIssues : ["All core agents appear active."],
      actions: [navAction(ROUTES.agents, "Open Agents")],
    });
  }

  if (intent === "operator_audit" || /review.*setup/i.test(text)) {
    return msg({
      mode: "operator",
      content: "Growth setup audit — opportunities and risks based on your live workspace:",
      bullets: [
        `Health ${ctx.healthScore}% · ${ctx.riskLevel} risk`,
        `${ctx.activeCampaigns} active campaigns · ${ctx.totalLeads} leads (period)`,
        ctx.topInsight ?? "Enable paid + follow-up agents for fastest lift.",
      ],
      actions: [
        deployAction("Review growth plan", { stack: "lead_engine", goal: "generate_leads", step: "plan", source: "control_plane" }),
        navAction(ROUTES.missionControl, "Growth Command Center"),
      ],
    });
  }

  if (intent === "operator_analyze" || /revenue attribution/i.test(text)) {
    return msg({
      mode: "operator",
      content: `Revenue attribution snapshot: ${formatMoney(ctx.revenue)} generated · ${formatMoney(ctx.pipeline)} potential pipeline.`,
      bullets: [
        `ROAS: ${ctx.roas != null ? `${ctx.roas.toFixed(1)}×` : "—"}`,
        "Use Reports for source/campaign breakdown and CSV export.",
      ],
      actions: [navAction(ROUTES.reportsIntelligence, "Revenue attribution")],
    });
  }

  if (intent === "support" || /\bhow (do|does)\b/i.test(text)) {
    if (/approval/i.test(text)) {
      return msg({
        mode: "support",
        content:
          "Approvals protect budget, creative, and autonomous agent actions. Anything high-risk waits for your OK in Approval Center.",
        actions: [navAction(ROUTES.approvalCenter, "Open Approval Center")],
      });
    }
    if (/lead velocity/i.test(text)) {
      return msg({
        mode: "support",
        content: "Lead velocity is how many new leads you captured recently — a pulse on inbound demand, not closed revenue.",
        actions: [navAction(ROUTES.missionControl, "Growth Command Center")],
      });
    }
    return msg({
      mode: "support",
      content:
        "I can explain metrics, navigate anywhere in GrowthOS, deploy stacks, and diagnose issues. Try a quick command or ask in plain English.",
      bullets: ["“Take me to campaigns”", "“Why are leads down?”", "“Deploy retargeting”"],
    });
  }

  if (/highest roas|best campaign/i.test(text)) {
    return msg({
      mode: "answer",
      content: "Campaign ROAS rankings live in Campaign Ops and Reports & Intelligence. I'll take you to the workspace with live spend and return data.",
      actions: [
        navAction(ROUTES.campaignOps, "Campaign Ops"),
        navAction(ROUTES.reportsIntelligence, "Reports"),
      ],
    });
  }

  if (/qualification|waiting for qualification/i.test(text)) {
    return msg({
      mode: "navigation",
      content: "Leads waiting for qualification are in Leads OS — filter by status and agent queue.",
      breadcrumb: "Leads OS → Qualification queue",
      actions: [navAction(ROUTES.leadsOs, "Open Leads OS")],
    });
  }

  if (/edit.*offer|change.*offer/i.test(text)) {
    return msg({
      mode: "navigation",
      content: "Your offer lives in Growth Engine → Offer Builder. Landing copy is in Funnel Studio.",
      breadcrumb: "Growth Engine → Offer Builder",
      actions: [
        navAction(ROUTES.growthEngine, "Growth Engine"),
        navAction(ROUTES.funnelStudio, "Funnel Studio"),
      ],
    });
  }

  return msg({
    mode: "answer",
    content: ctx.topInsight ?? "I'm synced with your workspace. Ask about metrics, deployments, diagnostics, or say “take me to” any module.",
    bullets: [
      `Revenue ${formatMoney(ctx.revenue)} · Pipeline ${formatMoney(ctx.pipeline)}`,
      `${ctx.activeAgents} agents active · ${ctx.pendingApprovals} approvals pending`,
    ],
    actions: [
      navAction(ROUTES.missionControl, "Growth Command Center"),
      deployAction("Review plan", { goal: "generate_leads", step: "plan", source: "control_plane" }),
    ],
  });
}
