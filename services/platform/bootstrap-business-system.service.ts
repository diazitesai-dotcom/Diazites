import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createBusinessRepository } from "@/repositories/business.repository";
import { formatNicheProvisionSummary, getNicheBlueprint } from "@/lib/niche/blueprints";
import { detectNiche } from "@/lib/niche/detect-niche";
import type { NicheProvisionInput } from "@/lib/niche/types";
import { provisionNicheCrmSystem } from "@/services/niche/provision-niche-crm.service";

export type BootstrapBusinessContext = NicheProvisionInput & {
  userGoal?: string;
};

/**
 * AI Workflow & CRM Builder — provisions niche-tailored pipelines, workflows,
 * stage automations, tags, tasks, and project board on workspace setup.
 */
export async function bootstrapBusinessSystem(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  userGoal: string,
  context?: BootstrapBusinessContext,
): Promise<ServiceResult<{ message: string; nicheDisplayName: string }>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const nicheInput: NicheProvisionInput = {
    industry: context?.industry,
    businessType: context?.businessType,
    services: context?.services,
    businessName: context?.businessName ?? business.name,
  };

  const detected = detectNiche(nicheInput);
  const provisioned = await provisionNicheCrmSystem(client, businessId, nicheInput);
  if (!provisioned.success) {
    return fail(provisioned.error ?? "CRM provisioning failed", provisioned.code);
  }

  const summary = formatNicheProvisionSummary(getNicheBlueprint(provisioned.data.nicheId));

  const goalNote = userGoal.trim() ? ` Goal: ${userGoal.slice(0, 80)}.` : "";

  return ok({
    nicheDisplayName: detected.displayName,
    message: `Detected niche: ${detected.displayName}. ${summary}.${goalNote} All systems are editable in Pipelines & Workflows.`,
  });
}
