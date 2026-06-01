import { loadDashboardOverview } from "@/lib/dashboard/load-dashboard-overview";
import type { OperatorPlatformContext } from "@/types/ai-operator";

export async function loadOperatorPlatformContext(
  pathname: string,
): Promise<OperatorPlatformContext> {
  const data = await loadDashboardOverview();

  if (!data) {
    return {
      hasBusiness: false,
      pagePath: pathname,
      healthScore: 0,
      riskLevel: "high",
      revenue: 0,
      pipeline: 0,
      spend: 0,
      roas: null,
      leadVelocity7d: 0,
      totalLeads: 0,
      activeCampaigns: 0,
      activeAgents: 0,
      totalAgents: 0,
      pendingApprovals: 0,
      connectedPlatforms: [],
      trackingStatus: "unknown",
      crmConnected: false,
      metaConnected: false,
      googleConnected: false,
      agentIssues: ["Complete onboarding to unlock live platform context."],
      topInsight: "No business profile connected yet.",
    };
  }

  const rev = data.revenueCommandCenter;
  const velocity = data.sparkSeries.reduce((s, p) => s + p.v, 0);
  const connected = data.connections
    .filter((c) => c.status === "connected")
    .map((c) => c.name);
  const metaConnected = data.connections.some(
    (c) => (c.id === "meta" || c.id === "facebook") && c.status === "connected",
  );
  const googleConnected = data.connections.some(
    (c) => c.id === "google" && c.status === "connected",
  );
  const crmConnected = data.connections.some(
    (c) => (c.id === "crm" || c.id === "hubspot") && c.status === "connected",
  );

  let pendingApprovals = data.commandCenter.filter(
    (c) => c.kind === "alert" || c.kind === "warning",
  ).length;
  if (
    data.nextAction.approvalState === "pending" ||
    data.nextAction.approvalState === "user_approval_required"
  ) {
    pendingApprovals += 1;
  }

  const agentIssues: string[] = [];
  const inactiveAgents = data.agents.filter((a) => a.status !== "active");
  if (inactiveAgents.length > 0) {
    agentIssues.push(
      `${inactiveAgents.length} agent${inactiveAgents.length > 1 ? "s" : ""} inactive — enable follow-up and qualification.`,
    );
  }
  if (!metaConnected && !googleConnected) {
    agentIssues.push("No paid ad accounts connected — acquisition is limited to organic.");
  }
  if (!crmConnected) {
    agentIssues.push("CRM not connected — leads may not sync to your pipeline.");
  }

  const trackingStatus: OperatorPlatformContext["trackingStatus"] =
    metaConnected || googleConnected ? (agentIssues.length > 2 ? "degraded" : "healthy") : "degraded";

  return {
    hasBusiness: true,
    businessName: data.workspace.businessName,
    pagePath: pathname,
    healthScore: data.healthScore,
    riskLevel: data.briefing.riskLevel,
    revenue: rev.revenue,
    pipeline: rev.pipeline,
    spend: rev.spend,
    roas: rev.roas,
    leadVelocity7d: velocity,
    totalLeads: data.metrics?.totalLeads ?? 0,
    activeCampaigns: data.metrics?.activeCampaigns ?? 0,
    activeAgents: data.agents.filter((a) => a.status === "active").length,
    totalAgents: data.agents.length,
    pendingApprovals,
    connectedPlatforms: connected,
    trackingStatus,
    crmConnected,
    metaConnected,
    googleConnected,
    agentIssues,
    topInsight: data.briefing.aiInsight,
  };
}
