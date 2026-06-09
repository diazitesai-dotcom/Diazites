"use server";

import { revalidatePath } from "next/cache";

import { requireBusinessContext } from "@/lib/auth/business-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTrackingConnectSpec } from "@/lib/integrations/tracking-connect";
import { connectTrackingIntegration } from "@/services/integrations/tracking-connect.service";
import { createAdAccountRepository } from "@/repositories/ad-account.repository";

export async function connectTrackingIntegrationAction(input: {
  integrationId: string;
  value: string;
  accountName?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const ctxResult = await requireBusinessContext(supabase);
  if (!ctxResult.ok) {
    return { ok: false as const, error: ctxResult.error };
  }

  const result = await connectTrackingIntegration(
    supabase,
    ctxResult.ctx.userId,
    ctxResult.ctx.businessId,
    input.integrationId,
    input.value,
    input.accountName,
  );

  if (!result.success) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/campaign-ops");
  revalidatePath("/dashboard");
  return { ok: true as const, data: result.data };
}

export async function disconnectTrackingIntegrationAction(integrationId: string) {
  const supabase = await createServerSupabaseClient();
  const ctxResult = await requireBusinessContext(supabase);
  if (!ctxResult.ok) {
    return { ok: false as const, error: ctxResult.error };
  }

  const spec = getTrackingConnectSpec(integrationId);
  if (!spec) {
    return { ok: false as const, error: "Unsupported tracking integration." };
  }

  const repo = createAdAccountRepository(supabase);
  const { error } = await repo.disconnect(ctxResult.ctx.businessId, spec.platform);
  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/integrations");
  return { ok: true as const };
}
