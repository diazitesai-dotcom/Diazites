"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  CreditCard,
  Megaphone,
  Phone,
  Plug,
  User,
  Webhook,
  Building2,
} from "lucide-react";

import { UpgradeRequiredDialog } from "@/components/upgrade/upgrade-required-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";
import { showUpgradeRequired } from "@/lib/entitlements/upgrade-messages";
import type { AccountEntitlementContext } from "@/types/entitlements";
import type { UpgradePromptContext } from "@/types/entitlements";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "agents", label: "AI Agents", icon: Bot },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "voice", label: "AI Voice", icon: Phone },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "zapier", label: "Zapier / API", icon: Webhook },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

type TabId = (typeof TABS)[number]["id"];

type AgentRow = {
  key: string;
  name: string;
  liteKey?: keyof AccountEntitlementContext["entitlements"];
  fullKey?: keyof AccountEntitlementContext["entitlements"];
  status: "active" | "locked";
};

function agentRows(ctx: AccountEntitlementContext): AgentRow[] {
  const e = ctx.entitlements;
  const lite = (k: keyof typeof e) => e[k]?.bool === true;
  return [
    {
      key: "lead_capture",
      name: "Lead Capture Agent",
      liteKey: "lead_capture_agent_lite",
      status: lite("lead_capture_agent_lite") ? "active" : "locked",
    },
    {
      key: "crm",
      name: "CRM Agent",
      liteKey: "crm_agent_lite",
      status: lite("crm_agent_lite") ? "active" : "locked",
    },
    {
      key: "follow_up",
      name: "Follow-Up Agent",
      liteKey: "follow_up_agent_lite",
      status: lite("follow_up_agent_lite") ? "active" : "locked",
    },
    {
      key: "ads",
      name: "Ads Agent",
      liteKey: "ads_agent_lite",
      fullKey: "ads_agent_full",
      status: lite("ads_agent_lite") ? "active" : "locked",
    },
    {
      key: "ai_voice",
      name: "AI Voice Agent",
      liteKey: "ai_voice_lite",
      status: lite("ai_voice_lite") ? "active" : "locked",
    },
    {
      key: "landing",
      name: "Landing Page Agent",
      status: "locked",
    },
    {
      key: "analytics",
      name: "Analytics Agent",
      status: e.analytics_advanced?.bool ? "active" : "locked",
    },
    {
      key: "merchant",
      name: "Merchant Agent",
      status: e.merchant_automation?.bool ? "active" : e.merchant_setup?.bool ? "active" : "locked",
    },
    {
      key: "tasks",
      name: "Project / Task Agent",
      status: "locked",
    },
  ];
}

type Props = {
  ctx: AccountEntitlementContext;
  businessName: string;
  ownerEmail: string | null;
  usageSummary: Array<{ label: string; used: number; limit: number | null }>;
};

export function SettingsHubClient({
  ctx,
  businessName,
  ownerEmail,
  usageSummary,
}: Props) {
  const [tab, setTab] = useState<TabId>("profile");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeCtx, setUpgradeCtx] = useState<UpgradePromptContext | null>(null);

  function promptUpgrade(feature: string) {
    setUpgradeCtx(showUpgradeRequired(feature));
    setUpgradeOpen(true);
  }

  const planLabel = ctx.planKey.charAt(0).toUpperCase() + ctx.planKey.slice(1);
  const adPlatformLimit = ctx.entitlements.ad_platforms?.int ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.08] pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                tab === t.id
                  ? "bg-violet-500/25 text-violet-100"
                  : "text-muted-foreground hover:bg-white/[0.04]",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" ? (
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Profile settings</CardTitle>
            <CardDescription>Name, email, password, and notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span> {ownerEmail ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Plan:</span> {planLabel}
            </p>
            <Link href={`${ROUTES.organization}?tab=settings`}>
              <Button variant="outline" size="sm" className="rounded-xl">
                Edit workspace profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {tab === "workspace" ? (
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Workspace settings</CardTitle>
            <CardDescription>Business name, website, industry, timezone, and brand.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="text-muted-foreground">Business:</span> {businessName}
            </p>
            <Link href={ROUTES.businessProfile} className="mt-4 inline-block">
              <Button variant="outline" size="sm" className="rounded-xl">
                Open business profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {tab === "agents" ? (
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>AI agent settings</CardTitle>
            <CardDescription>
              Starter includes the Growth Starter Stack — other agents unlock on upgrade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentRows(ctx).map((a) => (
              <div
                key={a.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3"
              >
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.status === "active" ? "Included in your plan" : "Upgrade to activate"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === "active" ? "default" : "secondary"}>
                    {a.status === "active" ? "Active" : "Locked"}
                  </Badge>
                  {a.status === "locked" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => promptUpgrade(a.fullKey ?? "ads_agent_full")}
                    >
                      Upgrade
                    </Button>
                  ) : (
                    <Link href={ROUTES.agents}>
                      <Button size="sm" variant="outline" className="rounded-lg">
                        Manage
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {tab === "ads" ? (
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Ads account settings</CardTitle>
            <CardDescription>
              Starter includes 1 ad platform — choose Meta or Google Ads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connected platforms: up to {adPlatformLimit} on {planLabel}. Campaign limit:{" "}
              {ctx.entitlements.campaigns?.int ?? "—"} · Spend monitored: $
              {(ctx.entitlements.ad_spend_monitored?.int ?? 0).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={ROUTES.integrationsHub}>
                <Button variant="outline" className="rounded-xl">
                  Connect Meta or Google
                </Button>
              </Link>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => promptUpgrade("ad_platforms")}
              >
                Add second platform
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "voice" ? (
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>AI Voice settings</CardTitle>
            <CardDescription>
              AI Voice Lite — {ctx.entitlements.ai_voice_minutes?.int ?? 0} minutes/mo ·{" "}
              {ctx.entitlements.outbound_ai_calls?.int ?? 0} outbound calls/mo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={ROUTES.aiCallCommandCenter}>
              <Button variant="outline" className="rounded-xl">
                Open AI Voice command center
              </Button>
            </Link>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => promptUpgrade("ai_voice_minutes")}
            >
              Need more minutes?
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === "integrations" ? (
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Stripe, email, calendar, and ad connections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Stripe", allowed: ctx.entitlements.merchant_setup?.bool },
              { name: "Google / Meta Ads", allowed: true },
              { name: "Email", allowed: true },
              { name: "Calendar", allowed: true },
              { name: "Zapier Basic", allowed: ctx.entitlements.zapier_basic?.bool },
              { name: "Webhooks / API keys", allowed: ctx.entitlements.external_api_access?.bool },
              { name: "MCP connectors", allowed: ctx.entitlements.mcp_connectors?.bool },
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
              >
                <span>{row.name}</span>
                {row.allowed ? (
                  <Badge>Available</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => promptUpgrade("external_api_access")}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            ))}
            <Link href={ROUTES.integrationsHub} className="mt-2 inline-block">
              <Button variant="outline" size="sm" className="rounded-xl">
                Integration hub
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {tab === "zapier" ? (
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Zapier / external API</CardTitle>
            <CardDescription>
              Starter includes Zapier Basic. Advanced API and MCP require Growth or Pro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ctx.entitlements.zapier_advanced?.bool ? (
              <p className="text-sm text-muted-foreground">Advanced integrations are enabled.</p>
            ) : (
              <Button variant="outline" onClick={() => promptUpgrade("zapier_advanced")}>
                Unlock advanced integrations
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "billing" ? (
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Billing & upgrade</CardTitle>
            <CardDescription>Current plan: {planLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {usageSummary.map((u) => (
                <li key={u.label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{u.label}</span>
                  <span className="tabular-nums">
                    {u.used} / {u.limit == null ? "∞" : u.limit}
                  </span>
                </li>
              ))}
            </ul>
            <Link href={`${ROUTES.organization}?tab=billing`}>
              <Button variant="gradient" className="rounded-xl">
                Manage billing & upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <UpgradeRequiredDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        context={upgradeCtx}
      />
    </div>
  );
}
