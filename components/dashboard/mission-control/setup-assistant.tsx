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
  Workflow,
} from "lucide-react";

import {
  generateFunnelPlanAction,
  launchFunnelStepAction,
  runSetupStepAction,
  type FunnelStepKind,
  type SetupArtifact,
  type SetupStepResult,
} from "@/actions/mission-control-setup.actions";
import { sendOperatorMessageAction } from "@/actions/operator.actions";
import { useAgentDeploymentOptional } from "@/components/agents/agent-deployment-provider";
import { OperatorMessageBubble } from "@/components/ai-operator/operator-message-bubble";
import { SetupArtifactCard } from "@/components/dashboard/mission-control/setup-artifact-card";
import {
  FunnelPreview,
  type LiveFunnelStep,
} from "@/components/dashboard/mission-control/funnel-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OnboardingChecklistKey, PostSetupChecklistItem } from "@/lib/onboarding/draft";
import { SETUP_STEP_PROMPTS } from "@/lib/onboarding/setup-assistant-steps";
import type { OperatorAction, OperatorMessage } from "@/types/ai-operator";
import { cn } from "@/lib/utils";

/** Chat message that can optionally carry a rich artifact card (e.g. a built funnel). */
type ChatMessage = OperatorMessage & { artifact?: SetupArtifact };

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

function loadStoredMessages(key: string): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as ChatMessage[];
    }
  } catch {
    // ignore malformed storage
  }
  return null;
}

function loadStoredFunnel(key: string): LiveFunnelStep[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${key}:funnel`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as LiveFunnelStep[];
  } catch {
    // ignore
  }
  return null;
}

/** Maps a checklist asset to the funnel step it seeds. */
const CHECKLIST_TO_FUNNEL: Partial<Record<OnboardingChecklistKey, FunnelStepKind>> = {
  landing_page_ready: "landing_page",
  campaign_built: "campaign",
  agents_assigned: "ad_setup",
  ai_active: "follow_up",
};

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

  const welcomeMessage: ChatMessage = {
    id: "setup-welcome",
    role: "assistant",
    mode: "operator",
    content: allDone
      ? `Nice work${businessName ? `, ${businessName}` : ""} — your workspace is fully set up. Ask me anything or tell me what you want to launch next.`
      : `Hi${businessName ? ` ${businessName}` : ""} — I'm your setup specialist. I'll build everything right here. Hit "Create complete funnel" and I'll generate your landing page, agents, and campaign in one go.`,
  };

  const [open, setOpen] = useState(focused || !allDone);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [funnel, setFunnel] = useState<LiveFunnelStep[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  // Only persist once we've attempted to restore, so we never clobber saved chat.
  const hydratedRef = useRef(false);

  // Restore any saved conversation + funnel after mount (avoids SSR mismatch).
  useEffect(() => {
    const stored = loadStoredMessages(storageKey);
    if (stored) {
      idRef.current = stored.length;
      setMessages(stored);
    }
    const storedFunnel = loadStoredFunnel(storageKey);
    if (storedFunnel) setFunnel(storedFunnel);
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

  // Persist the funnel plan so it survives navigation too.
  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;
    try {
      if (funnel && funnel.length > 0) {
        window.localStorage.setItem(`${storageKey}:funnel`, JSON.stringify(funnel));
      } else {
        window.localStorage.removeItem(`${storageKey}:funnel`);
      }
    } catch {
      // non-fatal
    }
  }, [funnel, storageKey]);

  function nextId(prefix: string) {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }

  function clearConversation() {
    setMessages([welcomeMessage]);
    setFunnel(null);
    idRef.current = 0;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem(`${storageKey}:funnel`);
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
        } as ChatMessage,
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

  function resultToMessage(result: SetupStepResult): ChatMessage {
    if (result.status === "manual") {
      return {
        id: nextId("a"),
        role: "assistant",
        mode: "operator",
        content: `${result.title} — ${result.detail}`,
        actions: [
          { id: nextId("act"), label: "Open the page", kind: "navigate", href: result.href },
        ],
      };
    }
    return {
      id: nextId("a"),
      role: "assistant",
      mode: result.status === "done" ? "operator" : "support",
      content: `${result.status === "done" ? "✅ " : "⚠️ "}${result.title} — ${result.detail}`,
      artifact: result.status === "done" ? result.artifact : undefined,
    };
  }

  function pushAssistant(content: string, mode: "operator" | "support" = "operator") {
    setMessages((m) => [...m, { id: nextId("a"), role: "assistant", mode, content } as ChatMessage]);
  }

  /** Auto-generates a complete funnel plan around the (optional) seed asset. */
  async function startFunnel(seedKind?: FunnelStepKind, seedLabel?: string) {
    if (pending) return;
    setMessages((m) => [
      ...m,
      {
        id: nextId("u"),
        role: "user",
        content: seedLabel ? `Create ${seedLabel}` : "Create a complete funnel",
      },
    ]);
    setPending(true);
    scrollToBottom();

    try {
      const result = await generateFunnelPlanAction(seedKind);
      if (!result.ok) {
        pushAssistant(`I couldn't draft the funnel — ${result.error}`, "support");
        return;
      }
      const live: LiveFunnelStep[] = result.steps.map((s) => ({ ...s, status: "suggested" }));
      setFunnel(live);
      pushAssistant(
        `Here's the complete funnel I'd build for ${result.businessName}. Review it below — reorder, edit any step, then launch them one at a time or all at once.`,
      );
    } catch {
      pushAssistant("I hit a snag drafting the funnel. Try again in a moment.", "support");
    } finally {
      setPending(false);
      scrollToBottom();
    }
  }

  function patchStep(id: string, patch: Partial<LiveFunnelStep>) {
    setFunnel((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, ...patch } : s)) : prev));
  }

  /** Launches a single funnel step inline; updates its status + artifact. */
  async function launchStep(step: LiveFunnelStep): Promise<boolean> {
    patchStep(step.id, { status: "building", error: undefined });
    try {
      const result = await launchFunnelStepAction(step.kind, {
        budget: step.budget,
        platform: step.platform,
      });
      if (result.status === "done") {
        patchStep(step.id, { status: "ready", artifact: result.artifact });
        router.refresh();
        return true;
      }
      if (result.status === "manual") {
        patchStep(step.id, { status: "suggested" });
        pushAssistant(`${result.title} — ${result.detail}`);
        router.push(withSetupReturn(result.href));
        return false;
      }
      patchStep(step.id, { status: "error", error: result.detail });
      return false;
    } catch {
      patchStep(step.id, { status: "error", error: "Something went wrong. Try again." });
      return false;
    }
  }

  async function launchStepWithPending(step: LiveFunnelStep) {
    if (pending) return;
    setPending(true);
    try {
      await launchStep(step);
    } finally {
      setPending(false);
    }
  }

  /** Launches every not-yet-built step in order. */
  async function launchAllSteps() {
    if (pending || !funnel) return;
    setPending(true);
    try {
      const queue = funnel.filter((s) => s.status !== "ready");
      for (const step of queue) {
        await launchStep(step);
      }
      pushAssistant("Your funnel is live — every step is set up and connected. 🚀");
    } finally {
      setPending(false);
      scrollToBottom();
    }
  }

  function discardStep(id: string) {
    setFunnel((prev) => {
      const next = prev ? prev.filter((s) => s.id !== id) : prev;
      return next && next.length > 0 ? next : null;
    });
  }

  /** Runs a single setup step inline on Mission Control (no navigation). */
  async function runStep(key: OnboardingChecklistKey, label: string) {
    if (pending) return;
    setMessages((m) => [
      ...m,
      { id: nextId("u"), role: "user", content: SETUP_STEP_PROMPTS[key]?.cta ?? label },
    ]);
    setPending(true);
    scrollToBottom();

    try {
      const result = await runSetupStepAction(key);
      setMessages((m) => [...m, resultToMessage(result)]);
      if (result.status === "manual") {
        router.push(withSetupReturn(result.href));
      } else {
        router.refresh();
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId("e"),
          role: "assistant",
          mode: "support",
          content: "I hit a snag setting that up. Try again in a moment.",
        } as ChatMessage,
      ]);
    } finally {
      setPending(false);
      scrollToBottom();
    }
  }

  /** Runs every remaining step inline, in order, keeping the user on Mission Control. */
  async function runAutonomousSetup() {
    if (pending) return;
    const keys = remaining.map((r) => r.key);
    setMessages((m) => [
      ...m,
      { id: nextId("u"), role: "user", content: "Set everything up for me" },
    ]);
    setPending(true);
    scrollToBottom();

    try {
      // Manual steps (e.g. connecting Zernio) can't be automated — they surface
      // as a message with an "Open the page" action, while everything else is
      // set up inline without leaving Mission Control.
      for (const key of keys) {
        const result = await runSetupStepAction(key);
        setMessages((m) => [...m, resultToMessage(result)]);
        scrollToBottom();
      }
      router.refresh();
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId("e"),
          role: "assistant",
          mode: "support",
          content: "Something interrupted the setup. I've done what I could — try the remaining steps again.",
        } as ChatMessage,
      ]);
    } finally {
      setPending(false);
      scrollToBottom();
    }
  }

  return (
    <Card className="overflow-hidden border-violet-500/25 bg-gradient-to-br from-violet-950/30 via-card to-cyan-950/20">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/35 bg-violet-500/15">
            <span className="absolute inset-0 animate-pulse rounded-xl bg-violet-500/10" aria-hidden />
            <Sparkles className="relative size-5 text-violet-200" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold">
              AI Setup Assistant
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </p>
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
              <button
                type="button"
                disabled={pending}
                onClick={() => startFunnel()}
                className="group relative w-full overflow-hidden rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/25 to-cyan-500/25 px-4 py-3 text-left transition-all hover:border-violet-300/60 disabled:opacity-60"
              >
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  aria-hidden
                />
                <span className="relative flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                    <Workflow className="size-5 text-violet-100" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      Create complete funnel
                    </span>
                    <span className="block text-[11px] text-violet-100/70">
                      Landing page + AI agents + campaign — built right here
                    </span>
                  </span>
                  <ChevronRight className="ml-auto size-4 text-violet-100/70 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>

              {!allDone ? (
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-white/10 text-xs"
                    disabled={pending}
                    onClick={runAutonomousSetup}
                  >
                    <Wand2 className="mr-1 size-3.5" />
                    Set up step by step
                  </Button>
                  {remaining.map((item) => {
                    const seedKind = CHECKLIST_TO_FUNNEL[item.key];
                    return (
                      <Button
                        key={item.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-white/10 text-xs"
                        disabled={pending}
                        onClick={() =>
                          seedKind
                            ? startFunnel(seedKind, item.label.toLowerCase())
                            : runStep(item.key, item.label)
                        }
                      >
                        <Circle className="mr-1 size-3 text-muted-foreground" />
                        {SETUP_STEP_PROMPTS[item.key]?.cta ?? item.label}
                      </Button>
                    );
                  })}
                </div>
              ) : null}

              <div
                ref={scrollRef}
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
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
                    <div key={m.id} className="space-y-2">
                      <OperatorMessageBubble message={m} onAction={handleAction} />
                      {m.artifact ? <SetupArtifactCard artifact={m.artifact} /> : null}
                    </div>
                  ),
                )}
                {pending ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.15s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-cyan-400" />
                    </span>
                    <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-transparent">
                      Building that for you…
                    </span>
                  </div>
                ) : null}
              </div>

              {funnel && funnel.length > 0 ? (
                <FunnelPreview
                  steps={funnel}
                  pending={pending}
                  onReorder={(next) => setFunnel(next)}
                  onLaunch={launchStepWithPending}
                  onLaunchAll={launchAllSteps}
                  onDiscard={discardStep}
                  onEdit={patchStep}
                />
              ) : null}

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
