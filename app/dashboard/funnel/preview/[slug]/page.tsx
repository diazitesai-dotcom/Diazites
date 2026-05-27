import { notFound } from "next/navigation";

import { LandingPageRenderer } from "@/components/public/landing-page-renderer";
import { requireAuth } from "@/lib/auth/session";
import { loadLandingPageDisplay } from "@/lib/landing/load-landing-display";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export default async function FunnelLandingPreviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) notFound();

  const loaded = await loadLandingPageDisplay(slug, { businessId: business.id });
  if (!loaded) notFound();

  return (
    <>
      <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100">
        Draft preview — only visible to you until you publish.
      </div>
      <LandingPageRenderer
        slug={slug}
        asset={loaded.asset}
        businessName={loaded.business?.name ?? loaded.asset.headline ?? null}
        location={
          loaded.landing.location
            ? String(loaded.landing.location)
            : loaded.business?.city_state ?? null
        }
      />
    </>
  );
}
