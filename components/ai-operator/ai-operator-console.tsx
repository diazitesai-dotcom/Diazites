"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Sparkles, Terminal, X } from "lucide-react";

import { getOperatorContextAction, sendOperatorMessageAction } from "@/actions/operator.actions";
import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import {
  OPERATOR_CLOSE_EVENT,
  OPERATOR_OPEN_EVENT,
  OPERATOR_TOGGLE_EVENT,
} from "@/lib/ai-operator/operator-ui-events";
import { OperatorContextPanel } from "@/components/ai-operator/operator-context-panel";
import { OperatorMessageBubble } from "@/components/ai-operator/operator-message-bubble";
import { Button } from "@/components/ui/button";
import { OPERATOR_PRESETS } from "@/lib/ai-operator/presets";
import type {
  OperatorAction,
  OperatorAssistantMessage,
  OperatorMessage,
  OperatorPlatformContext,
} from "@/types/ai-operator";
import {
  dashboardPanelHref,
  hrefToPanelKind,
  isMissionControlPath,
} from "@/lib/mission-control/inline-panels";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "Ask anything…",
  "Run a command…",
  "Why is revenue down?",
  "Take me to live campaigns…",
  "Deploy a lead stack…",
];

const WELCOME: OperatorAssistantMessage = {
  id: "welcome",
  role: "assistant",
  mode: "operator",
  content:
    "I'm your GrowthOS operator — I can answer questions, navigate the app, run workspace actions, and deploy agents using your live data.",
  bullets: [
    "Try: “List my leads”, “Generate a landing page for my site”, “Activate follow-up agent”",
    "Connected ad accounts unlock campaign and funnel tools (Meta, Google, Zernio).",
  ],
};

type AiOperatorConsoleProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AiOperatorConsole({
  open: openControlled,
  onOpenChange,
}: AiOperatorConsoleProps = {}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openControlled ?? openInternal;
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === "function" ? value(open) : value;
      if (onOpenChange) onOpenChange(next);
      else setOpenInternal(next);
    },
    [open, onOpenChange],
  );
  const [portalReady, setPortalReady] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<OperatorMessage[]>([WELCOME]);
  const [context, setContext] = useState<OperatorPlatformContext | null>(null);
  const [pending, setPending] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const { openDeployment } = useAgentDeployment();

  const refreshContext = useCallback(async () => {
    const ctx = await getOperatorContextAction(pathname);
    setContext(ctx);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const refreshTimer = window.setTimeout(() => {
      void refreshContext();
    }, 0);
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 4000);
    return () => {
      window.clearTimeout(refreshTimer);
      clearInterval(t);
    };
  }, [open, refreshContext]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onToggle = () => setOpen((v) => !v);
    const onClose = () => setOpen(false);
    window.addEventListener(OPERATOR_OPEN_EVENT, onOpen);
    window.addEventListener(OPERATOR_TOGGLE_EVENT, onToggle);
    window.addEventListener(OPERATOR_CLOSE_EVENT, onClose);
    return () => {
      window.removeEventListener(OPERATOR_OPEN_EVENT, onOpen);
      window.removeEventListener(OPERATOR_TOGGLE_EVENT, onToggle);
      window.removeEventListener(OPERATOR_CLOSE_EVENT, onClose);
    };
  }, [setOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function nextMessageId(prefix: string) {
    messageIdRef.current += 1;
    return `${prefix}-${messageIdRef.current}`;
  }

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const userMsg: OperatorMessage = {
      id: nextMessageId("u"),
      role: "user",
      content: trimmed,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);

    try {
      const reply = await sendOperatorMessageAction(trimmed, pathname);
      setMessages((m) => [...m, reply]);
      if (reply.logLine) {
        setLogs((l) => [...l.slice(-4), reply.logLine!]);
      }
      void refreshContext();
    } catch {
      const err: OperatorAssistantMessage = {
        id: nextMessageId("e"),
        role: "assistant",
        mode: "support",
        content: "I couldn't process that request. Try again or use a quick command below.",
      };
      setMessages((m) => [...m, err]);
    } finally {
      setPending(false);
    }
  }

  function handleAction(action: OperatorAction) {
    const onMissionControl = isMissionControlPath(pathname);

    if (onMissionControl && action.kind === "deploy" && action.deploy) {
      setOpen(false);
      window.dispatchEvent(
        new CustomEvent("mc:inline-deploy", { detail: action.deploy }),
      );
      setLogs((l) => [...l.slice(-4), "Building on Mission Control…"]);
      return;
    }

    if (action.kind === "navigate" && action.href) {
      setOpen(false);
      if (onMissionControl) {
        if (action.href.includes("panel=")) {
          router.replace(action.href, { scroll: false });
        } else {
          const panel = hrefToPanelKind(action.href);
          if (panel) router.replace(dashboardPanelHref(panel), { scroll: false });
          else if (action.href.startsWith("/dashboard"))
            router.replace("/dashboard", { scroll: false });
          else window.open(action.href, "_blank", "noopener,noreferrer");
        }
        setLogs((l) => [...l.slice(-4), `Panel → ${action.href}`]);
        return;
      }
      router.push(action.href);
      setLogs((l) => [...l.slice(-4), `Navigate → ${action.href}`]);
      return;
    }
    if (action.kind === "deploy" && action.deploy) {
      if (action.requiresApproval) {
        setLogs((l) => [...l.slice(-4), "Deployment requires approval — opening plan…"]);
      }
      setOpen(false);
      openDeployment(action.deploy);
      return;
    }
    if (action.kind === "open_diagnostics") {
      setOpen(false);
      if (onMissionControl) router.replace(dashboardPanelHref("integrations"), { scroll: false });
      else router.push("/dashboard/integrations");
      return;
    }
    if (action.kind === "approve") {
      setOpen(false);
      if (onMissionControl) router.replace("/dashboard", { scroll: false });
      else router.push("/dashboard/approvals");
    }
  }

  const ui = (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label="Ask Diazites AI — GrowthOS Operator"
            className="fixed bottom-24 right-4 z-[210] flex max-h-[min(720px,calc(100vh-7rem))] w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/98 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:right-6"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-violet-950/50 via-card to-cyan-950/30 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/35 bg-violet-500/15">
                    <Terminal className="size-4 text-violet-200" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Ask Diazites AI</p>
                    <p className="text-[10px] font-medium text-cyan-200/80">Your GrowthOS Operator</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-lg"
                  onClick={() => setOpen(false)}
                  aria-label="Close operator"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Ask questions, run commands, deploy systems, troubleshoot problems, and control your
                business platform.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden lg:hidden">
              <div className="border-b border-white/[0.06] p-3">
                <OperatorContextPanel ctx={context} />
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_11rem]">
              <div className="flex min-h-0 min-w-0 flex-col border-b border-white/[0.06] lg:border-b-0 lg:border-r">
                <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                  {messages.map((m) =>
                    m.role === "user" ? (
                      <div key={m.id} className="flex justify-end">
                        <p className="max-w-[90%] rounded-xl rounded-br-sm bg-violet-600/25 px-3 py-2 text-sm text-violet-50">
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
                      Analyzing platform state…
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 border-t border-white/[0.06] p-2">
                  <p className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick commands
                  </p>
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
                    {OPERATOR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => submit(p.prompt)}
                        className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-violet-500/30 hover:text-violet-200"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form
                  className="shrink-0 border-t border-white/10 p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit(input);
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={PLACEHOLDERS[placeholderIdx]}
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
                  </div>
                </form>
              </div>

              <div className="hidden min-w-0 p-3 lg:block">
                <OperatorContextPanel ctx={context} />
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/20 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-muted-foreground">
                  <Sparkles className="mr-1 inline size-3 text-violet-400" />
                  Command layer · respects approvals & permissions
                </p>
                {logs.length > 0 ? (
                  <p className="max-w-[240px] truncate font-mono text-[9px] text-cyan-300/70">
                    {logs[logs.length - 1]}
                  </p>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-[220] sm:bottom-6 sm:right-6">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            type="button"
            variant="gradient"
            size="lg"
            className={cn(
              "mission-shimmer-btn relative h-12 rounded-full px-4 shadow-[0_12px_40px_-8px_rgba(99,102,241,0.65)] sm:px-5",
              open && "ring-2 ring-cyan-400/40",
            )}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Ask Diazites AI — GrowthOS Operator"
          >
            {!open ? (
              <span
                className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-violet-500/25"
                aria-hidden
              />
            ) : null}
            <Terminal className="relative size-4 shrink-0" />
            <span className="relative text-sm font-semibold">Ask AI</span>
          </Button>
        </motion.div>
        <p className="pointer-events-none mt-1 hidden text-center text-[9px] text-muted-foreground sm:block">
          Ctrl+J
        </p>
      </div>
    </>
  );

  if (!portalReady || typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}

export const AiCopilotFab = AiOperatorConsole;
export const AiControlPlane = AiOperatorConsole;
