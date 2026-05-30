import { getPublicAppUrl } from "@/lib/env";

/** Shown in Supabase email templates via user metadata and Resend messages. */
export const AUTH_BRAND = {
  platformName: "Diazites AI",
  productName: "Diazites",
  tagline: "AI Growth Operating System",
  supportEmail: "support@diazites.com",
  fromName: "Diazites AI",
} as const;

export const DEFAULT_TRIAL_DAYS_SIGNUP = 14;

export function authCallbackUrl(nextPath = "/onboarding?welcome=trial"): string {
  const base = getPublicAppUrl();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function signupEmailRedirectUrl(): string {
  return authCallbackUrl("/onboarding?welcome=trial");
}
