"use client";

import { useTransition } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

import {
  disconnectAdsPlatformAction,
  startAdsConnectAction,
} from "@/services/ads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdsPlatformId = "meta" | "google" | "tiktok" | "microsoft";

const ENV_HINTS: Record<AdsPlatformId, string> = {
  meta: "META_APP_ID, META_APP_SECRET, META_REDIRECT_URL",
  google: "GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REDIRECT_URL",
  tiktok: "TIKTOK_APP_ID, TIKTOK_APP_SECRET, TIKTOK_REDIRECT_URL",
  microsoft: "MICROSOFT_ADS_CLIENT_ID, MICROSOFT_ADS_CLIENT_SECRET, MICROSOFT_ADS_REDIRECT_URL",
};

const CONNECTABLE: AdsPlatformId[] = ["meta", "google"];

type PlatformCardProps = {
  platform: AdsPlatformId;
  label: string;
  description: string;
  configured: boolean;
  status: "disconnected" | "pending" | "connected" | "error";
  accent: string;
};

export function PlatformCard({
  platform,
  label,
  description,
  configured,
  status,
  accent,
}: PlatformCardProps) {
  const [isPending, startTransition] = useTransition();
  const canConnect = CONNECTABLE.includes(platform);

  function handleConnect() {
    if (!canConnect) return;
    startTransition(async () => {
      const result = await startAdsConnectAction(platform as "meta" | "google");
      if (result.success && typeof window !== "undefined") {
        window.location.href = result.data.url;
      }
    });
  }

  function handleDisconnect() {
    if (!canConnect) return;
    startTransition(async () => {
      await disconnectAdsPlatformAction(platform as "meta" | "google");
    });
  }

  const isConnected = status === "connected" || status === "pending";

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
            style={{ background: accent }}
          >
            {label.charAt(0)}
          </span>
          {isConnected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
              <CheckCircle2 className="size-3" aria-hidden />{" "}
              {status === "pending" ? "Pending" : "Connected"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <XCircle className="size-3" aria-hidden /> Not connected
            </span>
          )}
        </div>
        <CardTitle className="mt-3 text-lg">{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!configured ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
            Not configured — set{" "}
            <span className="font-mono text-amber-100/90">{ENV_HINTS[platform]}</span> to enable
            OAuth. Redirect URI must be{" "}
            <span className="font-mono text-amber-100/90">/api/ads/oauth/callback</span>.
          </p>
        ) : null}
        {!canConnect ? (
          <p className="rounded-lg border border-white/5 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            Coming soon — Meta and Google connectors are live first.
          </p>
        ) : isConnected ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleDisconnect}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
            ) : null}
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={handleConnect}
            disabled={isPending || !configured}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
            ) : (
              <ExternalLink className="mr-2 size-3.5" aria-hidden />
            )}
            Connect {label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
