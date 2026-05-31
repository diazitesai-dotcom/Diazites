import type { RevenueSourcePlatform } from "@/types/revenue-attribution";

export type SourceDefinition = {
  id: string;
  name: string;
  platform: RevenueSourcePlatform;
  paid: boolean;
};

/** Canonical traffic / revenue sources for attribution rollups. */
export const REVENUE_SOURCE_CATALOG: SourceDefinition[] = [
  { id: "meta_ads", name: "Meta Ads", platform: "meta", paid: true },
  { id: "google_ads", name: "Google Ads", platform: "google", paid: true },
  { id: "youtube_ads", name: "YouTube Ads", platform: "youtube", paid: true },
  { id: "tiktok_ads", name: "TikTok Ads", platform: "tiktok", paid: true },
  { id: "bing_ads", name: "Microsoft / Bing Ads", platform: "bing", paid: true },
  { id: "linkedin_ads", name: "LinkedIn Ads", platform: "linkedin", paid: true },
  { id: "organic", name: "Organic Traffic", platform: "organic", paid: false },
  { id: "direct", name: "Direct Traffic", platform: "direct", paid: false },
  { id: "referral", name: "Referral Traffic", platform: "referral", paid: false },
  { id: "email", name: "Email", platform: "email", paid: false },
  { id: "ai_follow_up", name: "AI Follow-Up Agent", platform: "ai_follow_up", paid: false },
  { id: "retargeting", name: "Retargeting Agent", platform: "retargeting", paid: true },
  { id: "manual_sales", name: "Manual Sales", platform: "manual", paid: false },
  { id: "crm", name: "CRM Closed Deals", platform: "crm", paid: false },
  { id: "stripe", name: "Stripe", platform: "stripe", paid: false },
  { id: "shopify", name: "Shopify", platform: "shopify", paid: false },
  { id: "square", name: "Square", platform: "square", paid: false },
  { id: "quickbooks", name: "QuickBooks", platform: "quickbooks", paid: false },
];

export function mapLeadSourceToCatalogId(source: string | null | undefined): string {
  const s = (source ?? "").toLowerCase();
  if (s.includes("meta") || s.includes("facebook") || s.includes("instagram")) return "meta_ads";
  if (s.includes("google")) return "google_ads";
  if (s.includes("youtube")) return "youtube_ads";
  if (s.includes("tiktok")) return "tiktok_ads";
  if (s.includes("bing") || s.includes("microsoft")) return "bing_ads";
  if (s.includes("linkedin")) return "linkedin_ads";
  if (s.includes("retarget")) return "retargeting";
  if (s.includes("follow") || s.includes("agent:ai_follow")) return "ai_follow_up";
  if (s.includes("email")) return "email";
  if (s.includes("twilio")) return "email";
  if (s.includes("referral")) return "referral";
  if (s.includes("direct")) return "direct";
  if (s.includes("stripe")) return "stripe";
  if (s.includes("shopify")) return "shopify";
  if (s.includes("square")) return "square";
  if (s.includes("quickbooks")) return "quickbooks";
  if (s.includes("manual") || s.includes("import")) return "manual_sales";
  if (s.startsWith("landing:") || s.includes("organic") || s === "web" || s === "form")
    return "organic";
  if (s.includes("crm")) return "crm";
  return "organic";
}

export function mapCampaignPlatform(platform: string): RevenueSourcePlatform {
  const p = platform.toLowerCase();
  if (p.includes("meta") || p.includes("facebook")) return "meta";
  if (p.includes("google")) return "google";
  if (p.includes("tiktok")) return "tiktok";
  if (p.includes("bing") || p.includes("microsoft")) return "bing";
  if (p.includes("linkedin")) return "linkedin";
  if (p.includes("youtube")) return "youtube";
  return "other";
}
