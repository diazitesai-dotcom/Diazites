"use server";

import { loadOperatorPlatformContext } from "@/lib/ai-operator/load-operator-context";
import { processOperatorMessageSmart } from "@/lib/ai-operator/llm-respond";
import { buildOperatorMcpContext } from "@/lib/ai-operator/operator-mcp-context";
import { getCurrentUserAccess } from "@/lib/access-control/access-control.service";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OperatorAssistantMessage, OperatorPlatformContext } from "@/types/ai-operator";

export async function getOperatorContextAction(
  pathname: string,
): Promise<OperatorPlatformContext> {
  return loadOperatorPlatformContext(pathname);
}

export async function sendOperatorMessageAction(
  message: string,
  pathname: string,
): Promise<OperatorAssistantMessage> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const platformCtx = await loadOperatorPlatformContext(pathname);

  const accessResult = await getCurrentUserAccess(
    supabase,
    user.id,
    user.email ?? null,
  );

  let mcpCtx = null;
  let businessId: string | null = null;

  if (accessResult.success && platformCtx.hasBusiness) {
    const resolved = await buildOperatorMcpContext(
      supabase,
      user.id,
      accessResult.data,
    );
    if (resolved.success) {
      mcpCtx = resolved.ctx;
      businessId = resolved.businessId;
    }
  }

  return processOperatorMessageSmart(
    supabase,
    mcpCtx,
    businessId,
    message,
    platformCtx,
  );
}
