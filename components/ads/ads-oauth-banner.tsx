"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export function AdsOAuthBanner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      setMessage({
        kind: "ok",
        text: `${connected.charAt(0).toUpperCase()}${connected.slice(1)} account connected successfully.`,
      });
    } else if (error) {
      setMessage({ kind: "err", text: decodeURIComponent(error.replace(/\+/g, " ")) });
    }
    if (connected || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams]);

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
