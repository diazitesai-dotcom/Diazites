import type { AdsPlatform } from "@/lib/ads-env";

type OAuthStatePayload = {
  b: string;
  p: AdsPlatform;
  t: number;
  /** Post-auth redirect path (must be validated when decoded) */
  r?: string;
};

export function encodeAdsOAuthState(
  businessId: string,
  platform: AdsPlatform,
  returnTo?: string,
): string {
  const payload: OAuthStatePayload = { b: businessId, p: platform, t: Date.now() };
  if (returnTo) payload.r = returnTo;
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/** Safe internal paths only — blocks open redirects */
export function sanitizeAppReturnPath(
  path: string | undefined,
  fallback = "/dashboard/campaign-ops",
): string {
  if (!path || !path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.includes("://")) return fallback;
  const pathname = path.split("?")[0] ?? "";
  if (
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/admin")
  ) {
    return fallback;
  }
  return path;
}

export function sanitizeOAuthReturnPath(path: string | undefined): string {
  return sanitizeAppReturnPath(path, "/dashboard/campaign-ops");
}

export function decodeAdsOAuthState(state: string): {
  businessId: string;
  platform: AdsPlatform;
  returnTo: string;
} | null {
  try {
    const raw = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!raw?.b || !raw?.p) return null;
    if (!["meta", "google", "tiktok", "microsoft"].includes(raw.p)) return null;
    return {
      businessId: raw.b,
      platform: raw.p,
      returnTo: sanitizeOAuthReturnPath(raw.r),
    };
  } catch {
    return null;
  }
}
