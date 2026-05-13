"use client";

import { useState, useTransition } from "react";
import { Plus, Power, Trash2, Webhook, MessageSquare } from "lucide-react";

import {
  createAutomationRuleAction,
  deleteAutomationRuleAction,
  toggleAutomationRuleAction,
} from "@/services/automations/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutomationRuleRow } from "@/repositories/automation.repository";

type AutomationRunRow = {
  id: string;
  rule_id: string;
  event_type: string;
  status: "success" | "error" | "skipped";
  detail: string | null;
  http_status: number | null;
  created_at: string;
};

type Props = {
  rules: AutomationRuleRow[];
  recentRuns: AutomationRunRow[];
  triggers: ReadonlyArray<string>;
};

export function AutomationsManager({ rules, recentRuns, triggers }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"webhook" | "sms">("webhook");

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await createAutomationRuleAction(fd);
      if (!result.success) setError(result.error);
      else form.reset();
    });
  }

  function onToggle(id: string, current: boolean) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("enabled", String(!current));
    startTransition(async () => {
      await toggleAutomationRuleAction(fd);
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteAutomationRuleAction(fd);
    });
  }

  return (
    <div className="space-y-8">
      {/* Existing rules */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Rules
        </h3>
        {rules.length === 0 ? (
          <Card className="border-dashed border-white/[0.08]">
            <CardContent className="py-8 text-sm text-muted-foreground">
              No automation rules yet. Add one below to react to engine events.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {rule.action_type === "webhook" ? (
                      <Webhook className="size-3.5 text-violet-300" aria-hidden />
                    ) : (
                      <MessageSquare className="size-3.5 text-violet-300" aria-hidden />
                    )}
                    <p className="truncate font-medium">{rule.name}</p>
                    {rule.enabled ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Trigger: <span className="font-mono">{rule.trigger_event}</span>
                    {" · "}
                    Action: {rule.action_type}{" "}
                    <span className="opacity-70">
                      ({summarizeConfig(rule.action_type, rule.action_config)})
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onToggle(rule.id, rule.enabled)}
                    disabled={isPending}
                  >
                    <Power className="mr-1 size-3.5" aria-hidden />
                    {rule.enabled ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(rule.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New rule form */}
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base">New automation rule</CardTitle>
          <CardDescription>
            When an engine event fires, send a webhook or SMS automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Notify Slack on new lead" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trigger_event">Trigger event</Label>
                <select
                  id="trigger_event"
                  name="trigger_event"
                  className="h-9 w-full rounded-md border border-border/60 bg-background/80 px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  defaultValue="LEAD_CREATED"
                >
                  {triggers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="action_type">Action</Label>
                <select
                  id="action_type"
                  name="action_type"
                  className="h-9 w-full rounded-md border border-border/60 bg-background/80 px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as "webhook" | "sms")}
                >
                  <option value="webhook">Webhook</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="target">
                  {actionType === "webhook" ? "Webhook URL" : "Phone number"}
                </Label>
                <Input
                  id="target"
                  name="target"
                  placeholder={
                    actionType === "webhook"
                      ? "https://hooks.example.com/abc"
                      : "+15551234567"
                  }
                  required
                />
              </div>
            </div>

            {error ? (
              <p className="text-xs text-red-300">{error}</p>
            ) : null}

            <div>
              <Button type="submit" size="sm" disabled={isPending}>
                <Plus className="mr-1 size-3.5" aria-hidden /> Add rule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent runs */}
      {recentRuns.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recent runs
          </h3>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">HTTP</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((r) => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.event_type}</td>
                    <td className="px-3 py-2">
                      <span className={runStatusPillClass(r.status)}>{r.status}</span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-xs">
                      {r.http_status ?? "—"}
                    </td>
                    <td className="px-3 py-2 max-w-md truncate text-xs text-muted-foreground">
                      {r.detail ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function summarizeConfig(
  kind: "webhook" | "sms",
  config: Record<string, unknown>,
): string {
  if (kind === "webhook") {
    const url = config["url"];
    return typeof url === "string" ? url : "url not set";
  }
  const to = config["to"];
  return typeof to === "string" ? to : "phone not set";
}

function runStatusPillClass(status: "success" | "error" | "skipped"): string {
  const base = "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ";
  switch (status) {
    case "success":
      return base + "bg-emerald-500/15 text-emerald-300";
    case "error":
      return base + "bg-red-500/15 text-red-300";
    case "skipped":
      return base + "bg-muted text-muted-foreground";
  }
}
