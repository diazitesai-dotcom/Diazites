"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ExternalLink, KeyRound, Plug, RefreshCw } from "lucide-react";

import {
  connectZernioWithApiKeyAction,
  disconnectZernioAction,
  listZernioAccountsAction,
  listZernioCampaignsAction,
  testZernioConnectionAction,
} from "@/services/integrations/zernio.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";
import type { LinkedAdAccount } from "@/lib/integrations/integration-connect-config";

type ZernioIntegrationPanelProps = {
  linkedAccount: LinkedAdAccount | null;
  panelMode: "overview" | "connect" | "manage";
  onPanelModeChange: (mode: "overview" | "connect" | "manage") => void;
  onMessage: (msg: string) => void;
};

export function ZernioIntegrationPanel({
  linkedAccount,
  panelMode,
  onPanelModeChange,
  onMessage,
}: ZernioIntegrationPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [connectedApps, setConnectedApps] = useState<
    Array<{ id: string; platform: string; label: string; status?: string }>
  >([]);
  const [campaigns, setCampaigns] = useState<
    Array<{ _id?: string; name?: string; status?: string; platform?: string }>
  >([]);
  const [loadedApps, setLoadedApps] = useState(false);

  const isConnected = Boolean(linkedAccount);

  function refreshConnectedApps() {
    startTransition(async () => {
      const res = await listZernioAccountsAction();
      if (!res.success) {
        onMessage(res.error);
        return;
      }
      setConnectedApps(res.data);
      setLoadedApps(true);
      onMessage(
        res.data.length > 0
          ? `${res.data.length} connected app(s) via Zernio.`
          : "API key valid — connect social accounts in your Zernio dashboard first.",
      );
    });
  }

  useEffect(() => {
    if (isConnected && panelMode === "manage" && !loadedApps) {
      refreshConnectedApps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, panelMode]);

  function testConnection() {
    startTransition(async () => {
      const res = await testZernioConnectionAction();
      if (!res.success) {
        onMessage(res.error);
        return;
      }
      onMessage(
        `Connection OK — ${res.data.accountCount} app account(s) available in Zernio.`,
      );
    });
  }

  function loadCampaigns() {
    startTransition(async () => {
      const res = await listZernioCampaignsAction();
      if (!res.success) {
        onMessage(res.error);
        return;
      }
      setCampaigns(res.data);
      onMessage(`Loaded ${res.data.length} campaign(s) from Zernio.`);
    });
  }

  function connectKey(formData: FormData) {
    startTransition(async () => {
      const res = await connectZernioWithApiKeyAction(formData);
      if (!res.success) {
        onMessage(res.error);
        return;
      }
      onMessage(
        `Zernio connected — ${res.data?.accountCount ?? 0} app account(s) detected.`,
      );
      onPanelModeChange("manage");
      router.refresh();
    });
  }

  function disconnect() {
    startTransition(async () => {
      const res = await disconnectZernioAction();
      if (!res.success) {
        onMessage(res.error);
        return;
      }
      setConnectedApps([]);
      setCampaigns([]);
      setLoadedApps(false);
      onMessage("Zernio disconnected.");
      onPanelModeChange("overview");
      router.refresh();
    });
  }

  if (panelMode === "connect" || (!isConnected && panelMode === "overview")) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Zernio connects Diazites to Facebook, Instagram, TikTok, LinkedIn, and more. Paste your
          API key from{" "}
          <a
            href="https://docs.zernio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-300 underline"
          >
            Zernio
          </a>
          , then link apps in the Zernio dashboard. Agents and Campaign Ops use this key to run and
          manage ads.
        </p>
        <form
          className="space-y-3 rounded-xl border border-dashed border-white/10 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            connectKey(new FormData(e.currentTarget));
          }}
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <KeyRound className="size-3.5" />
            Zernio API key
          </p>
          <div className="space-y-2">
            <Label htmlFor="zernio-hub-api-key">API key (sk_…)</Label>
            <Input
              id="zernio-hub-api-key"
              name="api_key"
              type="password"
              placeholder="sk_…"
              required
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full rounded-xl" disabled={pending}>
            Save & connect
          </Button>
        </form>
        {isConnected ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={() => onPanelModeChange("manage")}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg border-white/10"
          disabled={pending}
          onClick={testConnection}
        >
          Test connection
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg border-white/10"
          disabled={pending}
          onClick={refreshConnectedApps}
        >
          <RefreshCw className={cn("mr-1 size-3.5", pending && "animate-spin")} />
          Refresh apps
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg border-white/10"
          disabled={pending}
          onClick={loadCampaigns}
        >
          Load campaigns
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg border-white/10"
          onClick={() => onPanelModeChange("connect")}
        >
          Update API key
        </Button>
        <Link
          href={ROUTES.campaignOps}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-medium hover:bg-white/5"
        >
          <Plug className="size-3.5" />
          Campaign Ops
          <ExternalLink className="size-3 opacity-60" />
        </Link>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Connected applications
        </p>
        {connectedApps.length === 0 ? (
          <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-xs text-muted-foreground">
            {loadedApps
              ? "No apps linked in Zernio yet. Open Zernio and connect Facebook, Instagram, etc."
              : "Click Refresh apps to load connected platforms."}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/[0.06]">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead>Platform</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectedApps.map((app) => (
                  <TableRow key={app.id} className="border-border/60">
                    <TableCell className="capitalize">{app.platform}</TableCell>
                    <TableCell className="font-medium">{app.label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.status ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {campaigns.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ad campaigns (Zernio)
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-white/[0.06] p-3 text-xs text-muted-foreground">
            {campaigns.map((c, i) => (
              <li key={c._id ?? i}>
                <span className="font-medium text-foreground">{c.name ?? "Campaign"}</span>
                {" · "}
                {c.platform ?? "—"} · {c.status ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-rose-300"
        disabled={pending}
        onClick={disconnect}
      >
        Disconnect Zernio
      </Button>
    </div>
  );
}
