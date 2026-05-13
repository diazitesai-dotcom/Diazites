"use client";

import { useTransition } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

import {
  disconnectMetaAction,
  startMetaConnectAction,
} from "@/services/ads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlatformCardProps = {
  platform: "meta" | "google" | "tiktok" | "microsoft";
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

  function handleConnect() {
    if (platform !== "meta") return;
    startTransition(async () => {
      const result = await startMetaConnectAction();
      if (result.success && typeof window !== "undefined") {
        window.location.href = result.data.url;
      }
    });
  }

  function handleDisconnect() {
    if (platform !== "meta") return;
    startTransition(async () => {
      await disconnectMetaAction();
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
              <CheckCircle2 className="size-3" aria-hidden /> {status === "pending" ? "Pending" : "Connected"}
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
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            Not configured — set the {platform.toUpperCase()}_* env vars to enable OAuth.
          </p>
        ) : null}
        {platform !== "meta" ? (
          <p className="rounded-lg border border-white/5 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            Coming soon — Meta is the MVP connector.
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
