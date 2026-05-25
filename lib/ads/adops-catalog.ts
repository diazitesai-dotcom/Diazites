import type { AdopsPlatformDef } from "@/lib/ads/adops-types";

export const ADOPS_PLATFORMS: AdopsPlatformDef[] = [
  { id: "meta", label: "Meta", description: "Facebook, Instagram, Messenger", accent: "linear-gradient(135deg, #1877F2, #8A3FFC)", connectable: true, mapsToRepo: "meta" },
  { id: "google", label: "Google Ads", description: "Search, Display, Performance Max", accent: "linear-gradient(135deg, #4285F4, #34A853)", connectable: true, mapsToRepo: "google" },
  { id: "youtube", label: "YouTube", description: "Video campaigns via Google", accent: "linear-gradient(135deg, #FF0000, #CC0000)", connectable: false, mapsToRepo: "google" },
  { id: "tiktok", label: "TikTok", description: "Short-form video ads", accent: "linear-gradient(135deg, #25F4EE, #FE2C55)", connectable: false, mapsToRepo: "tiktok" },
  { id: "microsoft", label: "Microsoft / Bing", description: "Search + Audience Network", accent: "linear-gradient(135deg, #5E5E5E, #00A4EF)", connectable: false, mapsToRepo: "microsoft" },
  { id: "linkedin", label: "LinkedIn", description: "B2B sponsored content", accent: "linear-gradient(135deg, #0A66C2, #004182)", connectable: false },
  { id: "x", label: "X / Twitter", description: "Promoted posts", accent: "linear-gradient(135deg, #14171A, #657786)", connectable: false },
  { id: "pinterest", label: "Pinterest", description: "Visual discovery ads", accent: "linear-gradient(135deg, #E60023, #BD081C)", connectable: false },
  { id: "snapchat", label: "Snapchat", description: "Stories + AR lenses", accent: "linear-gradient(135deg, #FFFC00, #FFFC00)", connectable: false },
  { id: "reddit", label: "Reddit", description: "Community targeting", accent: "linear-gradient(135deg, #FF4500, #FF5700)", connectable: false },
  { id: "amazon", label: "Amazon Ads", description: "Sponsored products + DSP", accent: "linear-gradient(135deg, #FF9900, #232F3E)", connectable: false },
  { id: "spotify", label: "Spotify", description: "Audio + podcast ads", accent: "linear-gradient(135deg, #1DB954, #191414)", connectable: false },
  { id: "hulu", label: "Hulu", description: "CTV streaming inventory", accent: "linear-gradient(135deg, #1CE783, #0B0C0F)", connectable: false },
  { id: "taboola", label: "Taboola", description: "Native content discovery", accent: "linear-gradient(135deg, #2B65EC, #1A4FCC)", connectable: false },
  { id: "outbrain", label: "Outbrain", description: "Native amplification", accent: "linear-gradient(135deg, #FF6600, #EE5500)", connectable: false },
  { id: "yelp", label: "Yelp", description: "Local service ads", accent: "linear-gradient(135deg, #D32323, #AF1E1E)", connectable: false },
  { id: "nextdoor", label: "Nextdoor", description: "Neighborhood targeting", accent: "linear-gradient(135deg, #8ED500, #00B246)", connectable: false },
];

export const DEFAULT_SAFETY_POLICY = {
  dailySpendCap: 50,
  campaignSpendCap: 200,
  maxCpl: 120,
  minRoas: 1.5,
  approvalThresholdUsd: 75,
  pauseOnTrackingFailure: true,
  alertOnDisconnect: true,
  rollbackEnabled: true,
};
