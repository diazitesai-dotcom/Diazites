"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Plug,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { syncZernioCampaignsAction } from "@/services/ads/actions";
import {
  connectZernioAction,
  disconnectZernioAction,
  refreshZernioConnectionAction,
} from "@/services/integrations/zernio.actions";

export type ZernioConnectedAccountSummary = {
  id: string;
  platform: string;
  label: string;
};

type ZernioConnectorProps = {
  status: "disconnected" | "connected" | "error";
  accountCount: number;
  lastCheckedAt: string | null;
  errorMessage?: string;
  connectedAccounts: ZernioConnectedAccountSummary[];
};

const ZERNIO_GRADIENT = "linear-gradient(135deg, #6366F1, #A855F7)";

export function ZernioConnector({
  status,
  accountCount,
  lastCheckedAt,
  errorMessage,
  connectedAccounts,
}: ZernioConnectorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [syncing, startSync] = useTransition();
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  function handleSubmit(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      const res = await connectZernioAction(formData);
      if (!res.success) {
        setFeedback({ kind: "err", message: res.error });
        return;
      }
      setFeedback({
        kind: "ok",
        message: `Connected. Zernio sees ${res.data.accountCount} social account${res.data.accountCount === 1 ? "" : "s"}.`,
      });
      setApiKey("");
      router.refresh();
    });
  }

  function handleDisconnect() {
    setFeedback(null);
    startTransition(async () => {
      const res = await disconnectZernioAction();
      if (!res.success) {
        setFeedback({ kind: "err", message: res.error });
        return;
      }
      setFeedback({ kind: "ok", message: "Zernio disconnected." });
      router.refresh();
    });
  }

  function handleRefresh() {
    setFeedback(null);
    startRefresh(async () => {
      const res = await refreshZernioConnectionAction();
      if (!res.success) {
        setFeedback({ kind: "err", message: res.error });
        return;
      }
      setFeedback({
        kind: "ok",
        message:
          res.data.status === "connected"
            ? `Live. ${res.data.accountCount} social account${res.data.accountCount === 1 ? "" : "s"} visible.`
            : res.data.status === "error"
            ? `Zernio rejected the stored key: ${res.data.errorMessage ?? "unknown error"}`
            : "Zernio is disconnected.",
      });
      router.refresh();
    });
  }

  function handleSync() {
    setFeedback(null);
    startSync(async () => {
      const res = await syncZernioCampaignsAction();
      if (!res.success) {
        setFeedback({ kind: "err", message: res.error });
        return;
      }
      setFeedback({
        kind: "ok",
        message:
          `Synced ${res.data.campaignsFetched} campaign${res.data.campaignsFetched === 1 ? "" : "s"} (` +
          `${res.data.campaignsCreated} new, ${res.data.campaignsUpdated} updated) · ` +
          `$${res.data.totalSpendUsd.toFixed(2)} spend · ` +
          `${res.data.totalLeads} lead${res.data.totalLeads === 1 ? "" : "s"}.`,
      });
      router.refresh();
    });
  }

  const isConnected = status === "connected";
  const isError = status === "error";

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: ZERNIO_GRADIENT }}
              aria-hidden
            >
              <Plug className="size-5" />
            </span>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                Zernio
                <StatusBadge status={status} />
              </CardTitle>
              <CardDescription className="max-w-xl">
                Connect once with a Zernio API key and unlock posting + ads
                across 14 platforms (Meta, Instagram, LinkedIn, TikTok,
                YouTube, Google Business, etc.) without per-platform OAuth
                gymnastics. Used as the broker layer for the Growth Engine&apos;s
                Launch stage.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isConnected ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Status" value="Connected" tone="success" />
              <StatTile
                label="Social accounts"
                value={accountCount.toString()}
                tone="neutral"
              />
              <StatTile
                label="Last verified"
                value={
                  lastCheckedAt
                    ? new Date(lastCheckedAt).toLocaleTimeString()
                    : "—"
                }
                tone="neutral"
              />
            </div>

            {connectedAccounts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Visible accounts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {connectedAccounts.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/[0.08] px-2 py-0.5 text-[11px] font-medium text-violet-100"
                      title={a.id}
                    >
                      <span className="capitalize">{a.platform}</span>
                      <span className="text-violet-300/70">·</span>
                      <span className="text-violet-200/90">{a.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border/60 bg-background/30 px-3 py-2 text-xs text-muted-foreground">
                Zernio has no social accounts connected yet. Open{" "}
                <a
                  href="https://zernio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline decoration-dotted underline-offset-2"
                >
                  zernio.com
                </a>{" "}
                and connect at least one to start posting.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={refreshing}
                onClick={handleRefresh}
                className="rounded-xl"
              >
                <RefreshCw
                  className={cn(
                    "size-3.5",
                    refreshing && "animate-spin",
                  )}
                  aria-hidden
                />
                {refreshing ? "Refreshing…" : "Verify connection"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={syncing}
                onClick={handleSync}
                className="rounded-xl"
              >
                <RefreshCw
                  className={cn("size-3.5", syncing && "animate-spin")}
                  aria-hidden
                />
                {syncing ? "Syncing…" : "Sync ad metrics"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={handleDisconnect}
                className="rounded-xl"
              >
                {pending ? "Working…" : "Disconnect"}
              </Button>
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="zernio_api_key">Zernio API key</Label>
              <div className="relative">
                <Input
                  id="zernio_api_key"
                  name="api_key"
                  type={showKey ? "text" : "password"}
                  placeholder="sk_…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? (
                    <EyeOff className="size-3.5" aria-hidden />
                  ) : (
                    <Eye className="size-3.5" aria-hidden />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Keys start with <span className="font-mono">sk_</span>. We
                verify against Zernio before saving — invalid keys never get
                persisted.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                variant="gradient"
                disabled={pending || !apiKey.trim()}
              >
                {pending ? "Connecting…" : "Connect Zernio"}
              </Button>
              <a
                href="https://zernio.com/dashboard/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Get a key
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          </form>
        )}

        {isError && errorMessage ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Stored key is rejected by Zernio: {errorMessage}. Disconnect and
            paste a fresh key.
          </p>
        ) : null}

        {feedback ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-xs",
              feedback.kind === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {feedback.message}
          </p>
        ) : null}

        <details className="rounded-xl border border-border/40 bg-background/30 p-3 text-xs">
          <summary className="cursor-pointer font-medium text-foreground">
            How Zernio plugs into Diazites
          </summary>
          <ol className="mt-3 space-y-1.5 pl-4 text-muted-foreground [list-style:decimal]">
            <li>
              In Zernio, connect each social/ads account you want Diazites to
              be able to post or run ads through.
            </li>
            <li>
              Open{" "}
              <a
                href="https://zernio.com/dashboard/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline decoration-dotted underline-offset-2"
              >
                zernio.com / API Keys
              </a>{" "}
              and create a key. Copy it once — Zernio only shows it on
              creation.
            </li>
            <li>Paste the key above and click Connect.</li>
            <li>
              Once connected, the Growth Engine&apos;s Launch stage will be
              able to push the winning ad/post variant through Zernio instead
              of a per-platform stub.
            </li>
          </ol>
        </details>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: "disconnected" | "connected" | "error";
}) {
  const cls =
    status === "connected"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
      : status === "error"
      ? "border-destructive/40 bg-destructive/15 text-destructive"
      : "border-border/60 bg-muted/30 text-muted-foreground";
  const label =
    status === "connected"
      ? "Connected"
      : status === "error"
      ? "Error"
      : "Not connected";
  const Icon =
    status === "connected"
      ? CheckCircle2
      : status === "error"
      ? XCircle
      : Plug;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        cls,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card/40 px-3 py-2",
        tone === "success" ? "border-emerald-500/20" : "border-border/60",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight">{value}</p>
    </div>
  );
}
