import { ADOPS_PLATFORMS, DEFAULT_SAFETY_POLICY } from "@/lib/ads/adops-catalog";
import { isAdAccountRowConnected } from "@/lib/integrations/ad-account-connection";
import {
  adopsPlatformLinkedViaZernio,
  mapZernioAccountsToWorkspaceAccounts,
  zernioAccountsFromAdAccountMeta,
} from "@/lib/ads/zernio-adops-bridge";
import type {
  AdopsAgentView,
  AdopsPagePayload,
  AdopsPlatformId,
  AgentActionRow,
  LiveCampaignRow,
  PlatformHealth,
  PlatformWorkspaceData,
} from "@/lib/ads/adops-types";
import type { ZernioAccount } from "@/lib/zernio";
import type { AdAccountRow, AdCampaignRow } from "@/repositories/ad-account.repository";

function mapCampaignStatus(status: string): LiveCampaignRow["status"] {
  switch (status) {
    case "active":
      return "live";
    case "pending":
      return "processing";
    case "paused":
      return "paused";
    case "error":
      return "failed";
    default:
      return "running";
  }
}

function healthForAccount(acct: AdAccountRow | undefined): PlatformHealth {
  if (!acct || acct.status === "disconnected") return "disconnected";
  if (acct.status === "error") return "oauth_failed";
  if (acct.status === "pending") return "sync_delayed";
  if (acct.token_expires_at) {
    const exp = new Date(acct.token_expires_at).getTime();
    const days = (exp - Date.now()) / (1000 * 60 * 60 * 24);
    if (days < 3) return "token_expiring";
  }
  return "healthy";
}

function platformLabel(id: AdopsPlatformId): string {
  return ADOPS_PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export function buildLiveCampaignRows(
  campaigns: AdCampaignRow[],
  businessName: string,
): LiveCampaignRow[] {
  return campaigns.map((c, i) => {
    const spend = Number(c.spend_usd ?? 0);
    const leads = Number(c.leads ?? 0);
    const clicks = Number(c.clicks ?? 0);
    const impressions = Math.max(clicks * 12, Number(c.impressions ?? 0));
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const pid = (c.platform === "microsoft" ? "microsoft" : c.platform) as AdopsPlatformId;
    return {
      id: c.id,
      name: c.name,
      platformId: pid,
      platformLabel: platformLabel(pid),
      status: mapCampaignStatus(c.status),
      spend,
      leads,
      cpl: leads > 0 ? spend / leads : null,
      ctr: Math.round(ctr * 10) / 10,
      conversionRate: clicks > 0 ? Math.round((leads / clicks) * 1000) / 10 : 0,
      roas: leads > 0 ? Math.round((leads * 42) / Math.max(spend, 1) * 10) / 10 : null,
      budget: Number(c.daily_budget_usd ?? 0),
      objective: i % 2 === 0 ? "Lead generation" : "Conversions",
      lastAiAction: c.status === "active" ? "Budget tuned 12m ago" : "Awaiting deploy",
      aiHealth: c.status === "error" ? "api_error" : leads === 0 && spend > 20 ? "failed_tracking" : "healthy",
    };
  });
}

function syntheticAccounts(platformId: AdopsPlatformId, businessName: string, connected: boolean): PlatformWorkspaceData["accounts"] {
  if (!connected) return [];
  return [
    {
      id: `${platformId}-1`,
      businessName,
      accountName: `${platformLabel(platformId)} · Primary`,
      accountId: `act_${platformId}_001`,
      status: "active",
      spendToday: 24.5,
      currency: "USD",
      platformId,
    },
    {
      id: `${platformId}-2`,
      businessName: `${businessName} Regional`,
      accountName: `${platformLabel(platformId)} · Regional`,
      accountId: `act_${platformId}_002`,
      status: "active",
      spendToday: 8.2,
      currency: "USD",
      platformId,
    },
  ];
}

export function buildPlatformWorkspace(
  platformId: AdopsPlatformId,
  businessName: string,
  accounts: AdAccountRow[],
  campaigns: LiveCampaignRow[],
  zernioAccounts: ZernioAccount[] = [],
): PlatformWorkspaceData {
  const def = ADOPS_PLATFORMS.find((p) => p.id === platformId)!;
  const repoPlatform = def.mapsToRepo;
  const acct = repoPlatform ? accounts.find((a) => a.platform === repoPlatform) : undefined;
  const viaZernio = adopsPlatformLinkedViaZernio(platformId, zernioAccounts);
  const oauthConnected = acct?.status === "connected" || acct?.status === "pending";
  const connected = oauthConnected || viaZernio;
  const health: PlatformHealth = connected
    ? viaZernio && !oauthConnected
      ? "healthy"
      : healthForAccount(acct)
    : "disconnected";
  const zernioWorkspaceAccounts = mapZernioAccountsToWorkspaceAccounts(
    platformId,
    businessName,
    zernioAccounts,
  );
  const platformCampaigns = campaigns.filter(
    (c) => c.platformId === platformId || (platformId === "youtube" && c.platformId === "google"),
  );
  const spend = platformCampaigns.reduce((s, c) => s + c.spend, 0);
  const leads = platformCampaigns.reduce((s, c) => s + c.leads, 0);

  return {
    platformId,
    label: def.label,
    connectionStatus: connected ? (acct?.status ?? "connected") : "disconnected",
    health,
    lastSync: acct?.updated_at
      ? new Date(acct.updated_at).toLocaleString()
      : viaZernio
        ? "Via Zernio"
        : null,
    oauthHealth:
      health === "token_expiring"
        ? "Token expires soon"
        : viaZernio && !oauthConnected
          ? "Connected via Zernio"
          : connected
            ? "Valid"
            : "Not connected",
    totalSpend: spend,
    leads,
    roas: spend > 0 && leads > 0 ? Math.round((leads * 42) / spend * 10) / 10 : null,
    campaignCount: platformCampaigns.length,
    activeAccounts: zernioWorkspaceAccounts.length || (connected ? 2 : 0),
    pixelConnected: platformId === "meta" || platformId === "google",
    eventLossPercent: connected ? 4 : null,
    accounts: zernioWorkspaceAccounts.length
      ? zernioWorkspaceAccounts
      : acct
        ? syntheticAccounts(platformId, businessName, connected)
        : [],
    campaigns: platformCampaigns,
    audiences: connected
      ? [
          { name: "Website visitors 30d", size: "2.4k", type: "Retargeting" },
          { name: "Lead form engagers", size: "890", type: "Custom" },
          { name: "Lookalike 1% — converters", size: "12k", type: "Lookalike" },
        ]
      : [],
    creatives: connected
      ? [
          { name: "Variant A · Hero video", type: "Video", performance: "4.2% CTR" },
          { name: "Variant B · Carousel", type: "Image", performance: "3.1% CTR" },
        ]
      : [],
    agentFeed: buildSyntheticFeed(platformId),
  };
}

function buildSyntheticFeed(platformId: AdopsPlatformId): AgentActionRow[] {
  return [
    {
      id: `${platformId}-a1`,
      timestamp: "2m ago",
      message: "AI increased budget 12% on top performer",
      confidence: 88,
      riskScore: "medium",
      platformId,
      agentKey: "optimization",
      rollbackAvailable: true,
    },
    {
      id: `${platformId}-a2`,
      timestamp: "18m ago",
      message: "AI paused low CTR ad set",
      confidence: 92,
      riskScore: "low",
      platformId,
      agentKey: "ads",
      rollbackAvailable: true,
    },
    {
      id: `${platformId}-a3`,
      timestamp: "1h ago",
      message: "Retargeting audience expanded (+340 users)",
      confidence: 79,
      riskScore: "low",
      platformId,
      agentKey: "retargeting",
      rollbackAvailable: false,
    },
  ];
}

export function buildAdopsAgents(campaigns: LiveCampaignRow[]): AdopsAgentView[] {
  const hasLive = campaigns.some((c) => c.status === "live" || c.status === "running");
  return [
    {
      key: "ads",
      label: "Ads Agent",
      status: hasLive ? "running" : "idle",
      currentTask: hasLive ? "Creating Meta retargeting campaign" : "Standby",
      stage: hasLive ? "Launch" : "—",
      confidence: 92,
      risk: "medium",
      connectedPlatforms: ["meta", "google"],
      runtime: "38s",
      eta: hasLive ? "38s" : null,
      tasks: ["Creating audience", "Launching campaign", "Budget tuning"],
      reasoning: "Lead volume dropped 14% — budget increased to recover traffic while CPL stays under cap.",
      actionsTimeline: [
        { time: "09:14", action: "Increased Ad Set A budget +12%", result: "Spend pacing OK", risk: "medium", rollback: true },
        { time: "09:02", action: "Paused creative with CTR < 1%", result: "CPL improved 8%", risk: "low", rollback: true },
      ],
    },
    {
      key: "optimization",
      label: "Optimization Agent",
      status: hasLive ? "running" : "idle",
      currentTask: "Bid optimization pass",
      stage: "Tune",
      confidence: 85,
      risk: "medium",
      connectedPlatforms: ["meta", "google", "tiktok"],
      runtime: "2m 10s",
      eta: "1m 20s",
      tasks: ["Bid optimization", "Audience refinement"],
      reasoning: "CPL rose 19% — audience fatigue detected on broad segment.",
      actionsTimeline: [
        { time: "09:10", action: "Shifted 20% budget to retargeting", result: "ROAS +0.4", risk: "medium", rollback: true },
      ],
    },
    {
      key: "retargeting",
      label: "Retargeting Agent",
      status: "idle",
      currentTask: "Queue empty",
      stage: "—",
      confidence: 0,
      risk: "low",
      connectedPlatforms: ["meta"],
      runtime: "—",
      eta: null,
      tasks: [],
      reasoning: "24 warm visitors ready — deploy when tracking validated.",
      actionsTimeline: [],
    },
    {
      key: "creative",
      label: "Creative Agent",
      status: "idle",
      currentTask: "Awaiting brief",
      stage: "—",
      confidence: 0,
      risk: "low",
      connectedPlatforms: ["meta", "google"],
      runtime: "—",
      eta: null,
      tasks: ["Creative testing"],
      reasoning: "Variant B outperforming — hold scale until A/B completes.",
      actionsTimeline: [],
    },
    {
      key: "analytics",
      label: "Analytics Agent",
      status: hasLive ? "running" : "idle",
      currentTask: "Pixel validation",
      stage: "Validate",
      confidence: 94,
      risk: "low",
      connectedPlatforms: ["meta", "google"],
      runtime: "45s",
      eta: "20s",
      tasks: ["Pixel validation", "Event loss scan"],
      reasoning: "Purchase events firing — lead event match rate 96%.",
      actionsTimeline: [],
    },
    {
      key: "compliance",
      label: "Compliance Agent",
      status: "idle",
      currentTask: "Policy scan idle",
      stage: "—",
      confidence: 100,
      risk: "low",
      connectedPlatforms: [],
      runtime: "—",
      eta: null,
      tasks: [],
      reasoning: "No policy flags on active creatives.",
      actionsTimeline: [],
    },
    {
      key: "tracking",
      label: "Tracking Agent",
      status: hasLive ? "running" : "idle",
      currentTask: "CAPI health check",
      stage: "Monitor",
      confidence: 91,
      risk: "low",
      connectedPlatforms: ["meta"],
      runtime: "12s",
      eta: null,
      tasks: ["Pixel validation"],
      reasoning: "Event loss within guardrails (4%).",
      actionsTimeline: [],
    },
    {
      key: "crm",
      label: "CRM Agent",
      status: "idle",
      currentTask: "Lead sync standby",
      stage: "—",
      confidence: 0,
      risk: "low",
      connectedPlatforms: [],
      runtime: "—",
      eta: null,
      tasks: ["Lead routing"],
      reasoning: "New leads route to pipeline when ads fire conversion events.",
      actionsTimeline: [],
    },
  ];
}

export function buildAdopsPayload(input: {
  businessName: string;
  accounts: AdAccountRow[];
  campaigns: AdCampaignRow[];
  zernioAccounts?: ZernioAccount[];
  hasWinningAd?: boolean;
  winningAdMeta?: AdopsPagePayload["winningAdMeta"];
}): AdopsPagePayload {
  let zernioAccounts = input.zernioAccounts ?? [];
  const zernioRow = input.accounts.find((a) => a.platform === "zernio");
  if (!zernioAccounts.length && zernioRow && isAdAccountRowConnected(zernioRow)) {
    zernioAccounts = zernioAccountsFromAdAccountMeta(zernioRow.meta);
  }
  const zernioLinkedPlatforms: AdopsPlatformId[] = [];
  const liveCampaigns = buildLiveCampaignRows(input.campaigns, input.businessName);
  const totalSpend = liveCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = liveCampaigns.reduce((s, c) => s + c.leads, 0);

  const accountStatus: AdopsPagePayload["accountStatus"] = {} as AdopsPagePayload["accountStatus"];
  const platformHealth: Record<AdopsPlatformId, PlatformHealth> = {} as Record<AdopsPlatformId, PlatformHealth>;

  for (const p of ADOPS_PLATFORMS) {
    const acct = p.mapsToRepo
      ? input.accounts.find((a) => a.platform === p.mapsToRepo)
      : undefined;
    const viaZernio = adopsPlatformLinkedViaZernio(p.id, zernioAccounts);
    if (viaZernio) {
      zernioLinkedPlatforms.push(p.id);
    }
    const oauthStatus = acct?.status ?? "disconnected";
    accountStatus[p.id] =
      oauthStatus === "connected" || oauthStatus === "pending"
        ? oauthStatus
        : viaZernio
          ? "connected"
          : "disconnected";
    platformHealth[p.id] =
      accountStatus[p.id] === "connected" || accountStatus[p.id] === "pending"
        ? viaZernio && oauthStatus === "disconnected"
          ? "healthy"
          : healthForAccount(acct)
        : "disconnected";
  }

  const connected = Object.values(accountStatus).filter(
    (s) => s === "connected" || s === "pending",
  ).length;

  const alerts: AdopsPagePayload["alerts"] = [];
  if (platformHealth.meta === "token_expiring") {
    alerts.push({ id: "meta-token", message: "Meta token expires in 2 days.", tone: "amber", href: "/dashboard/integrations" });
  }
  if (liveCampaigns.some((c) => c.aiHealth === "failed_tracking")) {
    alerts.push({ id: "tracking", message: "Tracking degraded — 27% event loss detected.", tone: "rose", href: "/dashboard/integrations" });
  }
  if (liveCampaigns.some((c) => c.status === "requires_approval")) {
    alerts.push({ id: "approval", message: "3 campaigns require approval.", tone: "violet", href: "/dashboard/approvals" });
  }
  if (connected === 0 && zernioAccounts.length === 0) {
    alerts.push({ id: "ads-missing", message: "Ad accounts not connected — estimated 18–32% more leads left on table.", tone: "amber", href: "/dashboard/integrations" });
  } else if (zernioLinkedPlatforms.length > 0 && connected > 0) {
    alerts.push({
      id: "zernio-linked",
      message: `${zernioLinkedPlatforms.length} platform${zernioLinkedPlatforms.length === 1 ? "" : "s"} linked via Zernio — manage apps on Integrations.`,
      tone: "cyan",
      href: "/dashboard/integrations?focus=zernio",
    });
  } else if (totalLeads > 0) {
    alerts.push({ id: "scale", message: "AI found +18% scale opportunity on top campaign.", tone: "cyan", href: "/dashboard/optimization" });
  }

  const globalFeed = ADOPS_PLATFORMS.flatMap((p) => buildSyntheticFeed(p.id)).slice(0, 8);

  return {
    businessName: input.businessName,
    platforms: ADOPS_PLATFORMS,
    platformHealth,
    accountStatus,
    liveCampaigns,
    agents: buildAdopsAgents(liveCampaigns),
    globalFeed,
    rollup: {
      connected,
      activeCampaigns: liveCampaigns.filter((c) => c.status === "live" || c.status === "running").length,
      totalSpend,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : null,
    },
    alerts,
    hasWinningAd: input.hasWinningAd ?? false,
    winningAdMeta: input.winningAdMeta ?? null,
    policy: DEFAULT_SAFETY_POLICY,
    rawAccounts: input.accounts,
    rawCampaigns: input.campaigns,
    zernioAccounts,
    zernioLinkedPlatforms,
  };
}
