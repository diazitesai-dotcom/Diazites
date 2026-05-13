import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AssetRow } from "@/repositories/engine.repository";

const KIND_TITLES: Record<string, { title: string; description: string }> = {
  landing_page: {
    title: "Landing Page",
    description: "Headline, subheadline, bullets, CTA, social proof.",
  },
  ad: {
    title: "Ad Creative",
    description: "Primary text, headline, description, image prompt, CTA.",
  },
  email: {
    title: "Email",
    description: "Subject, preview text, body.",
  },
  headline: {
    title: "Headline / Hook",
    description: "Short hook text and the framing angle.",
  },
};

const AXIS_LABELS: Record<string, string> = {
  clarity: "Clarity",
  trust: "Trust",
  emotionalImpact: "Emotion",
  ctaStrength: "CTA",
  mobileUx: "Mobile",
  conversionPotential: "Conv.",
};

type VariantGalleryProps = {
  assets: AssetRow[];
};

export function VariantGallery({ assets }: VariantGalleryProps) {
  if (assets.length === 0) return null;

  const byKind = groupAssetsByKind(assets);
  const kinds = Object.keys(byKind);

  return (
    <div className="space-y-8">
      {kinds.map((kind) => {
        const meta = KIND_TITLES[kind] ?? {
          title: kind,
          description: "",
        };
        const variants = byKind[kind]
          .slice()
          .sort((a, b) => a.variant_label.localeCompare(b.variant_label));

        return (
          <section key={kind} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{meta.title}</h3>
                {meta.description ? (
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground">
                {variants.length} variants
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {variants.map((v) => (
                <VariantCard key={v.id} asset={v} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function VariantCard({ asset }: { asset: AssetRow }) {
  const isWinner = asset.is_winner;
  const score = asset.score as ScoreShape | null;
  const total = score?.totalScore ?? null;
  const axes = score?.axes ?? null;

  return (
    <Card
      size="sm"
      className={cn(
        "relative h-full overflow-visible border",
        isWinner
          ? "border-emerald-500/50 bg-emerald-500/[0.04] shadow-[0_0_32px_-14px_rgba(16,185,129,0.5)]"
          : "border-white/[0.06]",
      )}
    >
      {isWinner ? (
        <span className="absolute -right-2 -top-2 z-10 flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-950 shadow-lg">
          <Trophy className="size-3" aria-hidden />
          Winner
        </span>
      ) : null}

      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Variant {asset.variant_label}</CardTitle>
          {total !== null ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                isWinner
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-violet-500/15 text-violet-200",
              )}
            >
              {Math.round(total)}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <VariantBody kind={asset.kind} payload={asset.payload} />

        {axes ? (
          <div className="grid grid-cols-3 gap-1.5 border-t border-border/40 pt-3">
            {Object.entries(AXIS_LABELS).map(([key, label]) => {
              const val = axes[key];
              if (typeof val !== "number") return null;
              return (
                <div
                  key={key}
                  className="flex flex-col rounded-md bg-background/50 px-1.5 py-1"
                >
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {Math.round(val)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {score?.rationale ? (
          <p className="text-[11px] italic leading-relaxed text-muted-foreground">
            “{score.rationale}”
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function VariantBody({
  kind,
  payload,
}: {
  kind: string;
  payload: Record<string, unknown>;
}) {
  if (kind === "landing_page") {
    return (
      <div className="space-y-2 text-xs">
        {payload.headline ? (
          <p className="text-sm font-semibold leading-snug text-foreground">
            {String(payload.headline)}
          </p>
        ) : null}
        {payload.subheadline ? (
          <p className="text-muted-foreground">{String(payload.subheadline)}</p>
        ) : null}
        {Array.isArray(payload.bullets) && payload.bullets.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
            {payload.bullets.slice(0, 4).map((b, i) => (
              <li key={i}>{String(b)}</li>
            ))}
          </ul>
        ) : null}
        {payload.primaryCta ? (
          <p className="inline-block rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-200">
            CTA: {String(payload.primaryCta)}
          </p>
        ) : null}
      </div>
    );
  }

  if (kind === "ad") {
    return (
      <div className="space-y-2 text-xs">
        {payload.headline ? (
          <p className="text-sm font-semibold leading-snug text-foreground">
            {String(payload.headline)}
          </p>
        ) : null}
        {payload.primaryText ? (
          <p className="line-clamp-4 text-muted-foreground">
            {String(payload.primaryText)}
          </p>
        ) : null}
        {payload.description ? (
          <p className="text-[11px] text-muted-foreground/80">
            {String(payload.description)}
          </p>
        ) : null}
        {payload.cta ? (
          <p className="inline-block rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-200">
            CTA: {String(payload.cta)}
          </p>
        ) : null}
      </div>
    );
  }

  if (kind === "email") {
    return (
      <div className="space-y-2 text-xs">
        {payload.subject ? (
          <p className="text-sm font-semibold leading-snug text-foreground">
            {String(payload.subject)}
          </p>
        ) : null}
        {payload.previewText ? (
          <p className="text-[11px] text-muted-foreground/80">
            {String(payload.previewText)}
          </p>
        ) : null}
        {payload.body ? (
          <p className="line-clamp-5 text-muted-foreground">
            {String(payload.body)}
          </p>
        ) : null}
      </div>
    );
  }

  if (kind === "headline") {
    return (
      <div className="space-y-2 text-xs">
        {payload.text ? (
          <p className="text-base font-semibold leading-snug text-foreground">
            “{String(payload.text)}”
          </p>
        ) : null}
        {payload.framing ? (
          <p className="text-[11px] italic text-muted-foreground">
            {String(payload.framing)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <pre className="max-h-40 overflow-auto rounded-md border border-border/60 bg-background/60 p-2 text-[10px] text-muted-foreground">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

type ScoreShape = {
  totalScore?: number;
  axes?: Record<string, number>;
  rationale?: string;
};

function groupAssetsByKind(assets: AssetRow[]): Record<string, AssetRow[]> {
  const out: Record<string, AssetRow[]> = {};
  const ORDER = ["landing_page", "ad", "email", "headline"];
  for (const a of assets) {
    out[a.kind] ??= [];
    out[a.kind].push(a);
  }
  const ordered: Record<string, AssetRow[]> = {};
  for (const k of ORDER) if (out[k]) ordered[k] = out[k];
  for (const k of Object.keys(out)) if (!ordered[k]) ordered[k] = out[k];
  return ordered;
}
