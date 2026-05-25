"use client";

import { Suspense } from "react";

import { AdsCommandCenterClient } from "@/components/ads/adops/ads-command-center-client";
import { CampaignsTable } from "@/components/dashboard/campaigns-table";
import { ModulePurpose } from "@/components/layout/module-purpose";
import { PageHeader } from "@/components/layout/page-header";
import type { AdopsPagePayload } from "@/lib/ads/adops-types";
import type { CampaignRow } from "@/lib/dashboard/load-campaigns-page";

type CampaignOpsClientProps = {
  payload: AdopsPagePayload;
  registryCampaigns: CampaignRow[];
  zapierEvents: { type: string; label: string; description: string }[];
  zapierRules: { id: string; name: string; triggerEvent: string; url: string; enabled: boolean }[];
  zernioConfigured: boolean;
};

export function CampaignOpsClient({
  payload,
  registryCampaigns,
  zapierEvents,
  zapierRules,
  zernioConfigured,
}: CampaignOpsClientProps) {
  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-7xl space-y-4">
        <PageHeader
          eyebrow="Campaign Ops"
          title="Live campaign operations"
          description="Paid media command center — platforms, accounts, live campaigns, creative deployment, tracking, and autonomous agent optimization."
        />
        <ModulePurpose
          title="Operational flow"
          description="Connect platforms → deploy from Growth Engine → monitor live spend and ROAS → agents tune budgets, audiences, and creatives with approvals and rollback."
        />
      </div>

      <AdsCommandCenterClient
        payload={payload}
        zapierEvents={zapierEvents}
        zapierRules={zapierRules}
        zernioConfigured={zernioConfigured}
        embedded
      />

      <section className="mx-auto max-w-7xl space-y-3 pb-16">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Campaign registry
        </h2>
        <p className="text-xs text-muted-foreground">
          Historical and engine-deployed campaigns across all connected platforms.
        </p>
        <CampaignsTable campaigns={registryCampaigns} />
      </section>
    </div>
  );
}
