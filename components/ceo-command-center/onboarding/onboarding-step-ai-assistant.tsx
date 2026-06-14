"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

export function OnboardingStepAiAssistant({
  title,
  description,
  placeholder,
  suggestions,
  pending,
  error,
  message,
  onRun,
}: {
  title: string;
  description: string;
  placeholder: string;
  suggestions: string[];
  pending: boolean;
  error: string | null;
  message: string | null;
  onRun: (instruction: string) => void;
}) {
  const [prompt, setPrompt] = useState("");

  function run(instruction: string) {
    const trimmed = instruction.trim();
    if (!trimmed || pending) return;
    onRun(trimmed);
    setPrompt("");
  }

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-indigo-950/20 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-violet-500/20 p-2">
          <Sparkles className="h-4 w-4 text-violet-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || !prompt.trim()}
              onClick={() => run(prompt)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600/40 px-4 py-2 text-xs font-semibold text-violet-100 disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Apply with AI
            </button>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={pending}
                onClick={() => run(suggestion)}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-400 hover:border-violet-500/30 hover:text-violet-200 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
          {error ? (
            <p role="alert" className="text-xs text-rose-300">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="text-xs text-emerald-300">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
