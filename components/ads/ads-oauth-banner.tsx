"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export function AdsOAuthBanner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  const message = useMemo(() => {
    if (connected) {
      return {
        kind: "ok" as const,
        text: `${connected.charAt(0).toUpperCase()}${connected.slice(1)} account connected successfully.`,
      };
    }
    if (error) {
      return {
        kind: "err" as const,
        text: decodeURIComponent(error.replace(/\+/g, " ")),
      };
    }
    return null;
  }, [connected, error]);

  useEffect(() => {
    if (!connected && !error) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("connected");
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [connected, error]);

  if (!message) return null;

  return (
    <p
      className={
        message.kind === "ok"
          ? "flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          : "flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      }
    >
      {message.kind === "ok" ? (
        <CheckCircle2 className="size-4 shrink-0" />
      ) : (
        <XCircle className="size-4 shrink-0" />
      )}
      {message.text}
    </p>
  );
}
