/**
 * @deprecated Import from `@/services/ai/message-generation.service` for typed results.
 * Kept for backward compatibility with existing imports.
 */
import { generateAIMessage } from "@/services/ai/message-generation.service";

export async function generateLeadFollowUp(input: {
  leadName: string;
  roofingNeed: string;
  businessName: string;
}) {
  const result = await generateAIMessage({
    leadName: input.leadName,
    roofingNeed: input.roofingNeed,
    businessName: input.businessName,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data.body;
}
