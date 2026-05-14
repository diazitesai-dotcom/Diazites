"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, Trash2, Zap } from "lucide-react";

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
import { cn } from "@/lib/utils";
import {
  disconnectZapierRuleAction,
  subscribeZapierAction,
  testZapierWebhookAction,
} from "@/services/integrations/zapier.actions";

type ZapierEventOption = {
  type: string;
  label: string;
  description: string;
};

type ZapierRuleSummary = {
  id: string;
  name: string;
  triggerEvent: string;
  url: string;
  enabled: boolean;
};

type ZapierConnectorProps = {
  events: ZapierEventOption[];
  rules: ZapierRuleSummary[];
};

export function ZapierConnector({ events, rules }: ZapierConnectorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [testing, startTesting] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [result, setResult] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(
    new Set([events[0]?.type, events[2]?.type].filter(Boolean) as string[]),
  );

  function toggleEvent(type: string) {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    setResult(null);
    selectedEvents.forEach((e) => formData.append("events", e));
    startTransition(async () => {
      const res = await subscribeZapierAction(formData);
      if (!res.success) {
        setResult({ kind: "err", message: res.error });
        return;
      }
      setResult({
        kind: "ok",
        message: `Subscribed ${res.data.created} event${res.data.created === 1 ? "" : "s"}.`,
      });
      setUrl("");
      setName("");
      setSelectedEvents(new Set());
      router.refresh();
    });
  }

  function handleTest() {
    if (!url.trim()) {
      setResult({ kind: "err", message: "Paste a Zapier webhook URL first." });
      return;
    }
    setResult(null);
    const fd = new FormData();
    fd.set("url", url);
    startTesting(async () => {
      const res = await testZapierWebhookAction(fd);
      if (!res.success) {
        setResult({ kind: "err", message: res.error });
        return;
      }
      setResult({
        kind: "ok",
        message: `Test fired (HTTP ${res.data.httpStatus}). Check your Zap for the sample event.`,
      });
    });
  }

  function handleDelete(id: string) {
    setResult(null);
    setDeletingId(id);
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await disconnectZapierRuleAction(fd);
      setDeletingId(null);
      if (!res.success) {
        setResult({ kind: "err", message: res.error });
        return;
      }
      setResult({ kind: "ok", message: "Zapier subscription removed." });
      router.refresh();
    });
  }

  const groupedRules = groupRulesByUrl(rules);

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #FF4F00, #FF8A2A)" }}
              aria-hidden
            >
              <Zap className="size-5" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-lg">Zapier</CardTitle>
              <CardDescription className="max-w-xl">
                Forward engine events to any of Zapier&apos;s 8,000+ apps — Meta
                Ads, Google Ads, TikTok Ads, Google Sheets, Slack, CRMs, etc.
                Paste a <span className="font-mono">hooks.zapier.com</span>{" "}
                catch-hook URL and pick which events to send.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="zap_name">Zap name</Label>
              <Input
                id="zap_name"
                name="name"
                placeholder="Diazites → Meta Ads"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zap_url">Zapier webhook URL</Label>
              <Input
                id="zap_url"
                name="url"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Events to forward
            </legend>
            <div className="grid gap-2 md:grid-cols-2">
              {events.map((evt) => {
                const checked = selectedEvents.has(evt.type);
                return (
                  <button
                    key={evt.type}
                    type="button"
                    onClick={() => toggleEvent(evt.type)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border bg-background/40 px-3 py-2.5 text-left text-xs transition",
                      checked
                        ? "border-orange-500/50 bg-orange-500/[0.06]"
                        : "border-border/50 hover:border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                        checked
                          ? "border-orange-400 bg-orange-500/30"
                          : "border-border bg-background",
                      )}
                    >
                      {checked ? (
                        <CheckCircle2 className="size-3 text-orange-200" aria-hidden />
                      ) : null}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-semibold text-foreground">
                        {evt.type}
                      </p>
                      <p className="text-[11px] font-medium text-foreground/90">
                        {evt.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {evt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              variant="gradient"
              disabled={pending || selectedEvents.size === 0 || !url || !name}
            >
              {pending ? "Saving…" : `Subscribe ${selectedEvents.size} event${selectedEvents.size === 1 ? "" : "s"}`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !url}
              className="rounded-xl"
            >
              {testing ? "Firing…" : "Send test event"}
            </Button>
            <a
              href="https://zapier.com/apps/webhook/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Where do I get this URL?
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>
        </form>

        {result ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-xs",
              result.kind === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {result.message}
          </p>
        ) : null}

        {groupedRules.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Active subscriptions
            </p>
            {groupedRules.map((group) => (
              <div
                key={group.url}
                className="rounded-xl border border-border/60 bg-card/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {group.url}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {group.rules.map((r) => (
                        <span
                          key={r.id}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            r.enabled
                              ? "border-orange-500/40 bg-orange-500/15 text-orange-200"
                              : "border-border/60 text-muted-foreground",
                          )}
                        >
                          {r.triggerEvent}
                          <button
                            type="button"
                            disabled={deletingId === r.id}
                            onClick={() => handleDelete(r.id)}
                            className="ml-0.5 inline-flex items-center text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${r.triggerEvent}`}
                          >
                            <Trash2 className="size-3" aria-hidden />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <details className="rounded-xl border border-border/40 bg-background/30 p-3 text-xs">
          <summary className="cursor-pointer font-medium text-foreground">
            How to set up a Zap (3 minutes)
          </summary>
          <ol className="mt-3 space-y-1.5 pl-4 text-muted-foreground [list-style:decimal]">
            <li>
              In Zapier, create a new Zap. For the <em>Trigger</em>, choose{" "}
              <span className="font-mono">Webhooks by Zapier → Catch Hook</span>{" "}
              and copy the custom webhook URL.
            </li>
            <li>
              Paste that URL above, give the Zap a name, pick which events to
              forward, and click <span className="font-medium">Subscribe</span>.
            </li>
            <li>
              Click <span className="font-medium">Send test event</span>. The
              sample event appears in your Zap so Zapier can map fields.
            </li>
            <li>
              In Zapier, add an <em>Action</em> (e.g. Facebook Lead Ads, Google
              Ads, Slack, Google Sheets) and map fields like{" "}
              <span className="font-mono">{`{{lead.name}}`}</span>,{" "}
              <span className="font-mono">{`{{lead.phone}}`}</span>,{" "}
              <span className="font-mono">{`{{payload.publicUrl}}`}</span>.
            </li>
            <li>Turn the Zap on. Live events will start flowing immediately.</li>
          </ol>
        </details>
      </CardContent>
    </Card>
  );
}

function groupRulesByUrl(rules: ZapierRuleSummary[]): Array<{
  url: string;
  rules: ZapierRuleSummary[];
}> {
  const map = new Map<string, ZapierRuleSummary[]>();
  for (const r of rules) {
    const arr = map.get(r.url) ?? [];
    arr.push(r);
    map.set(r.url, arr);
  }
  return Array.from(map.entries()).map(([url, rules]) => ({ url, rules }));
}
