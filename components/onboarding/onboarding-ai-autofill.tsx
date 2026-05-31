"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OnboardingDraft } from "@/lib/onboarding/draft";
import { autofillOnboardingFromWebsiteAction } from "@/services/onboarding/actions";
import { cn } from "@/lib/utils";

export function OnboardingAiAutofill({
  draft,
  onApply,
  className,
}: {
  draft: OnboardingDraft;
  onApply: (next: OnboardingDraft, meta: { usedAi: boolean }) => void;
  className?: string;
}) {
  const [url, setUrl] = useState(draft.website || "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAutofill() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await autofillOnboardingFromWebsiteAction(url, draft);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onApply(result.data.draft, { usedAi: result.data.usedAi });
      setMessage(
        result.data.usedAi
          ? "AI filled in your business details — review and edit anything before continuing."
          : "We pulled basics from your site — add OPENAI_API_KEY for richer AI autofill.",
      );
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-violet-500/20 p-2">
          <Sparkles className="size-4 text-violet-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Autofill with AI</p>
            <p className="text-xs text-muted-foreground">
              Paste your website URL (include https://) and we&apos;ll pre-fill business name,
              services, audience, and more.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="url"
              placeholder="https://yourbusiness.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-lg border-white/10 bg-background/60"
            />
            <Button
              type="button"
              variant="gradient"
              className="shrink-0 rounded-lg px-5"
              disabled={isPending || !url.trim()}
              onClick={handleAutofill}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Autofill
                </>
              )}
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-xs text-red-300">
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
