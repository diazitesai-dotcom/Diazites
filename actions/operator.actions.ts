"use server";

import { loadOperatorPlatformContext } from "@/lib/ai-operator/load-operator-context";
import { processOperatorMessage } from "@/lib/ai-operator/respond";
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
  const ctx = await loadOperatorPlatformContext(pathname);
  return processOperatorMessage(message, ctx);
}
