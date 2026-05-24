"use client";

import { ChevronRight, Plug } from "lucide-react";

import type { GrowthIntegration } from "@/lib/integrations/integration-types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<GrowthIntegration["status"], string> = {
  connected: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  missing: "border-white/15 bg-white/[0.04] text-muted-foreground",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  expired: "border-rose-500/25 bg-rose-500/8 text-rose-200",
  needs_attention: "border-amber-500/30 bg-amber-500/10 text-amber-200",
};

const PERMISSION_LABEL: Record<GrowthIntegration["agentPermissions"], string> = {
  read_only: "Read-only",
  recommend_only: "Recommend only",
  requires_approval: "Requires approval",
  auto_execute: "Auto within limits",
  full_autonomous: "Full autonomous",
};

export function IntegrationCard({
  integration,
  onSelect,
}: {
  integration: GrowthIntegration;
  onSelect: (i: GrowthIntegration) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(integration)}
      className="group w-full rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all hover:border-violet-500/35 hover:bg-violet-500/5 hover:shadow-[0_8px_32px_-12px_rgba(139,92,246,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-500/10">
          <Plug className="size-4 text-violet-200" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold group-hover:text-violet-100">{integration.name}</p>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          {integration.subchannels?.length ? (
            <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
              {integration.subchannels.slice(0, 3).join(" · ")}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase", STATUS_STYLE[integration.status])}>
              {integration.status.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] text-muted-foreground">{PERMISSION_LABEL[integration.agentPermissions]}</span>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {integration.lastSync ? `Last sync ${integration.lastSync}` : "Never synced"} · {integration.dataAccess}
          </p>
        </div>
      </div>
    </button>
  );
}
