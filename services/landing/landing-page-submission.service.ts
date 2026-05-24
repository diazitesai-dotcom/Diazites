import type { SupabaseClient } from "@supabase/supabase-js";

import { createLandingPageAnalyticsRepository } from "@/repositories/marketing-os.repository";
import { EVENT_TYPES } from "@/types/backend";

import { triggerEvent } from "@/services/events/event-dispatcher";

export async function recordLandingPageSubmission(
  client: SupabaseClient,
  input: {
    businessId: string;
    landingPageId: string;
    versionId?: string | null;
  },
): Promise<void> {
  const analytics = createLandingPageAnalyticsRepository(client);
  await analytics.recordSubmission(input);

  await triggerEvent(client, {
    type: EVENT_TYPES.LANDING_PAGE_SUBMISSION,
    businessId: input.businessId,
    payload: {
      landingPageId: input.landingPageId,
      versionId: input.versionId,
    },
  });
}
