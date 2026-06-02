"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LaunchStep } from "@/lib/launch-builder/types";
import { cn } from "@/lib/utils";

type LaunchStepCardProps = {
  step: LaunchStep;
  stepNumber: number;
  onPreview: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  busy?: boolean;
};

export function LaunchStepCard({
  step,
  stepNumber,
  onPreview,
  onEdit,
  onRegenerate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  busy,
}: LaunchStepCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="border-white/[0.08] bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
              Step {stepNumber}
            </p>
            <CardTitle className="mt-1 text-base">{step.title}</CardTitle>
            <CardDescription className="mt-1">
              Status:{" "}
              <span
                className={cn(
                  "font-medium",
                  step.status === "edited" ? "text-amber-300" : "text-emerald-300",
                )}
              >
                {step.status === "draft_generated"
                  ? "Draft Generated"
                  : step.status === "edited"
                    ? "Edited"
                    : step.status}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" disabled={!canMoveUp || busy} onClick={onMoveUp} aria-label="Move up">
              <ChevronUp className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={!canMoveDown || busy} onClick={onMoveDown} aria-label="Move down">
              <ChevronDown className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((e) => !e)}>
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded ? (
        <CardContent className="space-y-4 border-t border-white/[0.06] pt-4">
          <StepPreviewBody step={step} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={onPreview} disabled={busy}>
              <Eye className="size-3.5" />
              Preview
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={onEdit} disabled={busy}>
              <Pencil className="size-3.5" />
              Edit Manually
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={onRegenerate} disabled={busy}>
              <RefreshCw className="size-3.5" />
              Regenerate with AI
            </Button>
            <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={onDuplicate} disabled={busy}>
              <Copy className="size-3.5" />
              Duplicate
            </Button>
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-red-300 hover:text-red-200" onClick={onDelete} disabled={busy}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

function StepPreviewBody({ step }: { step: LaunchStep }) {
  if (step.kind === "landing_page") {
    const d = step.data;
    return (
      <dl className="grid gap-2 text-sm">
        <PreviewRow label="Headline" value={d.headline} />
        <PreviewRow label="Subheadline" value={d.subheadline} />
        <PreviewRow label="CTA" value={d.cta} />
        <PreviewRow label="Copy" value={d.bodyCopy.slice(0, 280) + (d.bodyCopy.length > 280 ? "…" : "")} />
        <PreviewRow label="Creative direction" value={d.creativeDirection} />
        <PreviewRow label="Form fields" value={d.formFields.join(", ")} />
        <PreviewRow label="SEO title" value={d.seoTitle} />
        <PreviewRow label="SEO description" value={d.seoDescription} />
      </dl>
    );
  }
  if (step.kind === "ad_campaign") {
    const d = step.data;
    return (
      <dl className="grid gap-2 text-sm">
        <PreviewRow label="Campaign" value={d.campaignName} />
        <PreviewRow label="Platforms" value={d.platformRecommendation} />
        <PreviewRow label="Daily budget" value={`$${d.dailyBudgetRecommendation}`} />
        <PreviewRow label="Audience" value={d.audienceTargeting} />
        <PreviewRow label="Interests" value={d.interests.join(", ")} />
        <PreviewRow label="Geo" value={d.geographicSettings} />
        <PreviewRow label="Objective" value={d.objective} />
        <PreviewRow label="Conversion" value={d.conversionEvent} />
      </dl>
    );
  }
  if (step.kind === "ad_creatives") {
    const d = step.data;
    return (
      <dl className="grid gap-2 text-sm">
        <PreviewRow label="Headlines" value={d.headlines.join(" | ")} />
        <PreviewRow label="Primary text" value={d.primaryTexts[0]} />
        <PreviewRow label="Hooks" value={d.hooks.join(" · ")} />
        <PreviewRow label="CTAs" value={d.ctaVariations.join(", ")} />
        <PreviewRow label="Concepts" value={d.creativeConcepts.join(" · ")} />
      </dl>
    );
  }
  if (step.kind === "follow_up_automation") {
    const d = step.data;
    return (
      <div className="space-y-3 text-sm">
        <p className="font-medium text-muted-foreground">Triggers</p>
        <ul className="list-inside list-disc text-foreground/90">
          {d.triggers.filter((t) => t.enabled).map((t) => (
            <li key={t.id}>{t.label}</li>
          ))}
        </ul>
        <p className="font-medium text-muted-foreground">Actions</p>
        <ul className="list-inside list-disc text-foreground/90">
          {d.actions.map((a) => (
            <li key={a.id}>{a.label}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (step.kind === "workflow_automation") {
    const d = step.data;
    return (
      <div className="space-y-3 text-sm">
        <PreviewRow label="Workflow" value={d.workflowName} />
        <PreviewRow label="Description" value={d.description} />
        <p className="font-medium text-muted-foreground">Nodes (preview)</p>
        <div className="flex flex-wrap gap-2">
          {d.nodes.map((n) => (
            <span key={n.id} className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs">
              {n.label}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{d.nicheExamples.join(" · ")}</p>
      </div>
    );
  }
  if (step.kind === "pipeline_crm") {
    const d = step.data;
    return (
      <div className="space-y-3 text-sm">
        <PreviewRow label="Pipeline" value={d.pipelineName} />
        <p className="font-medium text-muted-foreground">Stages</p>
        <ol className="space-y-1 border-l border-violet-500/40 pl-4">
          {d.stages.map((s) => (
            <li key={s.name} className="text-foreground/90">
              {s.name}
            </li>
          ))}
        </ol>
        {d.secondaryPipelines?.map((p) => (
          <p key={p.name} className="text-xs text-muted-foreground">
            + {p.name}: {p.stages.join(" → ")}
          </p>
        ))}
      </div>
    );
  }
  if (step.kind === "appointment_logic") {
    const d = step.data;
    return (
      <dl className="grid gap-2 text-sm">
        <PreviewRow label="Objective" value={d.bookingObjective} />
        <PreviewRow label="Qualification" value={d.qualificationRules.join(" · ")} />
        <PreviewRow label="Routing" value={d.routingRules.join(" · ")} />
        <PreviewRow label="Reminders" value={d.reminderSchedule.join(" · ")} />
        <PreviewRow label="No-show" value={d.noShowHandling} />
      </dl>
    );
  }
  if (step.kind === "nurture_sequence") {
    const d = step.data;
    return (
      <div className="space-y-2 text-sm">
        <PreviewRow label="Sequence" value={d.sequenceName} />
        <p className="text-xs text-muted-foreground">{d.notes}</p>
        <ul className="space-y-1">
          {d.touches.map((t) => (
            <li key={t.day} className="rounded-lg border border-white/[0.06] px-3 py-2">
              Day {t.day} — {t.channel}: {t.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground/90">{value}</dd>
    </div>
  );
}
