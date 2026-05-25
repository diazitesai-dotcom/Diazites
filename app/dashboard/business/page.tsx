import { GrowthModulePage } from "@/components/layout/growth-module-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CAMPAIGN_GOALS, CRM_PIPELINE_STAGES } from "@/lib/platform/growth-spec";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import type { BusinessProfile } from "@/types/platform-growth";

export default async function BusinessProfilePage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);
  const profile = (business?.profile ?? {}) as BusinessProfile;

  return (
    <GrowthModulePage
      eyebrow="Business setup"
      title="Business profile"
      description="All onboarding fields stored on your business record — agents and strategy read from this profile."
      purposeTitle="Brand & market context"
      purposeDescription="Edit services, audience, offers, goals, and notification targets. Logo upload uses Supabase Storage in Phase 2."
      phase={1}
      primaryHref="/onboarding"
      primaryLabel="Re-run onboarding"
    >
      {business ? (
        <Card className="border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-lg">{business.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <ProfileField label="Website" value={business.website} />
            <ProfileField label="Service area" value={business.service_area} />
            <ProfileField label="Industry" value={profile.industry} />
            <ProfileField label="Business type" value={profile.businessType} />
            <ProfileField label="Target audience" value={profile.targetAudience} />
            <ProfileField label="Ideal customer" value={profile.idealCustomer} />
            <ProfileField label="Offer" value={profile.offerPromotion} />
            <ProfileField
              label="Campaign goal"
              value={CAMPAIGN_GOALS.find((g) => g.id === profile.campaignGoal)?.label}
            />
            <ProfileField label="Brand tone" value={profile.brandTone} />
            <ProfileField label="Monthly budget" value={String(business.monthly_budget ?? "")} />
            <ProfileField label="Lead notify email" value={profile.leadNotifyEmail} />
            <ProfileField label="Existing CRM" value={profile.existingCrm} />
          </CardContent>
        </Card>
      ) : null}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-base">CRM pipeline stages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {CRM_PIPELINE_STAGES.map((s) => (
            <span
              key={s.id}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted-foreground"
            >
              {s.label}
            </span>
          ))}
        </CardContent>
      </Card>
    </GrowthModulePage>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value?.trim() ? value : "—"}</p>
    </div>
  );
}
