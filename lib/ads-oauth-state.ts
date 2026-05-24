import type { AdsPlatform } from "@/lib/ads-env";

type OAuthStatePayload = {
  b: string;
  p: AdsPlatform;
  t: number;
};

export function encodeAdsOAuthState(businessId: string, platform: AdsPlatform): string {
  const payload: OAuthStatePayload = { b: businessId, p: platform, t: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeAdsOAuthState(
  state: string,
): { businessId: string; platform: AdsPlatform } | null {
  try {
    const raw = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!raw?.b || !raw?.p) return null;
    if (!["meta", "google", "tiktok", "microsoft"].includes(raw.p)) return null;
    return { businessId: raw.b, platform: raw.p };
  } catch {
    return null;
  }
}
