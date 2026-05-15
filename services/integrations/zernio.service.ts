import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createPost,
  getZernioApiKeyFromEnv,
  isZernioConfigured,
  listAccounts,
  listAdCampaigns,
  verifyApiKey,
  type ZernioCreatePostInput,
  type ZernioPlatform,
} from "@/lib/zernio";

export async function testZernioConnection(): Promise<
  ServiceResult<{ profileCount: number }>
> {
  const key = getZernioApiKeyFromEnv();
  if (!key) {
    return fail("Set ZERNIO_API_KEY in your environment (from zernio.com/dashboard/api-keys).");
  }
  try {
    const res = await verifyApiKey(key);
    return ok({ profileCount: res.accountCount });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Zernio connection failed");
  }
}

export async function listZernioAdCampaigns(): Promise<
  ServiceResult<Awaited<ReturnType<typeof listAdCampaigns>>>
> {
  const key = getZernioApiKeyFromEnv();
  if (!key) return fail("ZERNIO_API_KEY is not configured.");
  try {
    return ok(await listAdCampaigns(key));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list campaigns");
  }
}

export async function publishZernioPost(input: {
  content: string;
  targets: Array<{ platform: string; accountId: string }>;
  mode: "now" | "scheduled" | "draft";
  scheduledFor?: string;
}): Promise<ServiceResult<{ postId: string }>> {
  const key = getZernioApiKeyFromEnv();
  if (!key) return fail("ZERNIO_API_KEY is not configured.");

  const body: ZernioCreatePostInput = {
    content: input.content,
    platforms: input.targets.map((t) => ({
      platform: t.platform as ZernioPlatform,
      accountId: t.accountId,
    })),
    timezone: "UTC",
  };
  if (input.mode === "now") body.publishNow = true;
  else if (input.mode === "draft") body.isDraft = true;
  else if (input.scheduledFor) body.scheduledFor = input.scheduledFor;

  try {
    const post = await createPost(key, body);
    return ok({ postId: post._id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Publish failed");
  }
}

export async function listZernioAccountsForUi(): Promise<
  ServiceResult<Array<{ id: string; platform: string; label: string }>>
> {
  const key = getZernioApiKeyFromEnv();
  if (!key) return fail("ZERNIO_API_KEY is not configured.");
  try {
    const accounts = await listAccounts(key);
    return ok(
      accounts.map((a) => ({
        id: a._id,
        platform: a.platform,
        label: a.displayName ?? a.username ?? a.platform,
      })),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list accounts");
  }
}

export { isZernioConfigured };
