import Link from "next/link";

import { FunnelBuilderClient } from "@/components/funnel/funnel-builder-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { loadFunnelPageData } from "@/lib/dashboard/load-funnel-page";

export default async function FunnelDashboardPage() {
  const { businessId, pages } = await loadFunnelPageData();

  if (!businessId) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Funnel Studio"
          title="AI landing pages"
          description="Generate three conversion-focused landing pages for your offer."
        />
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg">No business yet</CardTitle>
            <CardDescription>Finish onboarding to generate landing pages.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding" className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}>
              Onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initialPages = (pages as Array<Record<string, unknown>>).map((p) => {
    const slug = String(p.slug);
    const headline = String(p.headline ?? slug);
    const versions = (p.versions as Array<{ id: string }> | undefined) ?? [];
    const angle = inferAngleFromSlug(slug) ?? inferAngle(headline);
    return {
      landingPageId: String(p.id),
      slug,
      draftVersionId: String(p.active_version_id ?? versions[0]?.id ?? ""),
      angle,
      angleLabel: angleLabelFor(angle),
      headline,
      subheadline: String(p.subheadline ?? ""),
      published: Boolean(p.published),
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Funnel Studio"
        title="AI landing page generator"
        description="Describe your business — AI builds 3 unique landing pages you can preview and publish."
      />
      <FunnelBuilderClient initialPages={initialPages} />
    </div>
  );
}

function inferAngleFromSlug(slug: string): string | null {
  if (slug.includes("-urgency-")) return "urgency";
  if (slug.includes("-value-")) return "value";
  if (slug.includes("-trust-")) return "trust";
  return null;
}

function inferAngle(headline: string): string {
  const lower = headline.toLowerCase();
  if (/limited|spot|urgent|today|now|week/.test(lower)) return "urgency";
  if (/save|deal|value|price|guarantee/.test(lower)) return "value";
  return "trust";
}

function angleLabelFor(angle: string): string {
  if (angle === "urgency") return "Urgency & Scarcity";
  if (angle === "value") return "Offer & Value";
  return "Trust & Authority";
}
