"use client";

import { useMemo, useState } from "react";
import { BookOpen, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAgentMcpDocSections,
  MCP_DOC_FAQ,
  type AgentMcpDocClient,
} from "@/utils/agent-mcp-docs";

type AgentMcpDocsProps = {
  mcpEndpoint: string;
};

export function AgentMcpDocs({ mcpEndpoint }: AgentMcpDocsProps) {
  const sections = useMemo(() => getAgentMcpDocSections(mcpEndpoint), [mcpEndpoint]);
  const [client, setClient] = useState<AgentMcpDocClient>("hermes");
  const [showDiazites, setShowDiazites] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const active = sections.find((s) => s.id === client) ?? sections[0];

  function copy(label: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 2000);
  }

  const snippet = showDiazites
    ? active.diazitesSnippet(mcpEndpoint)
    : active.zernioSnippet;

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="size-4 text-emerald-300" aria-hidden />
          Connect external agents (docs)
        </CardTitle>
        <CardDescription>
          Wire Hermes, OpenClaw, Cursor, or Claude to{" "}
          <strong className="font-medium text-foreground">Zernio MCP</strong> for cross-posting
          and ads, and optionally to <strong className="font-medium text-foreground">Diazites MCP</strong>{" "}
          for leads and agent status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <Button
              key={s.id}
              type="button"
              size="sm"
              variant={client === s.id ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setClient(s.id)}
            >
              {s.title}
            </Button>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{active.summary}</p>
          <p className="text-xs text-muted-foreground">
            Config file: <code className="text-foreground">{active.configPath}</code>
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {active.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {active.externalDocs && active.externalDocs.length > 0 ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {active.externalDocs.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-violet-300 underline"
                >
                  {link.label}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border/60 p-0.5 text-sm">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 ${!showDiazites ? "bg-white/10 text-foreground" : "text-muted-foreground"}`}
              onClick={() => setShowDiazites(false)}
            >
              Zernio MCP
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 ${showDiazites ? "bg-white/10 text-foreground" : "text-muted-foreground"}`}
              onClick={() => setShowDiazites(true)}
            >
              Diazites MCP (optional)
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => copy(active.id, snippet)}
          >
            <Copy className="mr-2 size-3.5" aria-hidden />
            {copied === active.id ? "Copied" : "Copy config"}
          </Button>
        </div>

        <pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-muted-foreground">
          {snippet}
        </pre>

        <div className="space-y-3 border-t border-border/60 pt-4">
          <h3 className="text-sm font-medium">FAQ</h3>
          <dl className="space-y-3">
            {MCP_DOC_FAQ.map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-medium text-foreground">{item.q}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
