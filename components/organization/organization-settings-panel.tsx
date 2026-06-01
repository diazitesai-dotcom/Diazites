import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RevenueAttributionSettings } from "@/components/organization/revenue-attribution-settings";
import type { BusinessProfile } from "@/types/platform-growth";

export function OrganizationSettingsPanel({
  businessId,
  profile,
  appUrl,
}: {
  businessId: string;
  profile: BusinessProfile;
  appUrl: string;
}) {
  return (
    <div className="space-y-8">
      <RevenueAttributionSettings
        businessId={businessId}
        profile={profile}
        appUrl={appUrl}
      />

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">Connected services</CardTitle>
          <CardDescription>
            Link Meta, Google Ads, and Zernio so agents can run and manage campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`${ROUTES.integrationsHub}?focus=zernio`}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-white/10")}
          >
            Open Integrations hub
          </Link>
        </CardContent>
      </Card>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">Workspace settings</CardTitle>
          <CardDescription>
            Notifications, routing preferences, and operator contact channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <Label htmlFor="lead-alerts" className="text-sm font-medium">
              Lead alerts
            </Label>
            <Switch id="lead-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <Label htmlFor="ai-follow-up" className="text-sm font-medium">
              Automatic AI follow-up
            </Label>
            <Switch id="ai-follow-up" defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">Support email</Label>
            <Input id="support-email" defaultValue="owner@diazites.com" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
