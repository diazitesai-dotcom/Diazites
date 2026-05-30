/**
 * App-side OAuth visibility. Buttons only render when the matching
 * NEXT_PUBLIC_* flag is set AND the provider is enabled in Supabase Auth.
 */

export const OAUTH_PROVIDER_IDS = ["google", "facebook"] as const;
export type OAuthProviderId = (typeof OAUTH_PROVIDER_IDS)[number];

export type OAuthProviderMeta = {
  id: OAuthProviderId;
  label: string;
  envKey: string;
  supabaseProviderName: OAuthProviderId;
};

export const OAUTH_PROVIDER_META: Record<OAuthProviderId, OAuthProviderMeta> = {
  google: {
    id: "google",
    label: "Google",
    envKey: "NEXT_PUBLIC_AUTH_PROVIDER_GOOGLE",
    supabaseProviderName: "google",
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    envKey: "NEXT_PUBLIC_AUTH_PROVIDER_FACEBOOK",
    supabaseProviderName: "facebook",
  },
};

function envFlagEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** Providers the app is allowed to show (set in .env.local). */
export function getConfiguredOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];
  if (envFlagEnabled(process.env.NEXT_PUBLIC_AUTH_PROVIDER_GOOGLE)) {
    providers.push("google");
  }
  if (envFlagEnabled(process.env.NEXT_PUBLIC_AUTH_PROVIDER_FACEBOOK)) {
    providers.push("facebook");
  }
  return providers;
}

export function hasConfiguredOAuthProviders(): boolean {
  return getConfiguredOAuthProviders().length > 0;
}

export function isOAuthProviderConfigured(id: OAuthProviderId): boolean {
  return getConfiguredOAuthProviders().includes(id);
}

/** OAuth redirect target; optional next/promo are passed as query params for /auth/callback. */
export function buildOAuthRedirectUrl(origin: string, params?: { next?: string; promo?: string }): string {
  const url = new URL(`${origin.replace(/\/$/, "")}/auth/callback`);
  if (params?.next) url.searchParams.set("next", params.next);
  if (params?.promo?.trim()) url.searchParams.set("promo", params.promo.trim());
  return url.toString();
}
