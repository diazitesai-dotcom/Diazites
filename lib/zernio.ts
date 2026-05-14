/**
 * Typed REST client for Zernio (https://docs.zernio.com/).
 *
 * Zernio is a broker over 14 social/ads platforms. Each Diazites business
 * stores one Zernio API key (in `ad_accounts.access_token` with
 * `platform = 'zernio'`); we never share keys between businesses.
 *
 * The client is intentionally minimal and stateless — it takes the key
 * per-call so the same module works across tenants.
 *
 * Base URL is configurable via `ZERNIO_API_BASE_URL` (default
 * https://zernio.com/api/v1).
 */

const DEFAULT_BASE = "https://zernio.com/api/v1";

export type ZernioPlatform =
  | "twitter"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "reddit"
  | "bluesky"
  | "threads"
  | "googlebusiness"
  | "telegram"
  | "snapchat"
  | "whatsapp"
  | "discord";

export type ZernioAccount = {
  _id: string;
  platform: ZernioPlatform;
  profileId?: string;
  username?: string;
  displayName?: string;
  status?: string;
};

export type ZernioProfile = {
  _id: string;
  name: string;
  description?: string;
};

export type ZernioPost = {
  _id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor?: string;
  publishedAt?: string;
};

export type ZernioCreatePostInput = {
  content: string;
  platforms: Array<{ platform: ZernioPlatform; accountId: string }>;
  scheduledFor?: string;
  timezone?: string;
  publishNow?: boolean;
  isDraft?: boolean;
  mediaUrls?: string[];
  title?: string;
};

export type ZernioAdCampaign = {
  _id: string;
  name: string;
  platform: string;
  status: string;
  spend?: number;
  clicks?: number;
  impressions?: number;
  leads?: number;
};

export class ZernioError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ZernioError";
  }
}

function baseUrl(): string {
  return (process.env.ZERNIO_API_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, "");
}

async function call<T>(
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const key = apiKey.trim();
  if (!key) {
    throw new ZernioError("Missing Zernio API key", 401, null);
  }
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : null) ??
      (body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : null) ??
      `Zernio request failed (${res.status})`;
    throw new ZernioError(message, res.status, body);
  }

  return body as T;
}

/**
 * Confirms the API key is valid. We call /accounts which is one of the
 * cheapest authenticated endpoints and always available regardless of
 * whether any social accounts have been connected yet.
 */
export async function verifyApiKey(apiKey: string): Promise<{
  ok: true;
  accountCount: number;
}> {
  const data = await call<{ accounts?: ZernioAccount[] }>(apiKey, "/accounts");
  return { ok: true, accountCount: (data.accounts ?? []).length };
}

export async function listAccounts(apiKey: string): Promise<ZernioAccount[]> {
  const data = await call<{ accounts?: ZernioAccount[] }>(apiKey, "/accounts");
  return data.accounts ?? [];
}

export async function listProfiles(apiKey: string): Promise<ZernioProfile[]> {
  const data = await call<{ profiles?: ZernioProfile[] }>(apiKey, "/profiles");
  return data.profiles ?? [];
}

export async function createProfile(
  apiKey: string,
  input: { name: string; description?: string },
): Promise<ZernioProfile> {
  const data = await call<{ profile: ZernioProfile }>(apiKey, "/profiles", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.profile;
}

export async function getConnectUrl(
  apiKey: string,
  args: { platform: ZernioPlatform; profileId: string },
): Promise<{ authUrl: string }> {
  const qs = new URLSearchParams({ profileId: args.profileId }).toString();
  const data = await call<{ authUrl: string }>(
    apiKey,
    `/connect/${encodeURIComponent(args.platform)}?${qs}`,
  );
  return { authUrl: data.authUrl };
}

export async function createPost(
  apiKey: string,
  input: ZernioCreatePostInput,
): Promise<ZernioPost> {
  const payload: Record<string, unknown> = {
    content: input.content,
    platforms: input.platforms,
  };
  if (input.scheduledFor) payload.scheduledFor = input.scheduledFor;
  if (input.timezone) payload.timezone = input.timezone;
  if (input.publishNow) payload.publishNow = true;
  if (input.isDraft) payload.isDraft = true;
  if (input.mediaUrls && input.mediaUrls.length > 0) payload.mediaUrls = input.mediaUrls;
  if (input.title) payload.title = input.title;

  const data = await call<{ post: ZernioPost }>(apiKey, "/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.post;
}

export async function listAdCampaigns(
  apiKey: string,
): Promise<ZernioAdCampaign[]> {
  const data = await call<{ campaigns?: ZernioAdCampaign[] }>(
    apiKey,
    "/ads/campaigns",
  );
  return data.campaigns ?? [];
}
