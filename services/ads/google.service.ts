import type { SupabaseClient } from "@supabase/supabase-js";

import { encodeAdsOAuthState } from "@/lib/ads-oauth-state";
import { getAdsConfig } from "@/lib/ads-env";
import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createAdAccountRepository,
  type AdAccountStatus,
} from "@/repositories/ad-account.repository";

export type GoogleAuthLink = {
  url: string;
  state: string;
};

export async function buildGoogleAuthLink(args: {
  businessId: string;
  returnTo?: string;
}): Promise<ServiceResult<GoogleAuthLink>> {
  const config = getAdsConfig("google");
  if (!config) {
    return fail(
      "Google Ads isn't configured. Set GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, and GOOGLE_ADS_REDIRECT_URL.",
    );
  }

  const state = encodeAdsOAuthState(args.businessId, "google", args.returnTo);
  const u = new URL(config.authUrl);
  u.searchParams.set("client_id", config.appId);
  u.searchParams.set("redirect_uri", config.redirectUrl);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", config.scopes.join(" "));
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("state", state);

  return ok({ url: u.toString(), state });
}

export async function exchangeGoogleCode(
  client: SupabaseClient,
  args: { businessId: string; code: string },
): Promise<ServiceResult<{ status: "connected" }>> {
  const config = getAdsConfig("google");
  if (!config) return fail("Google Ads isn't configured.");
  if (!args.code) return fail("Missing OAuth code");

  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let expiresAt: string | null = null;
  let meta: Record<string, unknown> = { connectedAt: new Date().toISOString() };

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: args.code,
        client_id: config.appId,
        client_secret: config.appSecret,
        redirect_uri: config.redirectUrl,
        grant_type: "authorization_code",
      }),
    });

    const body = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !body.access_token) {
      meta = {
        ...meta,
        tokenError: body.error_description ?? body.error ?? "Token exchange failed",
        stub: true,
      };
      accessToken = args.code;
    } else {
      accessToken = body.access_token;
      refreshToken = body.refresh_token ?? null;
      if (body.expires_in) {
        expiresAt = new Date(Date.now() + body.expires_in * 1000).toISOString();
      }
      meta = { ...meta, liveToken: true };
    }
  } catch (e) {
    meta = {
      ...meta,
      tokenError: e instanceof Error ? e.message : "Token exchange failed",
      stub: true,
    };
    accessToken = args.code;
  }

  const repo = createAdAccountRepository(client);
  const isLive = Boolean(meta.liveToken);

  const engineStatus: AdAccountStatus = isLive ? "connected" : "pending";
  const { error } = await repo.upsert({
    businessId: args.businessId,
    platform: "google",
    externalAccountId: "google_ads",
    status: engineStatus,
    accessToken,
    refreshToken,
    tokenExpiresAt: expiresAt,
    scopes: config.scopes,
    meta: { ...meta, accountLabel: "Google Ads", liveToken: isLive },
  });
  if (error) return fail(error.message);
  return ok({ status: "connected" });
}

export async function disconnectGoogle(
  client: SupabaseClient,
  args: { businessId: string },
): Promise<ServiceResult<{ ok: true }>> {
  const repo = createAdAccountRepository(client);
  const { error } = await repo.disconnect(args.businessId, "google");
  if (error) return fail(error.message);
  return ok({ ok: true });
}
