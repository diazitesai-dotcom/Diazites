"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Bot } from "lucide-react";

import { deactivateMerchantAdminAction } from "@/actions/merchant.actions";
import { updateAccountAdminAction } from "@/actions/platform-admin.actions";
import { USAGE_METRIC_LABELS } from "@/lib/admin/platform-account-utils";
import { HIDDEN_USAGE_METRIC_KEYS } from "@/lib/billing/plans";
import { DIAZITES_PLANS } from "@/lib/billing/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { PlatformAiActivityRow } from "@/services/admin/platform-accounts.service";
import {
  FEATURE_FLAG_LABELS,
  HIDDEN_PLATFORM_FEATURE_FLAGS,
  type PlatformAccountView,
  type PlatformFeatureFlags,
} from "@/types/platform-admin";

type Props = {
  account: PlatformAccountView;
  aiActivity: PlatformAiActivityRow[];
};

const LIMIT_KEYS = [
  "ai_call_minutes",
  "email_sent",
  "workflows_active",
  "ai_agents",
  "ad_accounts",
] as const;

export function PlatformAccountDetailClient({ account, aiActivity }: Props) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const [planName, setPlanName] = useState(account.planName);
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    account.subscriptionStatus ?? "active",
  );
  const [status, setStatus] = useState(account.status);
  const [adminNotes, setAdminNotes] = useState("");
  const [flags, setFlags] = useState<PlatformFeatureFlags>({ ...account.featureFlags });
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const k of LIMIT_KEYS) {
      const v = account.usageLimitOverrides[k] ?? account.usageLimits[k];
      init[k] = v == null ? "" : String(v);
    }
    return init;
  });

  const usageRows = Object.entries(account.currentUsage)
    .filter(([key]) => !HIDDEN_USAGE_METRIC_KEYS.includes(key))
    .map(([key, qty]) => ({
    key,
    label: USAGE_METRIC_LABELS[key] ?? key,
    qty,
    limit: account.usageLimits[key],
  }));

  function toggleFlag(key: keyof PlatformFeatureFlags) {
    setFlags((f) => ({ ...f, [key]: !f[key] }));
  }

  function saveAccount() {
    startTransition(async () => {
      const patch: Parameters<typeof updateAccountAdminAction>[1] = {
        status,
        planName,
        subscriptionStatus,
        featureFlags: flags,
        adminNotes: adminNotes.trim() || undefined,
        whiteLabelEnabled: flags.white_label,
      };
      if (limits.ai_call_minutes) patch.aiCallMinutes = Number(limits.ai_call_minutes);
      if (limits.email_sent) patch.emailsPerMonth = Number(limits.email_sent);
      if (limits.workflows_active) patch.workflowsActive = Number(limits.workflows_active);
      if (limits.ai_agents) patch.aiAgents = Number(limits.ai_agents);
      if (limits.ad_accounts) patch.adAccounts = Number(limits.ad_accounts);

      const res = await updateAccountAdminAction(account.businessId, patch);
      setMessage(res.success ? "Account updated." : res.error);
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/accounts"
          className="inline-flex h-8 items-center rounded-md px-3 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          All accounts
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{account.businessName}</h1>
          <p className="text-sm text-muted-foreground">{account.ownerEmail ?? account.ownerUserId}</p>
        </div>
        <Badge className="ml-auto capitalize">{account.accountType.replace("_", " ")}</Badge>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardDescription>Plan</CardDescription>
            <CardTitle className="text-base">{account.planName}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardDescription>Subscription</CardDescription>
            <CardTitle className="text-base capitalize">
              {account.subscriptionStatus ?? "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardDescription>Sub-accounts</CardDescription>
            <CardTitle className="text-base">{account.subAccountCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardDescription>AI activity (7d)</CardDescription>
            <CardTitle className="text-base">{account.recentAiActivityCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Account & billing</CardTitle>
            <CardDescription>Plans, trial, subscription, and platform status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={planName} onValueChange={(v) => v && setPlanName(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAZITES_PLANS.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subscription status</Label>
                <Select
                  value={subscriptionStatus}
                  onValueChange={(v) => v && setSubscriptionStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["trialing", "active", "past_due", "canceled", "unpaid", "paused"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["active", "approved", "pending", "suspended"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Parent agency</dt>
                <dd>{account.parentAgencyName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Promo code</dt>
                <dd>{account.promoCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Billing status</dt>
                <dd className="capitalize">{account.billingStatus ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Merchant</dt>
                <dd className="capitalize">{account.merchantStatus ?? "not activated"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(account.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last login</dt>
                <dd>
                  {account.lastLoginAt
                    ? new Date(account.lastLoginAt).toLocaleString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Team members</dt>
                <dd>{account.teamMemberCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Trial ends</dt>
                <dd>
                  {account.trialEndsAt
                    ? new Date(account.trialEndsAt).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
            </dl>
            <div className="space-y-2">
              <Label>Admin notes</Label>
              <Textarea
                rows={3}
                placeholder="Internal notes for Diazites operators"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={pending} onClick={saveAccount}>
                Save changes
              </Button>
              {account.merchantStatus === "active" ? (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await deactivateMerchantAdminAction(account.businessId);
                      setMessage(res.success ? "Merchant deactivated." : res.error);
                    })
                  }
                >
                  Deactivate merchant
                </Button>
              ) : (
                <Link
                  href="/admin/merchant-services"
                  className="inline-flex h-8 items-center rounded-md border border-white/10 px-3 text-sm hover:bg-white/5"
                >
                  Merchant activation →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Feature access</CardTitle>
            <CardDescription>
              Toggle product modules: AI calls, email, workflows, agents, ads, white label.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(FEATURE_FLAG_LABELS) as (keyof PlatformFeatureFlags)[])
              .filter((key) => !HIDDEN_PLATFORM_FEATURE_FLAGS.includes(key))
              .map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between rounded-md border border-white/[0.06] px-3 py-2 text-sm"
              >
                <span>{FEATURE_FLAG_LABELS[key]}</span>
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={() => toggleFlag(key)}
                  className="h-4 w-4 rounded border-white/20"
                />
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Usage limits (override)</CardTitle>
          <CardDescription>
            Leave blank to use plan defaults. Values override monthly caps for this account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LIMIT_KEYS.map((key) => (
              <div key={key} className="space-y-2">
                <Label>{USAGE_METRIC_LABELS[key] ?? key}</Label>
                <Input
                  type="number"
                  placeholder={
                    account.usageLimits[key] == null
                      ? "Unlimited"
                      : String(account.usageLimits[key])
                  }
                  value={limits[key] ?? ""}
                  onChange={(e) => setLimits((l) => ({ ...l, [key]: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Used this period: {account.currentUsage[key] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Current usage</CardTitle>
        </CardHeader>
        <CardContent>
          {usageRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage recorded this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Limit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell>{r.label}</TableCell>
                    <TableCell>{r.qty}</TableCell>
                    <TableCell>{r.limit == null ? "∞" : r.limit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-400" />
            AI activity logs
          </CardTitle>
          <CardDescription>Recent agent actions for this business.</CardDescription>
        </CardHeader>
        <CardContent>
          {aiActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No AI activity logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiActivity.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{row.agent_key}</TableCell>
                    <TableCell>{row.action_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.entity_type ?? "—"}
                      {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
