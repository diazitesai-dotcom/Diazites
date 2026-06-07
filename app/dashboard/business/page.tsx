import { GrowthModulePage } from "@/components/layout/growth-module-page";
import { CAMPAIGN_GOALS } from "@/lib/platform/growth-spec";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { BusinessProfile } from "@/types/platform-growth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BusinessContextPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  const profile = (business?.profile ?? {}) as BusinessProfile;

  return (
    <GrowthModulePage
      eyebrow="Business"
      title="Business context"
      description="The context your AI agents use — industry, audience, offer, goals, and lead routing."
      purposeTitle="Agent source of truth"
      purposeDescription="Update context here or re-run onboarding to refresh your growth system."
      primaryHref="/onboarding"
      primaryLabel="Update via onboarding"
    >
      {business ? (
        <Card className="border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-lg">{business.name}</CardTitle>
            <CardDescription>Workspace context for Mission Control and automations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <ContextField label="Industry" value={profile.industry} />
            <ContextField label="Business type" value={profile.businessType} />
            <ContextField label="Services / products" value={profile.mainServices ?? business.services} />
            <ContextField label="Target audience" value={profile.targetAudience} />
            <ContextField label="Ideal customer" value={profile.idealCustomer} />
            <ContextField label="Offer / CTA" value={profile.offerPromotion} />
            <ContextField
              label="Growth goal"
              value={CAMPAIGN_GOALS.find((g) => g.id === profile.campaignGoal)?.label}
            />
            <ContextField label="Brand voice" value={profile.brandTone} />
            <ContextField label="Geography" value={[business.city_state, business.service_area].filter(Boolean).join(" · ")} />
            <ContextField label="Website" value={business.website} />
            <ContextField label="Monthly budget" value={String(business.monthly_budget ?? "")} />
            <ContextField label="Lead notify email" value={profile.leadNotifyEmail} />
          </CardContent>
        </Card>
      ) : (
        <Link href="/onboarding" className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}>
          Complete onboarding
        </Link>
      )}
    </GrowthModulePage>
  );
}

function ContextField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value?.trim() ? value : "—"}</p>
    </div>
  );
}
