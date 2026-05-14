"use client";

import { useMemo, useState, useTransition } from "react";
import { Rocket } from "lucide-react";

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
import { pushZernioCreativeAction } from "@/services/ads/actions";

type ZernioTarget = {
  id: string;
  platform: string;
  label: string;
};

type PushZernioWinnerProps = {
  engineRunId: string;
  winningAssetId: string;
  defaultName: string;
  availableAccounts: ZernioTarget[];
};

export function PushZernioWinner({
  engineRunId,
  winningAssetId,
  defaultName,
  availableAccounts,
}: PushZernioWinnerProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(availableAccounts.map((a) => a.id)),
  );
  const [mode, setMode] = useState<"now" | "scheduled" | "draft">("now");
  const [scheduledFor, setScheduledFor] = useState<string>("");

  const grouped = useMemo(() => {
    const byPlatform = new Map<string, ZernioTarget[]>();
    for (const a of availableAccounts) {
      const arr = byPlatform.get(a.platform) ?? [];
      arr.push(a);
      byPlatform.set(a.platform, arr);
    }
    return Array.from(byPlatform.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [availableAccounts]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(availableAccounts.map((a) => a.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    if (selected.size === 0) {
      setFeedback({
        kind: "err",
        message: "Pick at least one target account.",
      });
      return;
    }
    if (mode === "scheduled" && !scheduledFor) {
      setFeedback({
        kind: "err",
        message: "Pick a date/time for the scheduled post.",
      });
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("engine_run_id", engineRunId);
    fd.set("winning_asset_id", winningAssetId);
    fd.set("mode", mode);
    if (mode === "scheduled") {
      const iso = new Date(scheduledFor).toISOString();
      fd.set("scheduled_for", iso);
    }
    const targets = availableAccounts
      .filter((a) => selected.has(a.id))
      .map((a) => ({ platform: a.platform, accountId: a.id }));
    fd.set("targets", JSON.stringify(targets));

    startTransition(async () => {
      const res = await pushZernioCreativeAction(fd);
      if (!res.success) {
        setFeedback({ kind: "err", message: res.error });
        return;
      }
      setFeedback({
        kind: "ok",
        message: `${capitalize(res.data.mode)} on ${res.data.targets.length} account${res.data.targets.length === 1 ? "" : "s"} — Zernio post ${shorten(res.data.zernioPostId)}.`,
      });
    });
  }

  return (
    <Card className="border-violet-500/30 bg-violet-500/[0.04]">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}
            aria-hidden
          >
            <Rocket className="size-5" />
          </span>
          <div className="space-y-1">
            <CardTitle className="text-lg">
              Push the engine&apos;s winner via Zernio
            </CardTitle>
            <CardDescription>
              Cross-post the winning ad copy to every social account Zernio
              has connected. One press fans out across platforms; the
              campaign is recorded so the optimization loop can track it.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="zern_ad_name">Campaign name</Label>
              <Input
                id="zern_ad_name"
                name="name"
                defaultValue={defaultName}
                placeholder="Engine campaign (Zernio)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zern_daily_budget">Daily budget (USD)</Label>
              <Input
                id="zern_daily_budget"
                name="daily_budget_usd"
                type="number"
                step="1"
                min="1"
                defaultValue={20}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <div className="flex items-center justify-between">
              <legend className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Target accounts ({selected.size}/{availableAccounts.length})
              </legend>
              <div className="flex gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Select all
                </button>
                <span className="text-border">·</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>

            {grouped.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 bg-background/30 px-3 py-2 text-xs text-muted-foreground">
                No Zernio social accounts visible. Connect at least one at
                zernio.com.
              </p>
            ) : (
              <div className="space-y-3">
                {grouped.map(([platform, accounts]) => (
                  <div key={platform} className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {platform}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {accounts.map((a) => {
                        const checked = selected.has(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggle(a.id)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                              checked
                                ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                                : "border-border/60 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              When
            </legend>
            <div className="flex flex-wrap gap-2">
              {(["now", "scheduled", "draft"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition",
                    mode === m
                      ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "now" ? "Publish now" : m === "scheduled" ? "Schedule" : "Save as draft"}
                </button>
              ))}
            </div>

            {mode === "scheduled" ? (
              <div className="space-y-1.5">
                <Label htmlFor="zern_scheduled_for">Publish at</Label>
                <Input
                  id="zern_scheduled_for"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  required
                />
              </div>
            ) : null}
          </fieldset>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              variant="gradient"
              disabled={pending || availableAccounts.length === 0}
            >
              {pending
                ? "Pushing…"
                : mode === "now"
                ? `Publish to ${selected.size} account${selected.size === 1 ? "" : "s"}`
                : mode === "scheduled"
                ? "Schedule via Zernio"
                : "Save draft in Zernio"}
            </Button>
            {feedback ? (
              <p
                className={cn(
                  "text-xs",
                  feedback.kind === "ok" ? "text-emerald-300" : "text-red-300",
                )}
              >
                {feedback.message}
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shorten(s: string): string {
  return s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s;
}
