"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Check, Copy, KeyRound, Link2, Plug, Shield } from "lucide-react";

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
import {
  createMcpConnectionAction,
  revokeMcpConnectionAction,
  updateMcpConnectionAccessAction,
} from "@/services/mcp/actions";
import type { AgentMcpConnectionPublic } from "@/types/mcp";
import type { AgentType } from "@/types/domain";
import {
  AGENT_TYPE_OPTIONS,
  FULL_FUNNEL_MCP_SCOPES,
  MCP_CLIENT_TYPES,
  MCP_SCOPES,
  ZERNIO_MCP_URL,
  type McpScope,
} from "@/utils/mcp-constants";

type AgentMcpAccessPanelProps = {
  mcpEndpoint: string;
  connections: AgentMcpConnectionPublic[];
  setupError?: string | null;
};

export function AgentMcpAccessPanel({
  mcpEndpoint,
  connections,
  setupError = null,
}: AgentMcpAccessPanelProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullFunnelAccess, setFullFunnelAccess] = useState(true);

  const zernioCursorConfig = useMemo(
    () =>
      JSON.stringify(
        {
          zernio: {
            type: "http",
            url: ZERNIO_MCP_URL,
            headers: { Authorization: "Bearer YOUR_ZERNIO_API_KEY" },
          },
        },
        null,
        2,
      ),
    [],
  );

  const diazitesClientConfig = useMemo(
    () =>
      JSON.stringify(
        {
          diazites: {
            type: "http",
            url: mcpEndpoint,
            headers: { Authorization: "Bearer YOUR_DIAZ_MCP_TOKEN" },
          },
        },
        null,
        2,
      ),
    [mcpEndpoint],
  );

  function copyText(text: string) {
    void navigator.clipboard.writeText(text);
    setMessage("Copied to clipboard.");
  }

  function createConnection(formData: FormData) {
    setMessage(null);
    setNewToken(null);
    startTransition(async () => {
      const res = await createMcpConnectionAction(formData);
      if (!res.success) {
        setMessage(res.error);
        return;
      }
      setNewToken(res.data.token);
      setMessage(
        `Connection "${res.data.connection.label}" created. Copy the token now — it won't be shown again.`,
      );
    });
  }

  function revoke(id: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await revokeMcpConnectionAction(id);
      setMessage(res.success ? "Connection revoked." : res.error);
    });
  }

  function saveAccess(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await updateMcpConnectionAccessAction(formData);
      setMessage(res.success ? "Access settings updated." : res.error);
      if (res.success) setEditingId(null);
    });
  }

  const needsMigration =
    setupError &&
    (/agent_mcp_connections|does not exist|relation/i.test(setupError) ||
      setupError.includes("schema cache"));

  return (
    <section className="space-y-6">
      {setupError ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            needsMigration
              ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
              : "border-red-500/40 bg-red-500/10 text-red-100"
          }`}
        >
          {needsMigration ? (
            <>
              <p className="font-medium">Database migration required</p>
              <p className="mt-1 text-xs opacity-90">
                Run <code className="text-[11px]">014_agent_mcp_connections.sql</code> in
                Supabase, then refresh. Token generation will work after that.
              </p>
            </>
          ) : (
            <p>{setupError}</p>
          )}
        </div>
      ) : null}

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plug className="size-4 text-cyan-300" aria-hidden />
            Zernio MCP (hosted)
          </CardTitle>
          <CardDescription>
            Site connection docs:{" "}
            <Link href="/docs/agents" className="text-violet-300 underline">
              /docs/agents
            </Link>
            . Connect OpenClaw, Hermes, Cursor, Claude, or Windsurf directly to Zernio for
            cross-posting, ads, inbox, and sequences across 14 platforms. Get an API key at{" "}
            <a
              href="https://zernio.com/dashboard/api-keys"
              className="text-violet-300 underline"
              target="_blank"
              rel="noreferrer"
            >
              zernio.com/dashboard/api-keys
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-muted-foreground">
            {zernioCursorConfig}
          </pre>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => copyText(zernioCursorConfig)}
          >
            <Copy className="mr-2 size-3.5" aria-hidden />
            Copy Zernio MCP config
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="size-4 text-violet-300" aria-hidden />
            Diazites MCP (this workspace)
          </CardTitle>
          <CardDescription>
            Let external agents read your Diazites agents and leads and optionally bridge to
            your per-business Zernio key.{" "}
            <Link href="/docs/agents" className="text-violet-300 underline">
              Full connection docs
            </Link>
            . Endpoint: <code className="text-xs">{mcpEndpoint}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-muted-foreground">
            {diazitesClientConfig}
          </pre>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => copyText(diazitesClientConfig)}
          >
            <Copy className="mr-2 size-3.5" aria-hidden />
            Copy Diazites MCP config
          </Button>

          {newToken ? <TokenAlert token={newToken} onCopied={() => setMessage("Token copied to clipboard.")} /> : null}

          <form
            action={createConnection}
            className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 text-amber-300" aria-hidden />
              Generate agent connection token
            </p>
            <Field label="Label" name="label" placeholder="OpenClaw production" required />
            <ClientTypeSelect />
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-border"
                checked={fullFunnelAccess}
                onChange={(e) => setFullFunnelAccess(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground">Full funnel access</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Enables all API scopes (generate landing pages, publish, activate agents, leads,
                  campaigns, Zernio bridge tools). Recommended for Hermes / OpenClaw.
                </span>
              </span>
            </label>
            <AgentAccessCheckboxes fullAccess={fullFunnelAccess} />
            <ScopeCheckboxes fullAccess={fullFunnelAccess} />
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border/50 px-3 py-2 text-sm">
              <span>Enable Zernio bridge (uses Zernio key from Ads)</span>
              <input
                type="checkbox"
                name="zernio_bridge"
                className="rounded border-border"
                defaultChecked={fullFunnelAccess}
              />
            </label>
            <Button type="submit" variant="gradient" className="rounded-xl" disabled={pending}>
              {pending ? "Creating…" : "Generate token"}
            </Button>
          </form>

          {connections.length > 0 ? (
            <ul className="space-y-3">
              {connections.map((conn) => (
                <li
                  key={conn.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <ConnectionRow
                    conn={conn}
                    editing={editingId === conn.id}
                    pending={pending}
                    onEdit={() => setEditingId(conn.id)}
                    onCancel={() => setEditingId(null)}
                    onRevoke={() => revoke(conn.id)}
                    onSave={saveAccess}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No active MCP connections yet.</p>
          )}

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </section>
  );
}

function AgentAccessCheckboxes({
  defaultChecked,
  fullAccess = false,
}: {
  defaultChecked?: AgentType[];
  fullAccess?: boolean;
}) {
  const defaults = new Set(
    fullAccess
      ? AGENT_TYPE_OPTIONS.map((a) => a.key)
      : (defaultChecked ?? AGENT_TYPE_OPTIONS.map((a) => a.key)),
  );
  return (
    <fieldset className="space-y-2">
      <legend className="flex items-center gap-2 text-sm font-medium">
        <Shield className="size-3.5 text-violet-300" aria-hidden />
        Agent access
      </legend>
      <CheckboxGrid
        key={fullAccess ? "agents-full" : "agents-partial"}
        name="allowed_agent_types"
        options={AGENT_TYPE_OPTIONS.map((a) => ({ value: a.key, label: a.label }))}
        defaultChecked={defaults}
      />
    </fieldset>
  );
}

function ScopeCheckboxes({
  defaultChecked,
  fullAccess = false,
}: {
  defaultChecked?: McpScope[];
  fullAccess?: boolean;
}) {
  const defaults = new Set(
    fullAccess
      ? FULL_FUNNEL_MCP_SCOPES
      : (defaultChecked ?? (["agents:read", "leads:read", "leads:write"] as McpScope[])),
  );
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">API scopes</legend>
      <CheckboxGrid
        key={fullAccess ? "scopes-full" : "scopes-partial"}
        name="scopes"
        options={MCP_SCOPES.map((s) => ({ value: s.key, label: s.label }))}
        defaultChecked={defaults}
      />
    </fieldset>
  );
}

function ConnectionRow(props: {
  conn: AgentMcpConnectionPublic;
  editing: boolean;
  pending: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onRevoke: () => void;
  onSave: (fd: FormData) => void;
}) {
  const { conn, editing, pending, onEdit, onCancel, onRevoke, onSave } = props;
  const clientLabel =
    MCP_CLIENT_TYPES.find((c) => c.key === conn.client_type)?.name ?? conn.client_type;

  if (editing) {
    return (
      <form action={onSave} className="space-y-3">
        <input type="hidden" name="connection_id" value={conn.id} />
        <p className="font-medium">{conn.label}</p>
        <AgentAccessCheckboxes defaultChecked={conn.allowed_agent_types} />
        <ScopeCheckboxes defaultChecked={conn.scopes} />
        <ZernioBridgeSwitch id={conn.id} defaultChecked={conn.zernio_bridge_enabled} />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            Save access
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="font-medium">{conn.label}</p>
        <p className="text-xs text-muted-foreground">
          {clientLabel} · {conn.token_prefix} · {conn.allowed_agent_types.length} agent(s) ·{" "}
          {conn.zernio_bridge_enabled ? "Zernio bridge on" : "Zernio bridge off"}
          {conn.last_used_at
            ? ` · last used ${new Date(conn.last_used_at).toLocaleDateString()}`
            : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          Access
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onRevoke} disabled={pending}>
          Revoke
        </Button>
      </div>
    </div>
  );
}

function ZernioBridgeSwitch({
  id,
  defaultChecked,
}: {
  id: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      htmlFor={`zernio_bridge_${id}`}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border/50 px-3 py-2 text-sm"
    >
      <span>Zernio bridge</span>
      <input
        id={`zernio_bridge_${id}`}
        type="checkbox"
        name="zernio_bridge"
        defaultChecked={defaultChecked}
        className="rounded border-border"
      />
    </label>
  );
}

function CheckboxGrid(props: {
  name: string;
  options: Array<{ value: string; label: string }>;
  defaultChecked: Set<string>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {props.options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm"
        >
          <input
            type="checkbox"
            name={props.name}
            value={opt.value}
            defaultChecked={props.defaultChecked.has(opt.value)}
            className="rounded border-border"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function Field(props: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Input
        id={props.name}
        name={props.name}
        placeholder={props.placeholder}
        required={props.required}
        className="rounded-xl"
      />
    </div>
  );
}

function ClientTypeSelect() {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="client_type">Client type</Label>
      <select
        id="client_type"
        name="client_type"
        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
      >
        {MCP_CLIENT_TYPES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function TokenAlert({
  token,
  onCopied,
}: {
  token: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      const el = document.createElement("textarea");
      el.value = token;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    onCopied?.();
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-sm font-medium text-amber-200">New MCP token (shown once)</p>
      <p className="mt-1 text-xs text-amber-100/80">
        Use as{" "}
        <code className="text-[11px]">Authorization: Bearer &lt;token&gt;</code> in your MCP client.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          readOnly
          value={token}
          aria-label="Agent connection token"
          className="rounded-xl border-amber-500/20 bg-black/30 font-mono text-xs text-amber-50"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-xl border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
          onClick={() => void copyKey()}
        >
          {copied ? (
            <>
              <Check className="mr-2 size-3.5 text-emerald-400" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 size-3.5" aria-hidden />
              Copy key
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
