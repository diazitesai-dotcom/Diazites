import type {
  EngineAgentDefinition,
  EngineDeploymentTarget,
  DeploymentGroupId,
} from "@/lib/engine/growth-engine-os-types";

export const ENGINE_DEPLOYMENT_GROUPS: { id: DeploymentGroupId; label: string }[] = [
  { id: "paid_ads", label: "Paid Ads" },
  { id: "crm", label: "CRM" },
  { id: "analytics", label: "Tracking / Analytics" },
  { id: "ecommerce", label: "Ecommerce / Payments" },
];

const TARGET_DEFS: Omit<EngineDeploymentTarget, "status" | "lastSync">[] = [
  { id: "meta", name: "Facebook / Instagram Ads", groupId: "paid_ads", permissions: ["ads_read", "ads_manage", "leads_access"] },
  { id: "google_ads", name: "Google Ads", groupId: "paid_ads", permissions: ["campaigns", "conversions", "budgets"] },
  { id: "youtube_ads", name: "YouTube Ads", groupId: "paid_ads", permissions: ["video_campaigns", "reporting"] },
  { id: "microsoft_ads", name: "Bing / Microsoft Ads", groupId: "paid_ads", permissions: ["search", "audience"] },
  { id: "tiktok_ads", name: "TikTok Ads", groupId: "paid_ads", permissions: ["creative", "pixel", "audiences"] },
  { id: "linkedin_ads", name: "LinkedIn Ads", groupId: "paid_ads", permissions: ["lead_gen", "sponsored"] },
  { id: "x_ads", name: "X / Twitter Ads", groupId: "paid_ads", permissions: ["promoted", "analytics"] },
  { id: "snapchat_ads", name: "Snapchat Ads", groupId: "paid_ads", permissions: ["stories", "app_events"] },
  { id: "pinterest_ads", name: "Pinterest Ads", groupId: "paid_ads", permissions: ["catalog", "conversions"] },
  { id: "reddit_ads", name: "Reddit Ads", groupId: "paid_ads", permissions: ["community", "targeting"] },
  { id: "amazon_ads", name: "Amazon Ads", groupId: "paid_ads", permissions: ["sponsored", "dsp"] },
  { id: "yelp_ads", name: "Yelp Ads", groupId: "paid_ads", permissions: ["local", "reviews"] },
  { id: "spotify_ads", name: "Spotify Ads", groupId: "paid_ads", permissions: ["audio", "podcast"] },
  { id: "hulu_ads", name: "Hulu Ads", groupId: "paid_ads", permissions: ["ctv", "streaming"] },
  { id: "taboola", name: "Taboola", groupId: "paid_ads", permissions: ["native", "publishers"] },
  { id: "outbrain", name: "Outbrain", groupId: "paid_ads", permissions: ["native", "content"] },
  { id: "ghl", name: "GoHighLevel", groupId: "crm", permissions: ["contacts", "pipelines", "workflows"] },
  { id: "hubspot", name: "HubSpot", groupId: "crm", permissions: ["deals", "contacts", "forms"] },
  { id: "salesforce", name: "Salesforce", groupId: "crm", permissions: ["leads", "opportunities"] },
  { id: "zoho", name: "Zoho CRM", groupId: "crm", permissions: ["leads", "automation"] },
  { id: "pipedrive", name: "Pipedrive", groupId: "crm", permissions: ["deals", "activities"] },
  { id: "monday_crm", name: "Monday CRM", groupId: "crm", permissions: ["boards", "automations"] },
  { id: "close_crm", name: "Close CRM", groupId: "crm", permissions: ["sequences", "calling"] },
  { id: "ga4", name: "Google Analytics 4", groupId: "analytics", permissions: ["events", "conversions"] },
  { id: "gtm", name: "Google Tag Manager", groupId: "analytics", permissions: ["tags", "triggers"] },
  { id: "meta_pixel", name: "Meta Pixel", groupId: "analytics", permissions: ["pixel", "capi"] },
  { id: "tiktok_pixel", name: "TikTok Pixel", groupId: "analytics", permissions: ["events", "catalog"] },
  { id: "linkedin_tag", name: "LinkedIn Insight Tag", groupId: "analytics", permissions: ["conversions"] },
  { id: "microsoft_uet", name: "Microsoft UET", groupId: "analytics", permissions: ["goals", "audiences"] },
  { id: "hotjar", name: "Hotjar", groupId: "analytics", permissions: ["heatmaps", "recordings"] },
  { id: "posthog", name: "PostHog", groupId: "analytics", permissions: ["product", "experiments"] },
  { id: "segment", name: "Segment", groupId: "analytics", permissions: ["routing", "destinations"] },
  { id: "shopify", name: "Shopify", groupId: "ecommerce", permissions: ["orders", "customers"] },
  { id: "woocommerce", name: "WooCommerce", groupId: "ecommerce", permissions: ["catalog", "checkout"] },
  { id: "bigcommerce", name: "BigCommerce", groupId: "ecommerce", permissions: ["store", "webhooks"] },
  { id: "stripe", name: "Stripe", groupId: "ecommerce", permissions: ["payments", "subscriptions"] },
  { id: "square", name: "Square", groupId: "ecommerce", permissions: ["pos", "invoices"] },
  { id: "paypal", name: "PayPal", groupId: "ecommerce", permissions: ["checkout", "reporting"] },
];

export const ENGINE_AGENTS: EngineAgentDefinition[] = [
  { key: "research", label: "Research Agent", purpose: "Market, competitor, and audience intelligence", tools: ["Web", "Analytics"], defaultEnabled: true, estimatedCostUsd: 0.45, riskLevel: "low" },
  { key: "offer", label: "Offer Agent", purpose: "Positioning, offer structure, and CTA strategy", tools: ["Research DB"], defaultEnabled: true, estimatedCostUsd: 0.35, riskLevel: "low" },
  { key: "funnel", label: "Funnel Agent", purpose: "Blueprint traffic → capture → nurture flows", tools: ["Funnel Builder"], defaultEnabled: true, estimatedCostUsd: 0.4, riskLevel: "low" },
  { key: "landing", label: "Landing Page Agent", purpose: "Generate, test, and deploy landing variants", tools: ["Landing Stack"], defaultEnabled: true, estimatedCostUsd: 0.55, riskLevel: "medium" },
  { key: "ads", label: "Ads Agent", purpose: "Campaign structure, budgets, and channel launch", tools: ["Meta", "Google", "TikTok"], defaultEnabled: true, estimatedCostUsd: 0.5, riskLevel: "high" },
  { key: "creative", label: "Creative Agent", purpose: "Ad copy, images, hooks, and variant generation", tools: ["Creative Suite"], defaultEnabled: true, estimatedCostUsd: 0.6, riskLevel: "medium" },
  { key: "crm", label: "CRM Agent", purpose: "Lead sync, scoring, pipeline updates", tools: ["HubSpot", "GHL"], defaultEnabled: true, estimatedCostUsd: 0.25, riskLevel: "medium" },
  { key: "followup", label: "Follow-Up Agent", purpose: "Email/SMS sequences and nurture timing", tools: ["Klaviyo", "Twilio"], defaultEnabled: true, estimatedCostUsd: 0.3, riskLevel: "medium" },
  { key: "analytics", label: "Analytics Agent", purpose: "Pixel validation, events, attribution", tools: ["GA4", "GTM", "Pixels"], defaultEnabled: true, estimatedCostUsd: 0.2, riskLevel: "low" },
  { key: "optimization", label: "Optimization Agent", purpose: "Budget shifts, creative fatigue, ROAS tuning", tools: ["Campaigns"], defaultEnabled: true, estimatedCostUsd: 0.4, riskLevel: "high" },
  { key: "retargeting", label: "Retargeting Agent", purpose: "Warm audience recapture and lookalikes", tools: ["Ads APIs"], defaultEnabled: false, estimatedCostUsd: 0.35, riskLevel: "high" },
  { key: "compliance", label: "Compliance Agent", purpose: "Ad policy, claims, and regional restrictions", tools: ["Policy KB"], defaultEnabled: false, estimatedCostUsd: 0.15, riskLevel: "low" },
];

export const STAGE_ACTIONS = [
  { id: "findings", label: "Open findings" },
  { id: "assets", label: "View generated assets" },
  { id: "regenerate", label: "Regenerate" },
  { id: "approve", label: "Approve" },
  { id: "reject", label: "Reject" },
  { id: "logs", label: "Open logs" },
  { id: "reasoning", label: "View AI reasoning" },
] as const;

export function buildEngineDeploymentTargets(connectedIds: Set<string>): EngineDeploymentTarget[] {
  return TARGET_DEFS.map((t) => ({
    ...t,
    status: connectedIds.has(t.id) ? "connected" : "missing",
    lastSync: connectedIds.has(t.id) ? "2m ago" : null,
  }));
}
