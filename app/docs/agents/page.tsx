import Link from "next/link";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicAppUrl } from "@/lib/env";
import {
  CONNECT_STEPS,
  DIAZITES_MCP_PROTOCOL,
  DIAZITES_MCP_TOOLS,
  getDiazitesMcpClientExamples,
  MCP_JSONRPC_EXAMPLES,
  MCP_SCOPES,
  ZERNIO_MCP_URL,
} from "@/utils/diazites-site-agent-docs";

export const metadata = {
  title: "Connect your agent to Diazites | API & MCP",
  description:
    "How Hermes, OpenClaw, Cursor, and other MCP agents authenticate and call the Diazites site API.",
};

export default function DocsAgentsPage() {
  const baseUrl = getPublicAppUrl();
  const examples = getDiazitesMcpClientExamples(baseUrl);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
        <header className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-violet-300">
            Agent integration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Connect your agent to Diazites
          </h1>
          <p className="text-lg text-muted-foreground">
            External AI agents (Hermes, OpenClaw, Cursor, Claude, custom MCP clients) connect to{" "}
            <strong className="font-medium text-foreground">this site</strong> over HTTP MCP.
            Each business uses a bearer token to access only the agents and data you allow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className={buttonVariants({ variant: "gradient", size: "sm" })}>
              Get an account
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-xl" })}
            >
              Log in to generate a token
            </Link>
            <a
              href={examples.mcpUrl}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              target="_blank"
              rel="noreferrer"
            >
              MCP discovery (GET)
            </a>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Quick reference</h2>
          <Card className="border-white/[0.08]">
            <CardContent className="space-y-3 pt-6 font-mono text-sm">
              <p>
                <span className="text-muted-foreground">MCP URL</span>
                <br />
                <span className="text-foreground">{examples.mcpUrl}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Auth</span>
                <br />
                <span className="text-foreground">Authorization: Bearer diaz_mcp_…</span>
              </p>
              <p>
                <span className="text-muted-foreground">Protocol</span>
                <br />
                <span className="text-foreground">JSON-RPC 2.0 · MCP {DIAZITES_MCP_PROTOCOL}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Get a token</span>
                <br />
                <span className="text-foreground">Dashboard → Agent Manager (after login)</span>
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Setup steps</h2>
          <ol className="space-y-4">
            {CONNECT_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-sm font-medium text-violet-200">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Scopes</h2>
          <p className="text-sm text-muted-foreground">
            Selected when you create a token. The agent only receives tools for granted scopes.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {MCP_SCOPES.map((s) => (
              <li
                key={s.key}
                className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
              >
                <code className="text-xs text-violet-300">{s.key}</code>
                <span className="mt-1 block text-muted-foreground">{s.label}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Zernio bridge:</strong> optional. Uses the Zernio
            API key saved under Dashboard → Ads. For full Zernio tooling (280+ tools), connect
            directly to{" "}
            <a href={ZERNIO_MCP_URL} className="text-violet-300 underline">
              {ZERNIO_MCP_URL}
            </a>{" "}
            per{" "}
            <a href="https://docs.zernio.com/mcp" className="text-violet-300 underline">
              Zernio MCP docs
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Tools (Diazites MCP)</h2>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Tool</th>
                  <th className="px-3 py-2">Scope</th>
                  <th className="px-3 py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {DIAZITES_MCP_TOOLS.map((t) => (
                  <tr key={t.name} className="border-b border-border/40 align-top">
                    <td className="px-3 py-2 font-mono text-xs">{t.name}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{t.scope}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">JSON-RPC examples</h2>
          <DocBlock title="initialize" code={JSON.stringify(MCP_JSONRPC_EXAMPLES.initialize, null, 2)} />
          <DocBlock title="tools/list" code={JSON.stringify(MCP_JSONRPC_EXAMPLES.toolsList, null, 2)} />
          <DocBlock
            title="tools/call (list leads)"
            code={JSON.stringify(MCP_JSONRPC_EXAMPLES.toolsCall, null, 2)}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Client configuration</h2>
          <DocBlock title="Hermes Agent (~/.hermes/config.yaml)" code={examples.hermes} />
          <DocBlock title="Cursor (.cursor/mcp.json)" code={examples.cursor} />
          <DocBlock title="Raw HTTP (curl)" code={examples.http} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Errors</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <code className="text-foreground">401</code> — missing or invalid{" "}
              <code>diaz_mcp_</code> token (revoked or wrong value).
            </li>
            <li>
              <code className="text-foreground">Tool not listed</code> — token missing scope or
              agent not in allowed_agent_types.
            </li>
            <li>
              <code className="text-foreground">Zernio bridge errors</code> — connect Zernio on
              Dashboard → Ads or use Zernio MCP directly.
            </li>
          </ul>
        </section>

        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardHeader>
            <CardTitle className="text-base">Logged in?</CardTitle>
            <CardDescription>
              Generate and manage tokens in the dashboard — includes copy-paste config and
              connection list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/agents"
              className={buttonVariants({ variant: "gradient", size: "sm", className: "rounded-xl" })}
            >
              Open Agent Manager
            </Link>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto max-w-3xl px-4 text-sm text-muted-foreground sm:px-6">
          <Link href="/" className="text-violet-300 underline">
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}

function DocBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-muted-foreground">
        {code}
      </pre>
    </div>
  );
}
