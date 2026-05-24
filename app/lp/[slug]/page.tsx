import { notFound } from "next/navigation";

import { PublicLandingPage } from "@/components/funnel/public-landing-page";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getLandingPageBySlug } from "@/services/landing/landing-page.service";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublicLandingPageRoute({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const supabase = createServiceRoleClient();
  const result = await getLandingPageBySlug(supabase, slug);

  if (!result.success) notFound();

  const page = result.data as Record<string, unknown>;
  let version: Record<string, unknown> | null = null;

  if (page.active_version_id) {
    const { data } = await supabase
      .from("landing_page_versions")
      .select("*")
      .eq("id", page.active_version_id)
      .maybeSingle();
    version = data;
  }

  return (
    <PublicLandingPage
      page={page}
      version={version}
      utm={{
        source: typeof query.utm_source === "string" ? query.utm_source : undefined,
        medium: typeof query.utm_medium === "string" ? query.utm_medium : undefined,
        campaign: typeof query.utm_campaign === "string" ? query.utm_campaign : undefined,
      }}
    />
  );
}
