import type { DashboardOverviewData } from "@/lib/dashboard/load-dashboard-overview";
import type {
  AiEmployee,
  CeoCommandCenterData,
  ConnectedAccount,
  HealthScoreData,
  KpiCardData,
  LeadSource,
  PipelineStage,
  ProgressStep,
  TaskItem,
} from "@/types/ceo-command-center";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "OS";
}

function trendText(
  overview: DashboardOverviewData | null,
  key: string,
  fallback = "No prior-period data",
): { change: string; changePositive: boolean } {
  const trend = overview?.kpiTrends.find((item) => item.key === key);
  if (!trend) return { change: fallback, changePositive: true };
  if (trend.direction === "neutral") {
    return { change: "0% vs prior period", changePositive: true };
  }
  const sign = trend.direction === "up" ? "+" : "-";
  return {
    change: `${sign}${trend.changePercent}% vs prior period`,
    changePositive: trend.direction === "up",
  };
}

function sparkline(overview: DashboardOverviewData | null): number[] {
  const points = overview?.sparkSeries.map((point) => point.v) ?? [];
  return points.length > 1 ? points : [0, 0, 0, 0, 0, 0, 0];
}

function buildKpis(overview: DashboardOverviewData | null): KpiCardData[] {
  const metrics = overview?.metrics;
  const revenue = overview?.revenueCommandCenter.revenue ?? 0;
  const spend = overview?.revenueCommandCenter.spend ?? metrics?.totalSpend ?? 0;
  const appointments = overview?.revenueCommandCenter.appointments ?? overview?.bookedOrWonCount ?? 0;
  const sales = overview?.revenueCommandCenter.closedDeals ?? 0;
  const spark = sparkline(overview);

  return [
    {
      id: "revenue",
      label: "Revenue This Month",
      value: formatCurrency(revenue),
      trend: {
        value: formatCurrency(revenue),
        change: "From revenue attribution",
        changePositive: revenue >= 0,
        sparkline: spark,
      },
      icon: "dollar",
      accent: "green",
    },
    {
      id: "leads",
      label: "Leads This Month",
      value: formatNumber(metrics?.totalLeads ?? 0),
      trend: {
        value: formatNumber(metrics?.totalLeads ?? 0),
        ...trendText(overview, "leads"),
        sparkline: spark,
      },
      icon: "users",
      accent: "blue",
    },
    {
      id: "appointments",
      label: "Appointments",
      value: formatNumber(appointments),
      trend: {
        value: formatNumber(appointments),
        ...trendText(overview, "booked"),
        sparkline: spark,
      },
      icon: "calendar",
      accent: "purple",
    },
    {
      id: "sales",
      label: "Sales",
      value: formatNumber(sales),
      trend: {
        value: formatNumber(sales),
        change: "From closed deals",
        changePositive: sales >= 0,
        sparkline: spark,
      },
      icon: "cart",
      accent: "orange",
    },
    {
      id: "ad_spend",
      label: "Ad Spend",
      value: formatCurrency(spend),
      trend: {
        value: formatCurrency(spend),
        ...trendText(overview, "spend"),
        sparkline: spark,
      },
      icon: "megaphone",
      accent: "pink",
    },
  ];
}

function buildHealthScore(overview: DashboardOverviewData | null): HealthScoreData {
  const score = overview?.healthScore ?? 0;
  return {
    score,
    maxScore: 100,
    changePercent: 0,
    message:
      score >= 80
        ? "Your connected business systems are healthy."
        : score > 0
          ? "Some business systems need attention."
          : "Connect tools and activate agents to build your health score.",
    breakdown:
      overview?.healthChecks.map((check) => ({
        label: check.label,
        score: check.ok ? 100 : 0,
      })) ?? [],
  };
}

function buildRevenueGoal(overview: DashboardOverviewData | null) {
  const currencyGoal = overview?.goals.find((goal) => goal.unit === "currency");
  const currentRevenue = currencyGoal?.current ?? overview?.revenueCommandCenter.revenue ?? 0;
  const monthlyGoal = currencyGoal?.target ?? 0;
  const revenueGap = Math.max(0, monthlyGoal - currentRevenue);
  const progressPercent =
    monthlyGoal > 0 ? Math.min(100, Math.round((currentRevenue / monthlyGoal) * 100)) : 0;

  return {
    monthlyGoal,
    currentRevenue,
    revenueGap,
    progressPercent,
    leadsNeeded: overview?.goals.find((goal) => goal.id === "leads")?.etaDays ?? 0,
    appointmentsNeeded: 0,
    salesNeeded: 0,
  };
}

function buildPipeline(overview: DashboardOverviewData | null): PipelineStage[] {
  return (
    overview?.funnel.map((stage) => ({
      id: stage.key,
      label: stage.label,
      count: stage.count,
      value: 0,
    })) ?? []
  );
}

function buildLeadSources(): LeadSource[] {
  return [];
}

function buildAiEmployees(overview: DashboardOverviewData | null): AiEmployee[] {
  return (
    overview?.agents.map((agent) => ({
      id: agent.key,
      name: agent.name,
      status:
        agent.status === "active"
          ? "active"
          : agent.status === "paused"
            ? "paused"
            : "idle",
      description: agent.status.replace(/_/g, " "),
    })) ?? []
  );
}

function buildConnectedAccounts(overview: DashboardOverviewData | null): ConnectedAccount[] {
  return (
    overview?.connections.map((connection) => ({
      id: connection.id,
      name: connection.name,
      status: connection.status === "connected" ? "connected" : "pending",
    })) ?? []
  );
}

function buildTasks(overview: DashboardOverviewData | null): TaskItem[] {
  const opportunities =
    overview?.opportunities.map((item) => ({
      id: item.id,
      title: item.title,
      priority: item.priority,
    })) ?? [];

  if (opportunities.length > 0) return opportunities.slice(0, 5);

  return (
    overview?.recommendations.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      priority: item.risk === "high" ? "high" : item.risk === "medium" ? "medium" : "low",
    })) ?? []
  );
}

function buildProgressSteps(overview: DashboardOverviewData | null): ProgressStep[] {
  const hasConnectedAccount = overview?.connections.some((item) => item.status === "connected") ?? false;
  const hasActiveAgent = overview?.agents.some((item) => item.status === "active") ?? false;

  return [
    { id: 1, label: "Business Profile", status: overview ? "completed" : "pending" },
    { id: 2, label: "Offer & Goals", status: overview ? "completed" : "pending" },
    { id: 3, label: "Landing Pages", status: overview ? "completed" : "pending" },
    { id: 4, label: "Pipeline & Workflow", status: overview ? "completed" : "pending" },
    { id: 5, label: "Connect Accounts", status: hasConnectedAccount ? "completed" : "active" },
    { id: 6, label: "AI Agents", status: hasActiveAgent ? "completed" : "active" },
    { id: 7, label: "Ads Agent", status: hasConnectedAccount ? "active" : "pending" },
    { id: 8, label: "Tracking", status: overview?.metrics ? "active" : "pending" },
    { id: 9, label: "Review", status: "review" },
    { id: 10, label: "Launch", status: overview ? "completed" : "pending" },
  ];
}

export function buildCeoCommandCenterDataFromOverview(
  overview: DashboardOverviewData | null,
): CeoCommandCenterData {
  const businessName = overview?.workspace.businessName ?? "Workspace";
  const nextAction = overview?.nextAction;

  return {
    user: {
      name: businessName,
      avatarInitials: initialsFromName(businessName),
    },
    progressSteps: buildProgressSteps(overview),
    kpis: buildKpis(overview),
    healthScore: buildHealthScore(overview),
    revenueGoal: buildRevenueGoal(overview),
    aiCoach: {
      greeting: `Good morning, ${businessName}`,
      summary: overview?.briefing.aiInsight ?? "No AI insight available until real activity is recorded.",
      topPriority: {
        title: nextAction?.title ?? "No priority action yet",
        potentialRevenue: nextAction?.impact ?? "No revenue impact available",
        ctaLabel: nextAction?.cta ?? "Review dashboard",
        ctaHref: nextAction?.href ?? "/dashboard",
      },
      recommendations:
        overview?.recommendations.slice(0, 3).map((item) => ({
          id: item.id,
          text: item.title,
        })) ?? [],
    },
    pipeline: buildPipeline(overview),
    leadSources: buildLeadSources(),
    aiEmployees: buildAiEmployees(overview),
    recentActivity:
      overview?.activity.map((item) => ({
        id: item.id,
        text: item.detail ? `${item.title}: ${item.detail}` : item.title,
        timeAgo: item.time,
      })) ?? [],
    tasks: buildTasks(overview),
    connectedAccounts: buildConnectedAccounts(overview),
  };
}
