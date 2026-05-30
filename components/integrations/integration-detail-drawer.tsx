"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, KeyRound, Link2, Loader2, RotateCcw, ScrollText, Unplug, Wrench, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  connectAdAccountAction,
  disconnectAdAccountAction,
  syncAdAccountAction,
  testAdAccountAction,
} from "@/actions/marketing-os.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AGENT_CAPABILITY_GROUPS } from "@/lib/integrations/growth-integrations-catalog";
import {
  credentialLabelFor,
  resolveAdPlatform,
  resolveOAuthAdsPlatform,
  type AdsOAuthConfigured,
  type LinkedAdAccount,
} from "@/lib/integrations/integration-connect-config";
import {
  startGoogleConnectAction,
  startMetaConnectAction,
} from "@/services/ads/actions";
import type { GrowthIntegration } from "@/lib/integrations/integration-types";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

type Tab = "overview" | "metrics" | "logs" | "permissions" | "actions" | "errors";
type PanelMode = "overview" | "connect" | "manage";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "metrics", label: "Metrics" },
  { id: "logs", label: "Logs" },
  { id: "permissions", label: "Permissions" },
  { id: "actions", label: "Agent actions" },
  { id: "errors", label: "Errors" },
];

const OAUTH_ENV_HINTS: Record<"meta" | "google", string> = {
  meta: "META_APP_ID, META_APP_SECRET, META_REDIRECT_URL",
  google: "GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REDIRECT_URL",
};

export function IntegrationDetailDrawer({
  integration,
  linkedAccount,
  adsOAuthConfigured = { meta: false, google: false },
  onClose,
}: {
  integration: GrowthIntegration | null;
  linkedAccount?: LinkedAdAccount | null;
  adsOAuthConfigured?: AdsOAuthConfigured;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [panelMode, setPanelMode] = useState<PanelMode>("overview");
  const [accountName, setAccountName] = useState("");
  const [credential, setCredential] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const caps = AGENT_CAPABILITY_GROUPS.find((g) => g.agentType === integration?.agentType);
  const credentialLabel = integration
    ? credentialLabelFor(integration.id, integration.name)
    : "API key or token";
  const oauthPlatform = integration ? resolveOAuthAdsPlatform(integration.id) : null;
  const oauthConfigured = oauthPlatform ? adsOAuthConfigured[oauthPlatform] : false;

  useEffect(() => {
    if (!integration) return;
    setTab("overview");
    setPanelMode("overview");
    setAccountName(linkedAccount?.accountName ?? `${integration.name} account`);
    setCredential("");
    setMessage("");
  }, [integration?.id, linkedAccount?.id]);

  function refreshAfterMutation() {
    router.refresh();
  }

  function openConnectPanel() {
    setPanelMode("connect");
    setMessage("");
  }

  function openManagePanel() {
    if (linkedAccount) {
      setPanelMode("manage");
      setMessage("");
      return;
    }
    openConnectPanel();
  }

  function handleConnect() {
    if (!integration || !credential.trim()) {
      setMessage("Paste an API key or access token to connect.");
      openConnectPanel();
      return;
    }

    startTransition(async () => {
      const result = await connectAdAccountAction({
        platform: resolveAdPlatform(integration.id),
        accountName: accountName.trim() || `${integration.name} account`,
        externalAccountId: integration.id,
        credentials: {
          token: credential.trim(),
          ...(integration.endpoint ? { endpoint: integration.endpoint } : {}),
        },
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setCredential("");
      setMessage("Connected — credentials stored encrypted in your vault.");
      setPanelMode("manage");
      refreshAfterMutation();
    });
  }

  function handleOAuthConnect() {
    if (!oauthPlatform) return;
    startTransition(async () => {
      const result =
        oauthPlatform === "google"
          ? await startGoogleConnectAction()
          : await startMetaConnectAction();
      if (!result.success) {
        setMessage(result.error);
        openConnectPanel();
        return;
      }
      if (typeof window !== "undefined") {
        window.location.href = result.data.url;
      }
    });
  }

  function handleDisconnect() {
    if (!linkedAccount) return;
    startTransition(async () => {
      const result = await disconnectAdAccountAction(linkedAccount.id);
      setMessage(result.ok ? "Disconnected." : result.error);
      if (result.ok) {
        setPanelMode("overview");
        refreshAfterMutation();
      }
    });
  }

  return (
    <>
      <AnimatePresence>
        {integration ? (
          <motion.div
            className="fixed inset-0 z-[58] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {integration ? (
          <motion.aside
            role="dialog"
            aria-labelledby="integration-drawer-title"
            className="fixed inset-y-0 right-0 z-[59] flex w-full max-w-lg flex-col border-l border-white/10 bg-card/98 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <header className="border-b border-white/10 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p id="integration-drawer-title" className="text-base font-semibold">
                    {integration.name}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {integration.status.replace(/_/g, " ")}
                    {linkedAccount?.credentialsHint ? ` · ${linkedAccount.credentialsHint}` : ""}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
              <nav className="mt-3 flex gap-1 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTab(t.id);
                      setPanelMode("overview");
                    }}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                      tab === t.id ? "bg-violet-500/20 text-violet-200" : "text-muted-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
              {message ? (
                <p
                  className={cn(
                    "mb-3 rounded-lg border px-3 py-2 text-xs",
                    message.toLowerCase().includes("connected")
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-100",
                  )}
                >
                  {message}
                </p>
              ) : null}

              {panelMode === "connect" ? (
                <div className="space-y-4">
                  {oauthPlatform ? (
                    <div className="space-y-3 rounded-lg border border-violet-500/25 bg-violet-500/10 p-3">
                      <p className="text-xs text-violet-100/90">
                        Recommended: sign in with {integration.name} OAuth. Tokens are stored
                        encrypted; refresh tokens power background sync.
                      </p>
                      {!oauthConfigured ? (
                        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
                          OAuth not configured — set{" "}
                          <span className="font-mono">{OAUTH_ENV_HINTS[oauthPlatform]}</span>.
                          Redirect URI:{" "}
                          <span className="font-mono">/api/ads/oauth/callback</span>
                        </p>
                      ) : null}
                      <Button
                        type="button"
                        variant="gradient"
                        size="sm"
                        className="w-full rounded-lg"
                        disabled={pending || !oauthConfigured}
                        onClick={handleOAuthConnect}
                      >
                        {pending ? (
                          <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <ExternalLink className="mr-2 size-3.5" aria-hidden />
                        )}
                        Connect with {integration.name}
                      </Button>
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {oauthPlatform
                      ? "Or paste an API key manually — encrypted at rest, never shown in full after saving."
                      : "Credentials are encrypted at rest and never shown in full after saving."}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="integration-account-name">Account label</Label>
                    <Input
                      id="integration-account-name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Main account"
                      disabled={pending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="integration-credential">{credentialLabel}</Label>
                    <Input
                      id="integration-credential"
                      type="password"
                      autoComplete="off"
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      placeholder="Paste key or token"
                      disabled={pending}
                    />
                  </div>
                  {integration.endpoint ? (
                    <p className="text-[11px] text-muted-foreground">
                      API base: <code className="text-foreground">{integration.endpoint}</code>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="gradient"
                      size="sm"
                      className="rounded-lg"
                      disabled={pending || !credential.trim()}
                      onClick={handleConnect}
                    >
                      Save & connect
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg"
                      disabled={pending}
                      onClick={() => setPanelMode("overview")}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}

              {panelMode === "manage" && linkedAccount ? (
                <div className="space-y-4">
                  <dl className="grid gap-2 text-xs">
                    <div className="rounded-lg border border-white/[0.06] p-2">
                      <dt className="text-muted-foreground">Vault record</dt>
                      <dd className="font-medium">{linkedAccount.accountName ?? integration.name}</dd>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] p-2">
                      <dt className="text-muted-foreground">Stored credential</dt>
                      <dd className="font-mono">{linkedAccount.credentialsHint ?? "Encrypted"}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-white/10"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await testAdAccountAction(linkedAccount.id);
                          setMessage(result.ok ? result.data.message : result.error);
                        });
                      }}
                    >
                      Test connection
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-white/10"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await syncAdAccountAction(linkedAccount.id);
                          setMessage(
                            result.ok
                              ? `Synced ${result.data.campaignCount} campaigns.`
                              : result.error,
                          );
                          if (result.ok) refreshAfterMutation();
                        });
                      }}
                    >
                      Sync now
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-white/10"
                      disabled={pending}
                      onClick={() => {
                        setCredential("");
                        setPanelMode("connect");
                      }}
                    >
                      Update API key
                    </Button>
                    <Link
                      href={ROUTES.campaignOps}
                      className="inline-flex h-8 items-center rounded-lg border border-white/10 px-3 text-xs font-medium hover:bg-white/5"
                    >
                      Open Campaign Ops
                    </Link>
                  </div>
                </div>
              ) : null}

              {panelMode === "overview" ? (
                <>
                  {tab === "overview" ? (
                    <div className="space-y-3">
                      <p className="text-muted-foreground">{integration.dataAccess}</p>
                      <p>Last sync: {integration.lastSync ?? "Never"}</p>
                      {integration.endpoint ? (
                        <p className="text-xs text-muted-foreground">
                          Endpoint: <code className="text-foreground">{integration.endpoint}</code>
                        </p>
                      ) : null}
                      {integration.openApiSpecPath ? (
                        <p className="text-xs text-muted-foreground">
                          OpenAPI spec:{" "}
                          <a
                            href={integration.openApiSpecPath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-300 underline"
                          >
                            {integration.openApiSpecPath}
                          </a>
                        </p>
                      ) : null}
                      {integration.subchannels?.length ? (
                        <p className="text-xs text-muted-foreground">
                          {integration.subchannels.join(" · ")}
                        </p>
                      ) : null}
                      {integration.status !== "connected" ? (
                        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs">
                          Connect via OAuth or paste an API key in the secure vault (masked after save).
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {tab === "metrics" ? (
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-white/[0.06] p-2">
                        <dt className="text-muted-foreground">Campaigns</dt>
                        <dd className="font-semibold">{integration.connectedCampaigns ?? 0}</dd>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] p-2">
                        <dt className="text-muted-foreground">Agent permission</dt>
                        <dd className="font-semibold capitalize">
                          {integration.agentPermissions.replace(/_/g, " ")}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                  {tab === "logs" ? (
                    <ul className="space-y-1 font-mono text-[10px] text-muted-foreground">
                      <li>09:14 — Token validated (masked)</li>
                      <li>09:02 — Sync completed</li>
                      <li>08:55 — Agent read campaign metrics</li>
                    </ul>
                  ) : null}
                  {tab === "permissions" ? (
                    <ul className="space-y-1 text-xs">
                      {caps?.capabilities.map((c) => (
                        <li key={c}>✓ {c}</li>
                      ))}
                    </ul>
                  ) : null}
                  {tab === "actions" ? (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>Last agent action: Budget check · 18m ago</li>
                      <li>Pending approval: None</li>
                    </ul>
                  ) : null}
                  {tab === "errors" ? (
                    <p className="text-xs text-muted-foreground">
                      {integration.status === "error" || integration.status === "expired"
                        ? "Reconnect required — token invalid or expired."
                        : "No errors in last 24h."}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>

            <footer className="flex flex-wrap gap-2 border-t border-white/10 p-4">
              {oauthPlatform && !linkedAccount ? (
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  className="rounded-lg"
                  disabled={pending || !oauthConfigured}
                  onClick={handleOAuthConnect}
                >
                  {pending ? (
                    <Loader2 className="mr-1 size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <ExternalLink className="mr-1 size-3.5" aria-hidden />
                  )}
                  OAuth connect
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  className="rounded-lg"
                  disabled={pending}
                  onClick={() => {
                    if (credential.trim()) {
                      handleConnect();
                      return;
                    }
                    openConnectPanel();
                  }}
                >
                  <Link2 className="mr-1 size-3.5" />
                  {linkedAccount ? "Update connection" : "Connect"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg border-white/10"
                disabled={pending}
                onClick={openConnectPanel}
              >
                <KeyRound className="mr-1 size-3.5" />
                API key
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg border-white/10"
                disabled={pending}
                onClick={openManagePanel}
              >
                <Wrench className="mr-1 size-3.5" />
                Manage
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg border-white/10"
                onClick={() => {
                  setTab("logs");
                  setPanelMode("overview");
                }}
              >
                <ScrollText className="mr-1 size-3.5" />
                View logs
              </Button>
              {linkedAccount ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-rose-300"
                  disabled={pending}
                  onClick={handleDisconnect}
                >
                  <Unplug className="mr-1 size-3.5" />
                  Disconnect
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-lg"
                disabled={pending}
                onClick={() => {
                  setPanelMode("overview");
                  setTab("overview");
                  setMessage("");
                }}
              >
                <RotateCcw className="mr-1 size-3.5" />
                Reset view
              </Button>
            </footer>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
