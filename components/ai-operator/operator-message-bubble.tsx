"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OperatorAction, OperatorAssistantMessage, OperatorMode } from "@/types/ai-operator";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<OperatorMode, string> = {
  answer: "Answer",
  navigation: "Navigate",
  action: "Action",
  diagnostic: "Diagnostic",
  support: "Support",
  operator: "Operator",
};

const MODE_STYLE: Record<OperatorMode, string> = {
  answer: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  navigation: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  action: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  diagnostic: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  support: "border-white/15 bg-white/5 text-muted-foreground",
  operator: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200",
};

/** Regex to match http(s) URLs or internal /p/ and /dashboard paths. */
const URL_REGEX = /(https?:\/\/[^\s]+|\/p\/[^\s,)]+|\/dashboard(?:\/[^\s,)]*)?)/g;

/** Split text and render any URLs as clickable links. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_REGEX);
  return (
    <>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          URL_REGEX.lastIndex = 0;
          const isExternal = part.startsWith("http");
          const label = part.replace(/^https?:\/\//, "").replace(/^www\./, "").slice(0, 50);
          if (isExternal) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-violet-300 underline underline-offset-2 hover:text-violet-200"
              >
                {label}
                <ExternalLink className="size-3" />
              </a>
            );
          }
          return (
            <Link
              key={i}
              href={part}
              className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
            >
              {part}
            </Link>
          );
        }
        URL_REGEX.lastIndex = 0;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function OperatorMessageBubble({
  message,
  onAction,
}: {
  message: OperatorAssistantMessage;
  onAction: (action: OperatorAction) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            MODE_STYLE[message.mode],
          )}
        >
          {MODE_LABEL[message.mode]}
        </span>
        {message.breadcrumb ? (
          <span className="text-[10px] text-muted-foreground">{message.breadcrumb}</span>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-foreground/95">
        <Linkified text={message.content} />
      </p>

      {message.bullets && message.bullets.length > 0 ? (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {message.bullets.map((b) => (
            <li key={b} className="flex gap-2 leading-snug">
              <span className="text-violet-400">•</span>
              <span>
                <Linkified text={b} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {message.actions && message.actions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {message.actions.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-lg border-white/10 text-[11px]"
              onClick={() => onAction(action)}
            >
              {action.label}
              <ChevronRight className="ml-0.5 size-3" />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
