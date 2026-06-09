"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { editOnboardingPipelineWithAiAction } from "@/actions/ceo-onboarding.actions";
import type { OnboardingPipelineWorkflow } from "@/lib/onboarding/command-center-payload";
import type { BusinessProfileFields, OfferGoalsFields } from "@/types/ceo-command-center";

const SUGGESTIONS = [
  "Add a nurture stage for leads who don't book within 48 hours",
  "Enable SMS and email follow-up with a friendly tone",
  "Add stages for quote sent and won/lost",
  "Shorten the pipeline to 5 stages for a simple service business",
];

export function OnboardingPipelineAiPanel({
  profile,
  offerGoals,
  pipelineWorkflow,
  onApply,
}: {
  profile: BusinessProfileFields;
  offerGoals: OfferGoalsFields;
  pipelineWorkflow: OnboardingPipelineWorkflow;
  onApply: (next: OnboardingPipelineWorkflow, summary: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runAi(instruction: string) {
    const trimmed = instruction.trim();
    if (!trimmed) return;

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await editOnboardingPipelineWithAiAction({
        instruction: trimmed,
        profile,
        offerGoals,
        pipelineWorkflow,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onApply(result.data.pipeline, result.data.summary);
      setMessage(result.data.summary);
      setPrompt("");
    });
  }

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-indigo-950/20 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-violet-500/20 p-2">
          <Sparkles className="h-4 w-4 text-violet-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white">AI pipeline editor</p>
            <p className="text-xs text-slate-400">
              Describe changes in plain language — add stages, automations, follow-up messages, or
              rewrite the whole flow.
            </p>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder='e.g. "Add a stage called Quote Sent and enable email follow-up after 24 hours"'
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || !prompt.trim()}
              onClick={() => runAi(prompt)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600/40 px-4 py-2 text-xs font-semibold text-violet-100 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Apply with AI
            </button>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() => runAi(s)}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-400 hover:border-violet-500/30 hover:text-violet-200"
              >
                {s}
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
