import { PageHeader } from "@/components/layout/page-header";
import { SettingsHubClient } from "@/components/settings/settings-hub-client";
import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createBusinessRepository } from "@/repositories/business.repository";
import { PLAN_ENTITLEMENT_CATALOG } from "@/lib/entitlements/plan-catalog";
import {
  getEntitlements,
  getUsage,
} from "@/services/entitlements/account-entitlements.service";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initialTab = typeof sp.tab === "string" ? sp.tab : undefined;
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          eyebrow="Settings"
          title="Workspace settings"
          description="Finish onboarding to configure agents, ads, voice, and integrations."
        />
      </div>
    );
  }

  const entRes = await getEntitlements(supabase, business.id);
  const ctx = entRes.success
    ? entRes.data
    : {
        businessId: business.id,
        planKey: "starter" as const,
        entitlements: PLAN_ENTITLEMENT_CATALOG.starter,
      };

  const usageSummary = await Promise.all([
    {
      label: "AI voice minutes",
      used: await getUsage(supabase, business.id, "ai_voice_minutes"),
      limit: ctx.entitlements.ai_voice_minutes?.int ?? null,
    },
    {
      label: "Outbound AI calls",
      used: await getUsage(supabase, business.id, "outbound_ai_calls"),
      limit: ctx.entitlements.outbound_ai_calls?.int ?? null,
    },
    {
      label: "Emails (month)",
      used: await getUsage(supabase, business.id, "emails_monthly"),
      limit: ctx.entitlements.emails_monthly?.int ?? null,
    },
    {
      label: "Contacts",
      used: await getUsage(supabase, business.id, "contacts"),
      limit: ctx.entitlements.contacts?.int ?? null,
    },
    {
      label: "Workflows",
      used: await getUsage(supabase, business.id, "workflows"),
      limit: ctx.entitlements.workflows?.int ?? null,
    },
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        description="Profile, workspace, AI agents, ads, voice, integrations, and billing."
      />
      <SettingsHubClient
        ctx={ctx}
        businessName={business.name}
        ownerEmail={user.email ?? null}
        usageSummary={usageSummary}
        initialTab={initialTab}
      />
    </div>
  );
}
