"use client";

import Link from "next/link";
import { Plug, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useGrowthEngineOs } from "@/components/engine/growth-engine-os/growth-engine-os-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENGINE_DEPLOYMENT_GROUPS } from "@/lib/engine/growth-engine-os-catalog";
import type { DeploymentGroupId } from "@/lib/engine/growth-engine-os-types";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  connected: "bg-emerald-400",
  missing: "bg-muted-foreground/40",
  pending: "bg-amber-400",
  error: "bg-rose-400",
  expired: "bg-rose-300",
  needs_attention: "bg-amber-300",
};

export function DeploymentTargetsSection() {
  const { targets, config, togglePlatform } = useGrowthEngineOs();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<DeploymentGroupId | "all">("all");

  const filtered = useMemo(() => {
    return targets.filter((t) => {
      if (group !== "all" && t.groupId !== group) return false;
      if (query.trim() && !t.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [targets, group, query]);

  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/90 to-card/60 p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Deployment targets</h2>
          <p className="text-sm text-muted-foreground">
            Choose platforms agents can manage for this run.
          </p>
        </div>
        <Link href="/dashboard/integrations" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg border-white/10")}>
          Open Integrations Hub
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGroup("all")}
          className={cn(
            "rounded-lg px-3 py-1 text-xs font-medium",
            group === "all" ? "bg-violet-500/20 text-violet-100" : "text-muted-foreground hover:bg-white/[0.04]",
          )}
        >
          All
        </button>
        {ENGINE_DEPLOYMENT_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium",
              group === g.id ? "bg-violet-500/20 text-violet-100" : "text-muted-foreground hover:bg-white/[0.04]",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search platforms…"
          className="pl-9"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const selected = config.selectedPlatforms.includes(t.id);
          return (
            <div
              key={t.id}
              className={cn(
                "rounded-xl border p-3 transition-all",
                selected ? "border-violet-500/40 bg-violet-500/10" : "border-white/[0.08] bg-white/[0.02]",
              )}
            >
              <div className="flex items-start gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-500/10">
                  <Plug className="size-4 text-violet-200" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={cn("size-1.5 rounded-full", STATUS_DOT[t.status] ?? STATUS_DOT.missing)} />
                    <span className="text-[10px] uppercase text-muted-foreground">{t.status}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {t.lastSync ? `Sync ${t.lastSync}` : "Never synced"} · {t.permissions.slice(0, 2).join(", ")}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  className="h-7 rounded-lg text-[10px]"
                  onClick={() => togglePlatform(t.id)}
                >
                  {selected ? "Selected" : "Select"}
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 rounded-lg text-[10px]">
                  Connect
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 rounded-lg text-[10px]">
                  Logs
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
