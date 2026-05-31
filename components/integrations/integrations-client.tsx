"use client";

import { useState, useTransition } from "react";

import {
  connectAdAccountAction,
  disconnectAdAccountAction,
  listAgentPermissionsAction,
  syncAdAccountAction,
  testAdAccountAction,
  updateAgentPermissionAction,
} from "@/actions/marketing-os.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AGENT_PERMISSION_KEYS,
  PLATFORM_CAPABILITIES,
  type AdPlatform,
  type AgentPermissionKey,
} from "@/types/marketing-os";

type AdAccountRow = {
  id: string;
  platform: AdPlatform;
  account_name: string | null;
  connection_status: string;
  credentials_hint: string | null;
  last_sync_at: string | null;
  campaign_count: number | null;
  total_spend: number | null;
  total_leads: number | null;
  metadata: Record<string, unknown>;
};

type PermissionRow = {
  permission_key: AgentPermissionKey;
  granted: boolean;
  requires_approval?: boolean;
};

const PLATFORMS: { id: AdPlatform; label: string; credentialLabel: string }[] = [
  { id: "meta", label: "Meta Ads", credentialLabel: "Access token" },
  { id: "google", label: "Google Ads", credentialLabel: "OAuth refresh token" },
];

export function IntegrationsClient({
  initialAccounts,
  initialPermissions,
}: {
  initialAccounts: AdAccountRow[];
  initialPermissions: PermissionRow[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [permissions, setPermissions] = useState(initialPermissions);
  const [selectedPlatform, setSelectedPlatform] = useState<AdPlatform>("meta");
  const [credential, setCredential] = useState("");
  const [accountName, setAccountName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function refreshLists() {
    startTransition(async () => {
      const [acc, perms] = await Promise.all([
        (await import("@/actions/marketing-os.actions")).listAdAccountsAction(),
        listAgentPermissionsAction(),
      ]);
      if (acc.ok) setAccounts(acc.data as AdAccountRow[]);
      if (perms.ok) setPermissions(perms.data as PermissionRow[]);
    });
  }

  return (
    <div className="space-y-8">
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Connect ad account</CardTitle>
          <CardDescription>
            Credentials are encrypted at rest and never shown in full after saving. OAuth secured · workspace scoped · revocable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlatformGrid
            platforms={PLATFORMS}
            selected={selectedPlatform}
            onSelect={setSelectedPlatform}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Account name</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Main ad account" />
            </div>
            <div className="space-y-2">
              <Label>{PLATFORMS.find((p) => p.id === selectedPlatform)?.credentialLabel}</Label>
              <Input
                type="password"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Paste credential or webhook URL"
              />
            </div>
          </div>
          <Button
            disabled={pending || !credential.trim()}
            variant="gradient"
            className="rounded-xl"
            onClick={() => {
              startTransition(async () => {
                const result = await connectAdAccountAction({
                  platform: selectedPlatform,
                  accountName: accountName || undefined,
                  credentials: { token: credential.trim() },
                });
                setMessage(result.ok ? "Account connected." : result.error);
                if (result.ok) {
                  setCredential("");
                  refreshLists();
                }
              });
            }}
          >
            Connect {PLATFORMS.find((p) => p.id === selectedPlatform)?.label}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <AdAccountCard
            key={account.id}
            account={account}
            pending={pending}
            onTest={() => {
              startTransition(async () => {
                const result = await testAdAccountAction(account.id);
                setMessage(result.ok ? result.data.message : result.error);
                refreshLists();
              });
            }}
            onSync={() => {
              startTransition(async () => {
                const result = await syncAdAccountAction(account.id);
                setMessage(result.ok ? `Synced ${result.data.campaignCount} campaigns.` : result.error);
                refreshLists();
              });
            }}
            onDisconnect={() => {
              startTransition(async () => {
                const result = await disconnectAdAccountAction(account.id);
                setMessage(result.ok ? "Disconnected." : result.error);
                refreshLists();
              });
            }}
          />
        ))}
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Agent permissions</CardTitle>
          <CardDescription>Control what AI agents can do with connected ad accounts. Medium/high risk actions route to Approvals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {AGENT_PERMISSION_KEYS.map((key) => {
            const row = permissions.find((p) => p.permission_key === key);
            const granted = row?.granted ?? (key === "read_campaigns" || key === "pull_reports");
            return (
              <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{key.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {row?.requires_approval !== false ? "Requires approval for risky actions" : "Read-only"}
                  </p>
                </div>
                <Switch
                  checked={granted}
                  onCheckedChange={(checked) => {
                    startTransition(async () => {
                      await updateAgentPermissionAction({
                        permissionKey: key,
                        granted: checked,
                        requiresApproval: key !== "read_campaigns" && key !== "pull_reports",
                      });
                      refreshLists();
                    });
                  }}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}

function PlatformGrid({
  platforms,
  selected,
  onSelect,
}: {
  platforms: typeof PLATFORMS;
  selected: AdPlatform;
  onSelect: (p: AdPlatform) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((p) => (
        <Button
          key={p.id}
          type="button"
          size="sm"
          variant={selected === p.id ? "default" : "outline"}
          onClick={() => onSelect(p.id)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

function AdAccountCard({
  account,
  pending,
  onTest,
  onSync,
  onDisconnect,
}: {
  account: AdAccountRow;
  pending: boolean;
  onTest: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const caps = PLATFORM_CAPABILITIES[account.platform];
  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-base">{account.account_name ?? account.platform}</CardTitle>
        <CardDescription>
          Status: {account.connection_status} · hint {account.credentials_hint ?? "—"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>Campaigns: {account.campaign_count ?? 0} · Spend: ${Number(account.total_spend ?? 0).toFixed(0)} · Leads: {account.total_leads ?? 0}</p>
        <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <li>Lead ads: {caps.leadAds ? "yes" : "no"}</li>
          <li>Creative push: {caps.creativePush ? "yes" : "no"}</li>
          <li>Budget sync: {caps.budgetSync ? "yes" : "no"}</li>
          <li>Performance pull: {caps.performancePullback ? "yes" : "no"}</li>
        </ul>
        <AdAccountActions pending={pending} onTest={onTest} onSync={onSync} onDisconnect={onDisconnect} />
      </CardContent>
    </Card>
  );
}

function AdAccountActions({
  pending,
  onTest,
  onSync,
  onDisconnect,
}: {
  pending: boolean;
  onTest: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={onTest}>
        Test connection
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={onSync}>
        Sync campaigns
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={onDisconnect}>
        Disconnect
      </Button>
    </div>
  );
}
