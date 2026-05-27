"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ExternalLink, Eye, Loader2, Pencil, Sparkles, Zap } from "lucide-react";

import {
  generateThreeLandingPagesAction,
  publishLandingPageAction,
  updateGeneratedLandingPageCopyAction,
} from "@/actions/marketing-os.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidFunnelInput, parseFunnelInput } from "@/lib/funnel/parse-funnel-input";
import { cn } from "@/lib/utils";

export type GeneratedPageCard = {
  landingPageId: string;
  slug: string;
  draftVersionId: string;
  angle: string;
  angleLabel: string;
  headline: string;
  subheadline: string;
  offer: string;
  ctaText: string;
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
  const [editing, setEditing] = useState<GeneratedPageCard | null>(null);
  const [editForm, setEditForm] = useState({
    headline: "",
    subheadline: "",
    offer: "",
    ctaText: "",
  });
  const [pending, startTransition] = useTransition();

  function openEdit(page: GeneratedPageCard) {
    setEditing(page);
    setEditForm({
      headline: page.headline,
      subheadline: page.subheadline,
      offer: page.offer,
      ctaText: page.ctaText,
    });
  }

  const parsedInput = parseFunnelInput(prompt);
  const canGenerate = isValidFunnelInput(parsedInput);

  function handleGenerate() {
    const trimmed = prompt.trim();
    const parsed = parseFunnelInput(trimmed);
    if (!isValidFunnelInput(parsed)) {
      setMessage(
        parsed.kind === "url"
          ? "Enter a valid URL like domain.com, www.domain.com, or https://domain.com"
          : "Enter a keyword or business description (at least 3 characters).",
      );
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
        setMessage(`Published at /p/${result.data.slug}`);
      } else {
        setMessage(result.error);
      }
    });
  }

  function handleSaveEdit() {
    if (!editing) return;
    if (!editForm.headline.trim()) {
      setMessage("Headline is required.");
      return;
    }

    startTransition(async () => {
      const result = await updateGeneratedLandingPageCopyAction(
        editing.landingPageId,
        editing.draftVersionId,
        editForm,
      );
      if (result.ok) {
        setPages((prev) =>
          prev.map((p) =>
            p.landingPageId === editing.landingPageId
              ? {
                  ...p,
                  headline: result.data.headline,
                  subheadline: result.data.subheadline,
                  offer: result.data.offer,
                  ctaText: result.data.ctaText,
                }
              : p,
          ),
        );
        setEditing(null);
        setMessage("Landing page copy updated.");
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
            Enter a website URL or keyword. Diazites AI creates three unique landing pages — trust,
            urgency, and value angles — ready to preview and publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-prompt">Website URL or keyword</Label>
            <Textarea
              id="business-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="lbertt.org — or — Roofing company in Tampa, free storm damage inspections"
              className="min-h-[120px] resize-y"
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Accepts domain.com, www.domain.com, https://domain.com, or any business keyword.
            </p>
          </div>
          <Button
            type="button"
            variant="gradient"
            className="rounded-xl"
            disabled={pending || !canGenerate}
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
            <p className="text-xs text-muted-foreground">Latest generation · 3 variants</p>
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
                  <p className="text-xs text-muted-foreground">
                    {page.published ? `/p/${page.slug}` : `Preview · ${page.slug}`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl border-white/10"
                      disabled={pending}
                      onClick={() => openEdit(page)}
                    >
                      <Pencil className="mr-1.5 size-3.5" />
                      Edit
                    </Button>
                    <Link
                      href={`/dashboard/funnel/preview/${page.slug}`}
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
                      href={`/p/${page.slug}`}
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

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit landing page copy</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editing?.angleLabel} — changes sync to preview and publish.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-headline">Headline</Label>
              <Input
                id="edit-headline"
                value={editForm.headline}
                onChange={(e) => setEditForm((f) => ({ ...f, headline: e.target.value }))}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subheadline">Subheadline</Label>
              <Textarea
                id="edit-subheadline"
                value={editForm.subheadline}
                onChange={(e) => setEditForm((f) => ({ ...f, subheadline: e.target.value }))}
                className="min-h-[72px]"
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-offer">Offer copy</Label>
              <Textarea
                id="edit-offer"
                value={editForm.offer}
                onChange={(e) => setEditForm((f) => ({ ...f, offer: e.target.value }))}
                className="min-h-[96px]"
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cta">Button text</Label>
              <Input
                id="edit-cta"
                value={editForm.ctaText}
                onChange={(e) => setEditForm((f) => ({ ...f, ctaText: e.target.value }))}
                disabled={pending}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={pending}
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                className="rounded-xl"
                disabled={pending}
                onClick={handleSaveEdit}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
