"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Plug,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import { AgentPermissionsPanel } from "@/components/integrations/agent-permissions-panel";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { IntegrationDetailDrawer } from "@/components/integrations/integration-detail-drawer";
import { CredentialVaultPanel } from "@/components/dashboard/mission-control/credential-vault-panel";
import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ConnectionStatus } from "@/lib/dashboard/mission-control-types";
import {
  AGENT_CAPABILITY_GROUPS,
  INTEGRATION_CATEGORIES,
  buildGrowthIntegrations,
  criticalMissingConnections,
  integrationHealthScore,
} from "@/lib/integrations/growth-integrations-catalog";
import {
  integrationOAuthPlatform,
  OAUTH_INTEGRATION_IDS,
  type LinkedAdAccount,
} from "@/lib/integrations/integration-connect-config";
import type {
  GrowthIntegration,
  IntegrationCategoryId,
} from "@/lib/integrations/integration-types";
import { cn } from "@/lib/utils";

type StatusFilter = ConnectionStatus | "all" | "needs_attention_group";

export function GrowthIntegrationsHub({
  connectedIds,
  linkedAccounts = {},
  oauthConfigured = { meta: false, google: false },
  starterOnly = true,
}: {
  connectedIds: string[];
  linkedAccounts?: Record<string, LinkedAdAccount>;
  oauthConfigured?: { meta: boolean; google: boolean };
  /** When true, only Meta and Google Ads are shown (default for new users). */
  starterOnly?: boolean;
}) {
  const searchParams = useSearchParams();
  const [banner, setBanner] = useState<string | null>(null);
  const connected = useMemo(() => new Set(connectedIds), [connectedIds]);
  const integrations = useMemo(
    () => buildGrowthIntegrations(connected, { starterOnly }),
    [connected, starterOnly],
  );
  const visibleCategories = useMemo(() => {
    if (!starterOnly) return INTEGRATION_CATEGORIES;
    const ids = new Set(integrations.map((i) => i.categoryId));
    return INTEGRATION_CATEGORIES.filter((cat) => ids.has(cat.id));
  }, [integrations, starterOnly]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IntegrationCategoryId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<GrowthIntegration | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    const focus = searchParams.get("focus");
    if (connected === "google_ads") {
      setBanner("Google Ads connected successfully.");
      const match = integrations.find((i) => i.id === "google_ads");
      if (match) setSelected(match);
    } else if (connected === "meta") {
      setBanner("Meta Ads connected successfully.");
      const match = integrations.find((i) => i.id === "meta");
      if (match) setSelected(match);
    } else if (focus === "zernio") {
      const match = integrations.find((i) => i.id === "zernio");
      if (match) setSelected(match);
    } else if (error) {
      setBanner(`Connection failed: ${error.replace(/_/g, " ")}`);
    }
  }, [searchParams, integrations]);

  const healthScore = integrationHealthScore(integrations);
  const missingCritical = criticalMissingConnections(integrations);
  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  function handleSelectIntegration(integration: GrowthIntegration) {
    const linked = linkedAccounts[integration.id];
    const platform = integrationOAuthPlatform(integration.id);
    const oauthReady =
      platform === "google"
        ? oauthConfigured.google
        : platform === "meta"
          ? oauthConfigured.meta
          : false;

    if (OAUTH_INTEGRATION_IDS.has(integration.id) && !linked && oauthReady && platform) {
      const params = new URLSearchParams({
        platform,
        returnTo: "/dashboard/integrations",
      });
      window.location.href = `/api/ads/oauth/start?${params.toString()}`;
      return;
    }

    setSelected(integration);
  }

  const filtered = integrations.filter((i) => {
    if (category !== "all" && i.categoryId !== category) return false;
    if (statusFilter === "needs_attention_group") {
      if (!["error", "expired", "needs_attention", "missing"].includes(i.status)) return false;
    } else if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.subchannels?.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <motion.div className="mx-auto max-w-7xl space-y-8 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">
            Integrations Hub
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">External systems & credentials</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {starterOnly
              ? "Connect Meta, Google Ads, and Zernio to run and manage campaigns across social and ad platforms. Additional integrations unlock as your plan grows."
              : "Connect ad platforms, CRM, analytics, tracking, ecommerce, and comms — agents monitor, recommend, and execute within your guardrails."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl border-white/10" onClick={() => setShowPermissions((v) => !v)}>
            <Shield className="mr-1.5 size-4" />
            Agent permissions
          </Button>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-white/10")}>
            Mission Control
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard title="Connected" contentClassName="pt-0">
          <p className="text-3xl font-bold tabular-nums text-emerald-300">{connectedCount}</p>
          <p className="text-xs text-muted-foreground">of {integrations.length} platforms</p>
        </GlassCard>
        <GlassCard title="Health score" contentClassName="pt-0">
          <p className="text-3xl font-bold tabular-nums text-cyan-200">{healthScore}%</p>
          <p className="text-xs text-muted-foreground">Integration readiness</p>
        </GlassCard>
        <GlassCard title="Agent capabilities" contentClassName="pt-0">
          <p className="text-3xl font-bold tabular-nums text-violet-200">{AGENT_CAPABILITY_GROUPS.length}</p>
          <p className="text-xs text-muted-foreground">Specialist agents</p>
        </GlassCard>
        <GlassCard title="Needs attention" contentClassName="pt-0">
          <p className="text-3xl font-bold tabular-nums text-amber-300">{missingCritical.length}</p>
          <p className="text-xs text-muted-foreground">Critical gaps</p>
        </GlassCard>
      </div>

      {banner ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            banner.startsWith("Connection failed")
              ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
          )}
        >
          {banner}
        </div>
      ) : null}

      {missingCritical.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <div>
            <p className="text-sm font-medium text-amber-100">Missing critical connections</p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              {missingCritical.join(", ")} — Mission Control estimates 18–32% more leads left on table
              without paid ads connected.
            </p>
          </div>
        </div>
      ) : null}

      {showPermissions ? <AgentPermissionsPanel /> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations…"
            className="rounded-xl border-white/10 bg-white/[0.03] pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "connected", "missing", "needs_attention_group", "error", "expired"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                statusFilter === f
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                  : "border-white/10 text-muted-foreground hover:border-white/20",
              )}
            >
              {f === "needs_attention_group" ? "Needs attention" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            category === "all" ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-muted-foreground",
          )}
        >
          All categories
        </button>
        {visibleCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium",
              category === cat.id ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-muted-foreground",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onSelect={handleSelectIntegration}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div className="rounded-xl border border-dashed border-white/15 py-16 text-center text-sm text-muted-foreground">
          No integrations match your filters.
        </motion.div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <GlassCard
          title="Agent capability matrix"
          description="What specialist agents can do per platform type"
          headerExtra={<Sparkles className="size-4 text-violet-300" />}
        >
          <ul className="space-y-3">
            {AGENT_CAPABILITY_GROUPS.map((g) => (
              <li key={g.agentType} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-sm font-medium">{g.label}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{g.capabilities.slice(0, 4).join(" · ")}…</p>
              </li>
            ))}
          </ul>
        </GlassCard>
        <CredentialVaultPanel />
      </section>

      <IntegrationDetailDrawer
        integration={selected}
        linkedAccount={selected ? linkedAccounts[selected.id] ?? null : null}
        oauthConfigured={oauthConfigured}
        onClose={() => setSelected(null)}
      />

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center text-xs text-muted-foreground">
        <Plug className="mx-auto mb-2 size-4 text-violet-300" />
        OAuth and API key flows use encrypted credential vault — raw keys are never shown in UI.
      </div>
    </motion.div>
  );
}
