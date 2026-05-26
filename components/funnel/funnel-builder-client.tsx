"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ExternalLink, Eye, Loader2, Sparkles, Zap } from "lucide-react";

import {
  generateThreeLandingPagesAction,
  publishLandingPageAction,
} from "@/actions/marketing-os.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type GeneratedPageCard = {
  landingPageId: string;
  slug: string;
  draftVersionId: string;
  angle: string;
  angleLabel: string;
  headline: string;
  subheadline: string;
  published: boolean;
};

type FunnelBuilderClientProps = {
  initialPages: GeneratedPageCard[];
};

const ANGLE_STYLE: Record<string, string> = {
  trust: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  urgency: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  value: "border-violet-500/30 bg-violet-500/10 text-violet-200",
};

export function FunnelBuilderClient({ initialPages }: FunnelBuilderClientProps) {
  const [prompt, setPrompt] = useState("");
  const [pages, setPages] = useState<GeneratedPageCard[]>(initialPages);
  const [message, setMessage] = useState("");
  const [usedAi, setUsedAi] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    const trimmed = prompt.trim();
    if (trimmed.length < 8) {
      setMessage("Describe your business or offer in a bit more detail (at least 8 characters).");
      return;
    }

    startTransition(async () => {
      setMessage("");
      const result = await generateThreeLandingPagesAction(trimmed);
      if (result.ok) {
        setPages(result.data.pages);
        setUsedAi(result.data.usedAi);
        setMessage(
          result.data.usedAi
            ? "3 AI landing pages created. Preview each, then publish your favorite."
            : "3 landing pages created (template mode — add OPENAI_API_KEY for full AI copy).",
        );
      } else {
        setMessage(result.error);
      }
    });
  }

  function handlePublish(page: GeneratedPageCard) {
    startTransition(async () => {
      const result = await publishLandingPageAction(page.landingPageId, page.draftVersionId);
      if (result.ok) {
        setPages((prev) =>
          prev.map((p) =>
            p.landingPageId === page.landingPageId ? { ...p, published: true } : p,
          ),
        );
        setMessage(`Published at /lp/${result.data.slug}`);
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <Card className="border-white/[0.08] bg-gradient-to-br from-violet-950/30 via-card to-cyan-950/20">
        <CardHeader>
          <div className="flex items-center gap-2 text-violet-300">
            <Sparkles className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">AI Funnel Generator</span>
          </div>
          <CardTitle className="text-xl">Generate 3 landing pages instantly</CardTitle>
          <CardDescription>
            Describe your business or offer. Diazites AI creates three unique landing pages — trust,
            urgency, and value angles — ready to preview and publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-prompt">Describe your business or niche</Label>
            <Textarea
              id="business-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Roofing company in Tampa — free storm damage inspections, licensed & insured, same-day quotes, Facebook lead funnel."
              className="min-h-[120px] resize-y"
              disabled={pending}
            />
          </div>
          <Button
            type="button"
            variant="gradient"
            className="rounded-xl"
            disabled={pending || prompt.trim().length < 8}
            onClick={handleGenerate}
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating 3 pages…
              </>
            ) : (
              <>
                <Zap className="mr-2 size-4" />
                Generate 3 landing pages
              </>
            )}
          </Button>
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
          {usedAi === false ? (
            <p className="text-xs text-amber-200/80">
              Tip: Add OPENAI_API_KEY to your environment for richer, niche-specific copy.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {pages.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Your landing pages</h2>
            <p className="text-xs text-muted-foreground">{pages.length} pages</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {pages.map((page) => (
              <Card
                key={page.landingPageId}
                className="flex flex-col border-white/[0.08] bg-white/[0.02]"
              >
                <CardHeader className="space-y-3">
                  <span
                    className={cn(
                      "inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      ANGLE_STYLE[page.angle] ?? "border-white/20 bg-white/5 text-muted-foreground",
                    )}
                  >
                    {page.angleLabel}
                  </span>
                  <CardTitle className="text-base leading-snug">{page.headline}</CardTitle>
                  <CardDescription className="line-clamp-3 text-sm">
                    {page.subheadline}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-2 pt-0">
                  <p className="text-xs text-muted-foreground">/lp/{page.slug}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/lp/${page.slug}`}
                      target="_blank"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium hover:bg-white/[0.04]"
                    >
                      <Eye className="size-3.5" />
                      Preview
                    </Link>
                    <Button
                      type="button"
                      variant={page.published ? "secondary" : "gradient"}
                      size="sm"
                      className="flex-1 rounded-xl"
                      disabled={pending || page.published}
                      onClick={() => handlePublish(page)}
                    >
                      {page.published ? "Published" : "Publish"}
                    </Button>
                  </div>
                  {page.published ? (
                    <a
                      href={`/lp/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-cyan-300/80 hover:text-cyan-200"
                    >
                      Live page <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <Card className="border-dashed border-white/10 bg-transparent">
          <CardContent className="py-16 text-center">
            <Sparkles className="mx-auto mb-4 size-10 text-violet-400/40" />
            <p className="font-medium">No pages yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your business above and click Generate to create 3 landing page variants.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
