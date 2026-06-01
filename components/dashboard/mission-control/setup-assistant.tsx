"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";

import { sendOperatorMessageAction } from "@/actions/operator.actions";
import { useAgentDeploymentOptional } from "@/components/agents/agent-deployment-provider";
import { OperatorMessageBubble } from "@/components/ai-operator/operator-message-bubble";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PostSetupChecklistItem } from "@/lib/onboarding/draft";
import {
  SETUP_STEP_PROMPTS,
  buildAutonomousSetupPrompt,
} from "@/lib/onboarding/setup-assistant-steps";
import type {
  OperatorAction,
  OperatorAssistantMessage,
  OperatorMessage,
} from "@/types/ai-operator";
import { cn } from "@/lib/utils";

type SetupAssistantProps = {
  items: PostSetupChecklistItem[];
  businessName?: string;
  /** Focused Mission Control mode — larger, always open, no hide control. */
  focused?: boolean;
};

/** Adds a marker so sub-pages can offer a "back to setup" return path. */
function withSetupReturn(href: string): string {
  if (!href.startsWith("/")) return href;
  const [path, query] = href.split("?");
  const params = new URLSearchParams(query ?? "");
  params.set("setup", "1");
  return `${path}?${params.toString()}`;
}

/** Scope persisted chat per workspace so it survives navigation but not account switches. */
function storageKeyFor(businessName?: string): string {
  const slug = (businessName ?? "default").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `diazites:setup-assistant:${slug}`;
}

function loadStoredMessages(key: string): OperatorMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as OperatorMessage[];
    }
  } catch {
    // ignore malformed storage
  }
  return null;
}

export function SetupAssistant({ items, businessName, focused = false }: SetupAssistantProps) {
  const router = useRouter();
  const pathname = usePathname();
  const deployment = useAgentDeploymentOptional();

  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const remaining = items.filter((i) => !i.done);
  const allDone = remaining.length === 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const storageKey = storageKeyFor(businessName);

  const welcomeMessage: OperatorAssistantMessage = {
    id: "setup-welcome",
    role: "assistant",
    mode: "operator",
    content: allDone
      ? `Nice work${businessName ? `, ${businessName}` : ""} — your workspace is fully set up. Ask me anything or tell me what you want to launch next.`
      : `Hi${businessName ? ` ${businessName}` : ""} — I'm your setup specialist. I'll get your workspace fully launched. Pick a step below or hit "Set everything up for me" and I'll handle it with you.`,
  };

  const [open, setOpen] = useState(focused || !allDone);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<OperatorMessage[]>([welcomeMessage]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  // Only persist once we've attempted to restore, so we never clobber saved chat.
  const hydratedRef = useRef(false);

  // Restore any saved conversation after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    const stored = loadStoredMessages(storageKey);
    if (stored) {
      idRef.current = stored.length;
      setMessages(stored);
    }
    hydratedRef.current = true;
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist conversation so it survives navigating away and back.
  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // storage full / unavailable — non-fatal
    }
  }, [messages, storageKey]);

  function nextId(prefix: string) {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }

  function clearConversation() {
    setMessages([welcomeMessage]);
    idRef.current = 0;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setMessages((m) => [...m, { id: nextId("u"), role: "user", content: trimmed }]);
    setInput("");
    setPending(true);
    scrollToBottom();

    try {
      const reply = await sendOperatorMessageAction(trimmed, pathname);
      setMessages((m) => [...m, reply]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId("e"),
          role: "assistant",
          mode: "support",
          content:
            "I hit a snag setting that up. Try again, or open the step directly from the buttons above.",
        } as OperatorAssistantMessage,
      ]);
    } finally {
      setPending(false);
      scrollToBottom();
    }
  }

  function handleAction(action: OperatorAction) {
    if ((action.kind === "navigate" || action.kind === "open_diagnostics" || action.kind === "approve") && action.href) {
      router.push(withSetupReturn(action.href));
      return;
    }
    if (action.kind === "navigate" && !action.href) {
      router.push(withSetupReturn("/dashboard/integrations"));
      return;
    }
    if (action.kind === "deploy" && action.deploy) {
      if (deployment) deployment.openDeployment(action.deploy);
      else router.push(withSetupReturn("/dashboard/agents"));
      return;
    }
    if (action.kind === "open_diagnostics") {
      router.push(withSetupReturn("/dashboard/integrations"));
    }
  }

  function runAutonomousSetup() {
    const keys = remaining.map((r) => r.key);
    void submit(buildAutonomousSetupPrompt(keys));
  }

  return (
    <Card className="overflow-hidden border-violet-500/25 bg-gradient-to-br from-violet-950/30 via-card to-cyan-950/20">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/35 bg-violet-500/15">
            <Sparkles className="size-5 text-violet-200" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Setup Assistant</p>
            <p className="text-[11px] text-muted-foreground">
              {allDone
                ? "Workspace ready — ask me to launch anything next."
                : `${done} of ${total} launch steps complete — I'll finish the rest with you.`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs text-muted-foreground hover:text-foreground"
              onClick={clearConversation}
              disabled={pending}
            >
              <RotateCcw className="mr-1 size-3.5" />
              Reset
            </Button>
          ) : null}
          {focused ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Hide" : "Open"}
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-4">
              {!allDone ? (
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="gradient"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    disabled={pending}
                    onClick={runAutonomousSetup}
                  >
                    <Wand2 className="mr-1 size-3.5" />
                    Set everything up for me
                  </Button>
                  {remaining.map((item) => (
                    <Button
                      key={item.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-white/10 text-xs"
                      disabled={pending}
                      onClick={() => submit(SETUP_STEP_PROMPTS[item.key]?.prompt ?? item.label)}
                    >
                      <Circle className="mr-1 size-3 text-muted-foreground" />
                      {SETUP_STEP_PROMPTS[item.key]?.cta ?? item.label}
                    </Button>
                  ))}
                </div>
              ) : null}

              <div
                ref={scrollRef}
                className={cn(
                  "min-h-[120px] space-y-3 overflow-y-auto rounded-xl border border-white/[0.06] bg-background/40 p-3",
                  focused ? "max-h-[460px]" : "max-h-[340px]",
                )}
              >
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <p className="max-w-[88%] rounded-xl rounded-br-sm bg-violet-600/25 px-3 py-2 text-sm text-violet-50">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <OperatorMessageBubble key={m.id} message={m} onAction={handleAction} />
                  ),
                )}
                {pending ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin text-violet-400" />
                    Setting that up…
                  </div>
                ) : null}
              </div>

              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(input);
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me what to set up…"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-background/80 px-3 py-2.5 text-sm outline-none ring-violet-500/30 placeholder:text-muted-foreground focus:ring-2"
                  disabled={pending}
                />
                <Button
                  type="submit"
                  variant="gradient"
                  size="icon"
                  className="size-10 shrink-0 rounded-xl"
                  disabled={pending || !input.trim()}
                  aria-label="Send"
                >
                  <Send className="size-4" />
                </Button>
              </form>

              {!allDone ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {remaining.map((item) => (
                    <button
                      key={`open-${item.key}`}
                      type="button"
                      onClick={() => router.push(withSetupReturn(item.href))}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-violet-200"
                    >
                      Open {item.label.toLowerCase()}
                      <ChevronRight className="size-3" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  All launch steps complete.
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
