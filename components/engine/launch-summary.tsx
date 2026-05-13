import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Rocket, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LaunchPayloadShape = {
  status?: "launched" | "qa_failed";
  slug?: string;
  publicUrl?: string;
  qa?: {
    passed?: boolean;
    checks?: Array<{ id: string; label: string; pass: boolean; detail?: string }>;
  };
  utm?: { source?: string; medium?: string; campaign?: string };
  pixels?: { metaPixelId?: string; googleConversionId?: string };
  conversionEvents?: string[];
};

type LaunchSummaryProps = {
  launchPayload: LaunchPayloadShape | null;
};

export function LaunchSummary({ launchPayload }: LaunchSummaryProps) {
  if (!launchPayload || (!launchPayload.status && !launchPayload.qa)) {
    return null;
  }

  const launched = launchPayload.status === "launched";
  const qaPassed = launchPayload.qa?.passed ?? false;
  const checks = launchPayload.qa?.checks ?? [];

  return (
    <Card
      className={cn(
        "border",
        launched
          ? "border-emerald-500/40 bg-emerald-500/[0.04]"
          : "border-amber-500/40 bg-amber-500/[0.04]",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {launched ? (
                <Rocket className="size-4 text-emerald-300" aria-hidden />
              ) : (
                <AlertTriangle className="size-4 text-amber-300" aria-hidden />
              )}
              {launched ? "Launched" : "QA failed — needs review"}
            </CardTitle>
            <CardDescription className="mt-1">
              {launched
                ? "Your landing page is live. Drive traffic to it from your ads."
                : "Some checks didn't pass. Revise the winning asset or re-run the engine."}
            </CardDescription>
          </div>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              launched
                ? "border-emerald-500/40 text-emerald-200"
                : "border-amber-500/40 text-amber-200",
            )}
          >
            {launchPayload.status ?? (qaPassed ? "launched" : "qa_failed")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {launched && launchPayload.publicUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-200/80">
                Public URL
              </p>
              <p className="mt-0.5 truncate font-mono text-sm font-medium text-emerald-100">
                {launchPayload.publicUrl}
              </p>
            </div>
            <Link
              href={launchPayload.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
            >
              Open page
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </div>
        ) : null}

        {checks.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Launch QA checks
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {checks.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-xs"
                >
                  {c.pass ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-rose-400" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        c.pass ? "text-foreground" : "text-rose-200",
                      )}
                    >
                      {c.label}
                    </p>
                    {c.detail ? (
                      <p className="text-[11px] text-muted-foreground">{c.detail}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {launchPayload.utm ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <FieldBlock label="UTM source" value={launchPayload.utm.source} />
            <FieldBlock label="UTM medium" value={launchPayload.utm.medium} />
            <FieldBlock label="UTM campaign" value={launchPayload.utm.campaign} />
          </div>
        ) : null}

        {launchPayload.conversionEvents && launchPayload.conversionEvents.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Conversion events tracked
            </p>
            <div className="flex flex-wrap gap-1.5">
              {launchPayload.conversionEvents.map((e) => (
                <span
                  key={e}
                  className="rounded-full border border-border/60 bg-card/60 px-2 py-0.5 text-[11px] font-mono text-foreground/90"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {launchPayload.pixels?.metaPixelId?.startsWith("__") ||
        launchPayload.pixels?.googleConversionId?.startsWith("__") ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-[11px] text-amber-100">
            Pixel placeholders are not configured. Set your real Meta Pixel ID and
            Google Conversion ID in the run&apos;s launch config to activate tracking.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FieldBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xs text-foreground">{value ?? "—"}</p>
    </div>
  );
}
