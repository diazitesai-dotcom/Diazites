import type {
  AgentCapabilityGroup,
  BudgetSafetyControls,
  GrowthIntegration,
  IntegrationCategory,
  IntegrationCategoryId,
} from "@/lib/integrations/integration-types";
import type { ConnectionStatus } from "@/lib/dashboard/mission-control-types";

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  { id: "paid_ads", label: "Paid Ads Platforms", description: "Search, social, and performance ads" },
  { id: "video_streaming", label: "Video / Streaming Ads", description: "CTV, audio, and streaming inventory" },
  { id: "ecommerce_retail", label: "Ecommerce / Retail Ads", description: "Marketplace and retail media" },
  { id: "native", label: "Native Advertising", description: "Content discovery networks" },
  { id: "programmatic", label: "Programmatic / DSP", description: "Demand-side platforms" },
  { id: "local_smb", label: "Local / SMB Ads", description: "Local service and community ads" },
  { id: "crm", label: "CRM Integrations", description: "Pipeline and lead management" },
  { id: "email_sms", label: "Email / SMS / Automation", description: "Outreach and lifecycle" },
  { id: "analytics", label: "Analytics / Tracking", description: "Attribution and event tracking" },
  { id: "ecommerce_payments", label: "Ecommerce / Payments", description: "Stores and payment rails" },
];

type PlatformDef = {
  id: string;
  name: string;
  categoryId: IntegrationCategoryId;
  agentType: GrowthIntegration["agentType"];
  subchannels?: string[];
  defaultStatus?: ConnectionStatus;
  endpoint?: string;
  docsUrl?: string;
  openApiSpecPath?: string;
};

const PLATFORMS: PlatformDef[] = [
  { id: "meta", name: "Meta Ads", categoryId: "paid_ads", agentType: "paid_ads", subchannels: ["Facebook", "Instagram", "Messenger", "WhatsApp"] },
  { id: "google_ads", name: "Google Ads", categoryId: "paid_ads", agentType: "google_youtube", subchannels: ["Search", "Display", "Shopping", "Performance Max", "YouTube", "Gmail", "Discovery", "Local Service Ads"] },
  {
    id: "openai_ads",
    name: "OpenAI Ads API",
    categoryId: "paid_ads",
    agentType: "paid_ads",
    subchannels: ["Campaigns", "Ad groups", "Ads", "Insights", "Uploads"],
    endpoint: "https://api.ads.openai.com/v1",
    docsUrl: "https://api.ads.openai.com/v1",
    openApiSpecPath: "/openapi/openai-ads-api.json",
  },
  { id: "microsoft_ads", name: "Microsoft Ads", categoryId: "paid_ads", agentType: "paid_ads", subchannels: ["Bing Search", "MSN", "Audience Network"] },
  { id: "tiktok_ads", name: "TikTok Ads", categoryId: "paid_ads", agentType: "tiktok" },
  { id: "linkedin_ads", name: "LinkedIn Ads", categoryId: "paid_ads", agentType: "linkedin" },
  { id: "x_ads", name: "X / Twitter Ads", categoryId: "paid_ads", agentType: "paid_ads" },
  { id: "snapchat_ads", name: "Snapchat Ads", categoryId: "paid_ads", agentType: "paid_ads" },
  { id: "pinterest_ads", name: "Pinterest Ads", categoryId: "paid_ads", agentType: "paid_ads" },
  { id: "reddit_ads", name: "Reddit Ads", categoryId: "paid_ads", agentType: "paid_ads" },
  { id: "quora_ads", name: "Quora Ads", categoryId: "paid_ads", agentType: "paid_ads" },
  { id: "youtube_ads", name: "YouTube Ads", categoryId: "video_streaming", agentType: "google_youtube" },
  { id: "hulu_ads", name: "Hulu Ads", categoryId: "video_streaming", agentType: "paid_ads" },
  { id: "roku_ads", name: "Roku Ads", categoryId: "video_streaming", agentType: "paid_ads" },
  { id: "amazon_prime_video", name: "Amazon Prime Video Ads", categoryId: "video_streaming", agentType: "paid_ads" },
  { id: "spotify_ads", name: "Spotify Ads", categoryId: "video_streaming", agentType: "paid_ads" },
  { id: "pandora_ads", name: "Pandora Ads", categoryId: "video_streaming", agentType: "paid_ads" },
  { id: "twitch_ads", name: "Twitch Ads", categoryId: "video_streaming", agentType: "paid_ads" },
  { id: "peacock_ads", name: "Peacock Ads", categoryId: "video_streaming", agentType: "paid_ads" },
  { id: "disney_espn", name: "Disney / ESPN Ads", categoryId: "video_streaming", agentType: "paid_ads" },
  { id: "amazon_ads", name: "Amazon Ads", categoryId: "ecommerce_retail", agentType: "ecommerce" },
  { id: "amazon_dsp", name: "Amazon DSP", categoryId: "ecommerce_retail", agentType: "paid_ads" },
  { id: "walmart_connect", name: "Walmart Connect", categoryId: "ecommerce_retail", agentType: "ecommerce" },
  { id: "etsy_ads", name: "Etsy Ads", categoryId: "ecommerce_retail", agentType: "ecommerce" },
  { id: "ebay_promoted", name: "eBay Promoted Listings", categoryId: "ecommerce_retail", agentType: "ecommerce" },
  { id: "shopify_audiences", name: "Shopify Audiences", categoryId: "ecommerce_retail", agentType: "ecommerce" },
  { id: "target_roundel", name: "Target Roundel", categoryId: "ecommerce_retail", agentType: "ecommerce" },
  { id: "instacart_ads", name: "Instacart Ads", categoryId: "ecommerce_retail", agentType: "ecommerce" },
  { id: "taboola", name: "Taboola", categoryId: "native", agentType: "paid_ads" },
  { id: "outbrain", name: "Outbrain", categoryId: "native", agentType: "paid_ads" },
  { id: "mgid", name: "MGID", categoryId: "native", agentType: "paid_ads" },
  { id: "revcontent", name: "Revcontent", categoryId: "native", agentType: "paid_ads" },
  { id: "trade_desk", name: "The Trade Desk", categoryId: "programmatic", agentType: "paid_ads" },
  { id: "dv360", name: "DV360", categoryId: "programmatic", agentType: "paid_ads" },
  { id: "stackadapt", name: "StackAdapt", categoryId: "programmatic", agentType: "paid_ads" },
  { id: "adroll", name: "AdRoll", categoryId: "programmatic", agentType: "paid_ads" },
  { id: "basis", name: "Basis Technologies", categoryId: "programmatic", agentType: "paid_ads" },
  { id: "yelp_ads", name: "Yelp Ads", categoryId: "local_smb", agentType: "paid_ads" },
  { id: "nextdoor_ads", name: "Nextdoor Ads", categoryId: "local_smb", agentType: "paid_ads" },
  { id: "thumbtack", name: "Thumbtack Ads", categoryId: "local_smb", agentType: "paid_ads" },
  { id: "angi", name: "Angi Ads", categoryId: "local_smb", agentType: "paid_ads" },
  { id: "alignable", name: "Alignable", categoryId: "local_smb", agentType: "paid_ads" },
  { id: "yellowpages", name: "Yellow Pages Digital", categoryId: "local_smb", agentType: "paid_ads" },
  { id: "facebook_marketplace", name: "Facebook Marketplace", categoryId: "local_smb", agentType: "paid_ads", subchannels: ["Listings", "Local leads", "Messaging"] },
  { id: "craigslist", name: "Craigslist", categoryId: "local_smb", agentType: "paid_ads", subchannels: ["Classifieds", "Local reach"] },
  { id: "hubspot", name: "HubSpot", categoryId: "crm", agentType: "crm" },
  { id: "ghl", name: "GoHighLevel", categoryId: "crm", agentType: "crm" },
  { id: "salesforce", name: "Salesforce", categoryId: "crm", agentType: "crm" },
  { id: "zoho", name: "Zoho CRM", categoryId: "crm", agentType: "crm" },
  { id: "pipedrive", name: "Pipedrive", categoryId: "crm", agentType: "crm" },
  { id: "monday_crm", name: "Monday CRM", categoryId: "crm", agentType: "crm" },
  { id: "close_crm", name: "Close CRM", categoryId: "crm", agentType: "crm" },
  { id: "mailchimp", name: "Mailchimp", categoryId: "email_sms", agentType: "email_sms" },
  { id: "klaviyo", name: "Klaviyo", categoryId: "email_sms", agentType: "email_sms" },
  { id: "activecampaign", name: "ActiveCampaign", categoryId: "email_sms", agentType: "email_sms" },
  { id: "brevo", name: "Brevo", categoryId: "email_sms", agentType: "email_sms" },
  { id: "sendgrid", name: "SendGrid", categoryId: "email_sms", agentType: "email_sms", defaultStatus: "expired" },
  { id: "twilio", name: "Twilio", categoryId: "email_sms", agentType: "email_sms" },
  { id: "postscript", name: "Postscript", categoryId: "email_sms", agentType: "email_sms" },
  { id: "attentive", name: "Attentive", categoryId: "email_sms", agentType: "email_sms" },
  { id: "ga4", name: "Google Analytics 4", categoryId: "analytics", agentType: "analytics", defaultStatus: "needs_attention" },
  { id: "gtm", name: "Google Tag Manager", categoryId: "analytics", agentType: "analytics" },
  { id: "meta_pixel", name: "Meta Pixel", categoryId: "analytics", agentType: "analytics", defaultStatus: "error" },
  { id: "tiktok_pixel", name: "TikTok Pixel", categoryId: "analytics", agentType: "analytics" },
  { id: "linkedin_insight", name: "LinkedIn Insight Tag", categoryId: "analytics", agentType: "analytics" },
  { id: "microsoft_uet", name: "Microsoft UET", categoryId: "analytics", agentType: "analytics" },
  { id: "hotjar", name: "Hotjar", categoryId: "analytics", agentType: "analytics" },
  { id: "mixpanel", name: "Mixpanel", categoryId: "analytics", agentType: "analytics" },
  { id: "posthog", name: "PostHog", categoryId: "analytics", agentType: "analytics" },
  { id: "segment", name: "Segment", categoryId: "analytics", agentType: "analytics" },
  { id: "shopify", name: "Shopify", categoryId: "ecommerce_payments", agentType: "ecommerce" },
  { id: "woocommerce", name: "WooCommerce", categoryId: "ecommerce_payments", agentType: "ecommerce" },
  { id: "bigcommerce", name: "BigCommerce", categoryId: "ecommerce_payments", agentType: "ecommerce" },
  { id: "magento", name: "Magento", categoryId: "ecommerce_payments", agentType: "ecommerce" },
  { id: "stripe", name: "Stripe", categoryId: "ecommerce_payments", agentType: "ecommerce" },
  { id: "square", name: "Square", categoryId: "ecommerce_payments", agentType: "ecommerce" },
  { id: "paypal", name: "PayPal", categoryId: "ecommerce_payments", agentType: "ecommerce" },
];

export const GROWTH_INTEGRATION_IDS = new Set(PLATFORMS.map((p) => p.id));

/** Starter accounts: Meta + Google Ads only until more channels are enabled. */
export const STARTER_INTEGRATION_IDS = new Set(["meta", "google_ads"]);

/** Demo-only defaults — paid ads must use real OAuth/API connections */
const CONNECTED_BY_DEFAULT = new Set<string>([]);

export const AGENT_CAPABILITY_GROUPS: AgentCapabilityGroup[] = [
  {
    agentType: "paid_ads",
    label: "Paid Ads Agent",
    capabilities: [
      "Launch campaigns",
      "Pause campaigns",
      "Adjust budgets",
      "Create audiences",
      "Build retargeting campaigns",
      "Analyze ROAS",
      "Detect underperforming ads",
      "Recommend creative changes",
      "Run A/B tests",
      "Optimize bids",
    ],
  },
  {
    agentType: "google_youtube",
    label: "Google / YouTube Agent",
    capabilities: [
      "Keyword research",
      "Search term cleanup",
      "Performance Max tuning",
      "Video campaign deployment",
      "Bid optimization",
      "Conversion tracking validation",
    ],
  },
  {
    agentType: "tiktok",
    label: "TikTok Agent",
    capabilities: [
      "Creative testing",
      "Trend-based targeting",
      "Spark Ads support",
      "Audience expansion",
      "Budget pacing",
      "TikTok Pixel validation",
    ],
  },
  {
    agentType: "linkedin",
    label: "LinkedIn Agent",
    capabilities: [
      "B2B targeting",
      "Lead Gen Forms",
      "Account-based marketing",
      "Retargeting",
      "Sponsored content management",
    ],
  },
  {
    agentType: "crm",
    label: "CRM Agent",
    capabilities: [
      "Sync leads",
      "Score leads",
      "Assign leads",
      "Update pipeline stages",
      "Trigger follow-up automations",
      "Detect duplicate contacts",
      "Track deal value",
    ],
  },
  {
    agentType: "email_sms",
    label: "Email / SMS Agent",
    capabilities: [
      "Send follow-up sequences",
      "Draft messages",
      "Trigger abandoned lead campaigns",
      "Monitor deliverability",
      "Retry failed sends",
      "Personalize outreach",
    ],
  },
  {
    agentType: "analytics",
    label: "Analytics / Tracking Agent",
    capabilities: [
      "Validate pixels",
      "Detect missing events",
      "Track conversions",
      "Monitor attribution",
      "Identify broken UTMs",
      "Show event loss percentage",
      "Recommend fixes",
    ],
  },
  {
    agentType: "ecommerce",
    label: "Ecommerce Agent",
    capabilities: [
      "Track purchases",
      "Sync customer data",
      "Monitor abandoned carts",
      "Analyze product performance",
      "Trigger retargeting audiences",
      "Connect revenue to campaigns",
    ],
  },
];

export const DEFAULT_BUDGET_CONTROLS: BudgetSafetyControls = {
  dailySpendCap: "$25/day",
  campaignSpendCap: "$100/campaign",
  approvalThreshold: "Require approval over $100",
  autoPauseCplSpike: true,
  autoPauseRoasDrop: true,
  alertFailedTracking: true,
  alertDisconnectedAccount: true,
};

function resolveStatus(
  id: string,
  connectedIds: Set<string>,
  defaultStatus?: ConnectionStatus,
): ConnectionStatus {
  if (connectedIds.has(id)) return "connected";
  if (defaultStatus) return defaultStatus;
  if (CONNECTED_BY_DEFAULT.has(id)) return "connected";
  return "missing";
}

export function buildGrowthIntegrations(
  connectedIds: Set<string> = new Set(),
  options?: { starterOnly?: boolean },
): GrowthIntegration[] {
  const platformDefs = options?.starterOnly
    ? PLATFORMS.filter((p) => STARTER_INTEGRATION_IDS.has(p.id))
    : PLATFORMS;

  return platformDefs.map((p) => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    subchannels: p.subchannels,
    agentType: p.agentType,
    status: resolveStatus(p.id, connectedIds, p.defaultStatus),
    agentPermissions: connectedIds.has(p.id) || CONNECTED_BY_DEFAULT.has(p.id) ? "requires_approval" : "read_only",
    lastSync: connectedIds.has(p.id) || CONNECTED_BY_DEFAULT.has(p.id) ? "2 min ago" : null,
    dataAccess: connectedIds.has(p.id) || CONNECTED_BY_DEFAULT.has(p.id) ? "Read + write (scoped)" : "Not connected",
    connectedCampaigns: p.agentType === "paid_ads" || p.agentType === "google_youtube" ? (connectedIds.has(p.id) ? 2 : 0) : undefined,
    endpoint: p.endpoint,
    docsUrl: p.docsUrl,
    openApiSpecPath: p.openApiSpecPath,
  }));
}

export function integrationHealthScore(integrations: GrowthIntegration[]): number {
  const connected = integrations.filter((i) => i.status === "connected").length;
  const critical = integrations.filter(
    (i) => i.status === "error" || i.status === "expired" || i.status === "needs_attention",
  ).length;
  const base = Math.round((connected / Math.max(integrations.length, 1)) * 100);
  return Math.max(0, Math.min(100, base - critical * 3));
}

export function criticalMissingConnections(integrations: GrowthIntegration[]): string[] {
  const criticalIds = ["meta", "google_ads"];
  return criticalIds
    .filter((id) => {
      const row = integrations.find((i) => i.id === id);
      return row && row.status !== "connected";
    })
    .map((id) => integrations.find((i) => i.id === id)?.name ?? id);
}
