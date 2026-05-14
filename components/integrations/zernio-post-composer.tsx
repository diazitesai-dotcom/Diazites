"use client";

import { useMemo, useState, useTransition } from "react";
import { PenSquare, Send } from "lucide-react";

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
import { publishZernioPostAction } from "@/services/integrations/zernio.actions";

type ZernioTarget = {
  id: string;
  platform: string;
  label: string;
};

type ZernioPostComposerProps = {
  availableAccounts: ZernioTarget[];
};

const MAX_LEN = 4000;

export function ZernioPostComposer({ availableAccounts }: ZernioPostComposerProps) {
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"now" | "scheduled" | "draft">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    if (!content.trim()) {
      setFeedback({ kind: "err", message: "Write something to post." });
      return;
    }
    if (selected.size === 0) {
      setFeedback({ kind: "err", message: "Pick at least one target account." });
      return;
    }
    if (mode === "scheduled" && !scheduledFor) {
      setFeedback({ kind: "err", message: "Pick a date/time." });
      return;
    }

    const targets = availableAccounts
      .filter((a) => selected.has(a.id))
      .map((a) => ({ platform: a.platform, accountId: a.id }));

    const fd = new FormData();
    fd.set("content", content);
    fd.set("schedule_mode", mode);
    fd.set("targets", JSON.stringify(targets));
    if (mode === "scheduled") {
      fd.set("scheduled_for", new Date(scheduledFor).toISOString());
    }

    startTransition(async () => {
      const res = await publishZernioPostAction(fd);
      if (!res.success) {
        setFeedback({ kind: "err", message: res.error });
        return;
      }
      setFeedback({
        kind: "ok",
        message:
          mode === "now"
            ? `Published. Zernio post id ${shorten(res.data.postId)}.`
            : mode === "scheduled"
            ? `Scheduled. Zernio post id ${shorten(res.data.postId)}.`
            : `Saved as draft. Zernio post id ${shorten(res.data.postId)}.`,
      });
      setContent("");
      setSelected(new Set());
      setScheduledFor("");
    });
  }

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}
            aria-hidden
          >
            <PenSquare className="size-5" />
          </span>
          <div className="space-y-1">
            <CardTitle className="text-lg">Compose &amp; cross-post via Zernio</CardTitle>
            <CardDescription>
              Write once, fan out to every connected social account. Use this
              for one-off posts outside the engine&apos;s scheduled creative —
              announcements, updates, replies, etc.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="zern_compose_content">Content</Label>
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  content.length > MAX_LEN
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {content.length}/{MAX_LEN}
              </span>
            </div>
            <textarea
              id="zern_compose_content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              placeholder="What do you want to post?"
              rows={4}
              className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-500/20"
            />
          </div>

          <fieldset className="space-y-2">
            <div className="flex items-center justify-between">
              <legend className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Target accounts ({selected.size}/{availableAccounts.length})
              </legend>
              <div className="flex gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    setSelected(new Set(availableAccounts.map((a) => a.id)))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  Select all
                </button>
                <span className="text-border">·</span>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>

            {grouped.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 bg-background/30 px-3 py-2 text-xs text-muted-foreground">
                No Zernio social accounts visible yet. Connect at least one at
                zernio.com to enable cross-posting.
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
                  {m === "now"
                    ? "Publish now"
                    : m === "scheduled"
                    ? "Schedule"
                    : "Save as draft"}
                </button>
              ))}
            </div>

            {mode === "scheduled" ? (
              <div className="space-y-1.5">
                <Label htmlFor="zern_compose_scheduled">Publish at</Label>
                <Input
                  id="zern_compose_scheduled"
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
              disabled={pending || !content.trim() || selected.size === 0}
            >
              <Send className="size-3.5" aria-hidden />
              {pending
                ? "Posting…"
                : mode === "now"
                ? `Publish to ${selected.size} account${selected.size === 1 ? "" : "s"}`
                : mode === "scheduled"
                ? "Schedule"
                : "Save draft"}
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

function shorten(s: string): string {
  return s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s;
}
