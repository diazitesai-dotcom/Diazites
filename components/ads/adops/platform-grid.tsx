"use client";

import { ChevronRight } from "lucide-react";
import { useTransition } from "react";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { startAdsConnectAction } from "@/services/ads/actions";
import { isAdsConfigured } from "@/lib/ads-env";
import type { AdopsPlatformId, PlatformHealth } from "@/lib/ads/adops-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HEALTH_LABEL: Record<PlatformHealth, string> = {
  healthy: "Healthy",
  sync_delayed: "Sync delayed",
  token_expiring: "Token expiring",
  oauth_failed: "OAuth failed",
  permission_issue: "Permission issue",
  api_error: "API error",
  needs_attention: "Needs attention",
  disconnected: "Disconnected",
  failed_tracking: "Failed tracking",
};

const HEALTH_STYLE: Record<PlatformHealth, string> = {
  healthy: "text-emerald-300 border-emerald-500/30",
  sync_delayed: "text-amber-300 border-amber-500/30",
  token_expiring: "text-amber-300 border-amber-500/30",
  oauth_failed: "text-rose-300 border-rose-500/30",
  permission_issue: "text-rose-300 border-rose-500/30",
  api_error: "text-rose-300 border-rose-500/30",
  needs_attention: "text-violet-300 border-violet-500/30",
  disconnected: "text-muted-foreground border-white/15",
  failed_tracking: "text-rose-300 border-rose-500/30",
};

export function PlatformGrid() {
  const { payload, setSelectedPlatform, search, filter } = useAdops();
  const [pending, startTransition] = useTransition();

  const filtered = payload.platforms.filter((p) => {
    const health = payload.platformHealth[p.id];
    const status = payload.accountStatus[p.id];
    if (search.trim() && !p.label.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "connected" && status !== "connected" && status !== "pending") return false;
    if (filter === "missing" && status !== "disconnected") return false;
    if (filter === "errors" && health !== "oauth_failed" && health !== "api_error") return false;
    return true;
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Platform workspaces
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => {
          const health = payload.platformHealth[p.id];
          const status = payload.accountStatus[p.id];
          const connected = status === "connected" || status === "pending";
          const viaZernio = payload.zernioLinkedPlatforms.includes(p.id);
          const repo = p.mapsToRepo;
          const canConnect =
            p.connectable &&
            (repo === "meta" || repo === "google") &&
            isAdsConfigured(repo);

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlatform(p.id)}
              onKeyDown={(e) => e.key === "Enter" && setSelectedPlatform(p.id)}
              className={cn(
                "group cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all",
                "hover:border-violet-500/35 hover:shadow-[0_8px_32px_-12px_rgba(139,92,246,0.35)]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: p.accent }}
                >
                  {p.label.charAt(0)}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-opacity group-hover:text-violet-300" />
              </div>
              <p className="mt-3 font-semibold group-hover:text-cyan-100">{p.label}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{p.description}</p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                  HEALTH_STYLE[health],
                )}
              >
                {viaZernio && connected ? "Connected · Zernio" : HEALTH_LABEL[health]}
              </span>
              {p.connectable && !connected && canConnect ? (
                <div className="mt-3 border-t border-white/[0.06] pt-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 w-full rounded-lg text-xs"
                    disabled={pending}
                    onClick={() => {
                      const repo = p.mapsToRepo;
                      if (repo !== "meta" && repo !== "google") return;
                      startTransition(async () => {
                        const r = await startAdsConnectAction(repo);
                        if (r.success) window.location.href = r.data.url;
                      });
                    }}
                  >
                    Connect
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
