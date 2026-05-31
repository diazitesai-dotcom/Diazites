import type { SupabaseClient, User } from "@supabase/supabase-js";

import { provisionUserAccess } from "@/lib/access-control/access-control.service";
import { createUserProfile } from "@/lib/auth/user-profile";
import { ensureBootstrapPlatformAdmin } from "@/lib/auth/bootstrap-platform-admin";
import { createBusinessRepository } from "@/repositories/business.repository";
import { storeSignupPromoCode } from "@/services/billing/promo-code.service";
import { sendDiazitesWelcomeEmail } from "@/services/auth/welcome-email.service";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type PostAuthResult = {
  isNewUser: boolean;
  hasBusiness: boolean;
  redirectPath: string;
};

/**
 * Runs after OAuth or email-confirmation callback: profile, promo, welcome email.
 */
export async function completePostAuthSignup(
  client: SupabaseClient,
  user: User,
  options?: { promoCode?: string | null; defaultNext?: string },
): Promise<PostAuthResult> {
  const email = user.email ?? "";
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  await createUserProfile(client, {
    userId: user.id,
    email,
    fullName,
  });

  try {
    const service = createServiceRoleClient();
    await provisionUserAccess(service, user.id);
  } catch {
    /* best-effort — DB trigger also provisions */
  }

  const promoCode =
    options?.promoCode?.trim() ||
    (user.user_metadata?.promo_code as string | undefined)?.trim() ||
    "";

  if (promoCode) {
    try {
      const service = createServiceRoleClient();
      await storeSignupPromoCode(service, user.id, promoCode);
    } catch {
      /* best-effort */
    }
  }

  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  const hasBusiness = Boolean(business);

  const createdAt = new Date(user.created_at ?? 0).getTime();
  const isNewUser = Date.now() - createdAt < 1000 * 60 * 60 * 24;

  if (isNewUser && email) {
    await sendDiazitesWelcomeEmail({
      to: email,
      fullName,
      confirmationPending: false,
    });
  }

  await ensureBootstrapPlatformAdmin(user);

  const defaultNext = options?.defaultNext ?? "/onboarding?welcome=trial";
  const redirectPath = hasBusiness ? "/dashboard" : defaultNext;

  return { isNewUser, hasBusiness, redirectPath };
}
