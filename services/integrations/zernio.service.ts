import { fail, ok, type ServiceResult } from "@/lib/result";
import {
  createPost,
  listAccounts,
  listAdCampaigns,
  verifyApiKey,
  type ZernioCreatePostInput,
  type ZernioPlatform,
} from "@/lib/zernio";

function requireKey(apiKey: string | null | undefined): string {
  const key = apiKey?.trim();
  if (!key) {
    throw new Error(
      "Zernio is not connected. Add your API key on Integrations → Zernio (next to Google Ads).",
    );
  }
  return key;
}

export async function testZernioConnection(
  apiKey?: string | null,
): Promise<ServiceResult<{ profileCount: number; accountCount: number }>> {
  try {
    const key = requireKey(apiKey);
    const res = await verifyApiKey(key);
    return ok({ profileCount: res.accountCount, accountCount: res.accountCount });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Zernio connection failed");
  }
}

export async function listZernioAdCampaigns(
  apiKey?: string | null,
): Promise<ServiceResult<Awaited<ReturnType<typeof listAdCampaigns>>>> {
  try {
    const key = requireKey(apiKey);
    return ok(await listAdCampaigns(key));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list campaigns");
  }
}

export async function publishZernioPost(
  input: {
    content: string;
    targets: Array<{ platform: string; accountId: string }>;
    mode: "now" | "scheduled" | "draft";
    scheduledFor?: string;
  },
  apiKey?: string | null,
): Promise<ServiceResult<{ postId: string }>> {
  try {
    const key = requireKey(apiKey);
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

    const post = await createPost(key, body);
    return ok({ postId: post._id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Publish failed");
  }
}

export async function listZernioAccountsForUi(
  apiKey?: string | null,
): Promise<ServiceResult<Array<{ id: string; platform: string; label: string; status?: string }>>> {
  try {
    const key = requireKey(apiKey);
    const accounts = await listAccounts(key);
    return ok(
      accounts.map((a) => ({
        id: a._id,
        platform: a.platform,
        label: a.displayName ?? a.username ?? a.platform,
        status: a.status,
      })),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list connected apps");
  }
}
