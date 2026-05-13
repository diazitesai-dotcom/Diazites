/**
 * Per-platform OAuth configuration for the Ads Engine.
 *
 * Each connector requires three env vars: an app id, an app secret, and a
 * redirect URL. They are intentionally NOT required at boot — connectors are
 * gated at runtime so the app still starts without them.
 */
export type AdsPlatform = "meta" | "google" | "tiktok" | "microsoft";

export type AdsPlatformConfig = {
  appId: string;
  appSecret: string;
  redirectUrl: string;
  authUrl: string;
  scopes: string[];
};

function get(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getAdsConfig(platform: AdsPlatform): AdsPlatformConfig | null {
  switch (platform) {
    case "meta": {
      const appId = get("META_APP_ID");
      const appSecret = get("META_APP_SECRET");
      const redirectUrl = get("META_REDIRECT_URL");
      if (!appId || !appSecret || !redirectUrl) return null;
      return {
        appId,
        appSecret,
        redirectUrl,
        authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
        scopes: ["ads_management", "ads_read", "business_management"],
      };
    }
    case "google": {
      const appId = get("GOOGLE_ADS_CLIENT_ID");
      const appSecret = get("GOOGLE_ADS_CLIENT_SECRET");
      const redirectUrl = get("GOOGLE_ADS_REDIRECT_URL");
      if (!appId || !appSecret || !redirectUrl) return null;
      return {
        appId,
        appSecret,
        redirectUrl,
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        scopes: ["https://www.googleapis.com/auth/adwords"],
      };
    }
    case "tiktok": {
      const appId = get("TIKTOK_APP_ID");
      const appSecret = get("TIKTOK_APP_SECRET");
      const redirectUrl = get("TIKTOK_REDIRECT_URL");
      if (!appId || !appSecret || !redirectUrl) return null;
      return {
        appId,
        appSecret,
        redirectUrl,
        authUrl: "https://www.tiktok.com/v2/auth/authorize",
        scopes: ["ad.read", "ad.write"],
      };
    }
    case "microsoft": {
      const appId = get("MICROSOFT_ADS_CLIENT_ID");
      const appSecret = get("MICROSOFT_ADS_CLIENT_SECRET");
      const redirectUrl = get("MICROSOFT_ADS_REDIRECT_URL");
      if (!appId || !appSecret || !redirectUrl) return null;
      return {
        appId,
        appSecret,
        redirectUrl,
        authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        scopes: ["https://ads.microsoft.com/msads.manage"],
      };
    }
  }
}

export function isAdsConfigured(platform: AdsPlatform): boolean {
  return getAdsConfig(platform) !== null;
}
