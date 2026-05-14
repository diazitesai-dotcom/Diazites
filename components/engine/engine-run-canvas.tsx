import Link from "next/link";
import {
  ArrowDown,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Globe,
  Lock,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import { LaunchSummary } from "@/components/engine/launch-summary";
import { VariantGallery } from "@/components/engine/variant-gallery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AssetRow, EngineRunRow, EngineStep } from "@/repositories/engine.repository";
import { ENGINE_STEPS, stepIndex } from "@/services/engine/orchestrator.service";

type EngineRunCanvasProps = {
  run: EngineRunRow;
  assets: AssetRow[];
  businessName?: string | null;
};

type StageState = "complete" | "current" | "upcoming" | "failed";

export function EngineRunCanvas({ run, assets, businessName }: EngineRunCanvasProps) {
  const currentIdx = stepIndex(run.current_step);
  const isLaunched = run.status === "launched";
  const isFailed = run.status === "failed";
  const isQaFailed = run.status === "needs_approval";

  function stateFor(step: EngineStep): StageState {
    const idx = stepIndex(step);
    if (isLaunched) return "complete";
    if (isFailed && idx >= currentIdx) return "failed";
    if (idx < currentIdx) return "complete";
    if (idx === currentIdx) return "current";
    return "upcoming";
  }

  const winnerLanding = assets.find(
    (a) => a.kind === "landing_page" && a.is_winner,
  );

  return (
    <div className="space-y-6">
      {isLaunched && winnerLanding ? (
        <LandingPreviewSection
          asset={winnerLanding}
          publicUrl={pickPublicUrl(run.launch_payload)}
          businessName={businessName}
        />
      ) : null}

      <StageSection
        idx={1}
        step="input"
        state={stateFor("input")}
        title="Input"
        subtitle="User enters business information"
      >
        <InputView payload={run.input_payload} />
      </StageSection>

      <StageSection
        idx={2}
        step="research"
        state={stateFor("research")}
        title="AI Research Engine"
        subtitle="AI analyzes everything automatically"
      >
        <ResearchView payload={run.research_payload} />
      </StageSection>

      <StageSection
        idx={3}
        step="strategy"
        state={stateFor("strategy")}
        title="Campaign Creative"
        subtitle="AI creates a complete marketing strategy"
      >
        <StrategyView payload={run.strategy_payload} />
      </StageSection>

      <StageSection
        idx={4}
        step="funnel"
        state={stateFor("funnel")}
        title="Funnel Blueprint"
        subtitle="AI builds the full funnel structure"
      >
        <FunnelView payload={run.funnel_payload} />
      </StageSection>

      <StageSection
        idx={5}
        step="generation"
        state={stateFor("generation")}
        title="AI Generation Suite"
        subtitle="AI generates all assets"
      >
        <GenerationView payload={run.generation_payload} />
      </StageSection>

      <StageSection
        idx={6}
        step="variants"
        state={stateFor("variants")}
        title="Variant Engine"
        subtitle="AI creates multiple high-converting variants"
      >
        {assets.length > 0 ? (
          <VariantGallery assets={assets} />
        ) : (
          <EmptyHint message="Variants will appear here after Stage 6 runs." />
        )}
      </StageSection>

      <StageSection
        idx={7}
        step="scoring"
        state={stateFor("scoring")}
        title="AI Scoring Engine"
        subtitle="AI scores & selects the best performer"
      >
        <ScoringView payload={run.scoring_payload} assets={assets} />
      </StageSection>

      <StageSection
        idx={8}
        step="launch"
        state={isQaFailed ? "failed" : stateFor("launch")}
        title="Launch System"
        subtitle="AI prepares everything for launch"
      >
        <LaunchSummary
          launchPayload={run.launch_payload as Parameters<typeof LaunchSummary>[0]["launchPayload"]}
        />
        {!run.launch_payload ? (
          <EmptyHint message="Launch payload will appear once Stage 8 runs." />
        ) : null}
      </StageSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section shell
// ---------------------------------------------------------------------------

type StageSectionProps = {
  idx: number;
  step: EngineStep;
  state: StageState;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function StageSection({ idx, state, title, subtitle, children }: StageSectionProps) {
  const stepMeta = ENGINE_STEPS[idx - 1];

  const stateBadge = {
    complete: { label: "Done", border: "border-emerald-500/40", text: "text-emerald-300" },
    current: { label: "Active", border: "border-violet-500/50", text: "text-violet-200" },
    upcoming: { label: "Queued", border: "border-border/60", text: "text-muted-foreground" },
    failed: { label: "Needs review", border: "border-amber-500/50", text: "text-amber-200" },
  }[state];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border",
        state === "complete" && "border-emerald-500/25 bg-emerald-500/[0.02]",
        state === "current" &&
          "border-violet-500/40 bg-violet-500/[0.03] shadow-[0_0_40px_-18px_rgba(167,139,250,0.55)]",
        state === "upcoming" && "border-border/60",
        state === "failed" && "border-amber-500/30 bg-amber-500/[0.03]",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                state === "complete" && "bg-emerald-500/20 text-emerald-300",
                state === "current" && "bg-violet-500/20 text-violet-200",
                state === "upcoming" && "bg-muted/40 text-muted-foreground",
                state === "failed" && "bg-amber-500/20 text-amber-200",
              )}
              aria-hidden
            >
              {state === "complete" ? (
                <CheckCircle2 className="size-4" />
              ) : state === "current" ? (
                <CircleDot className="size-4" />
              ) : state === "failed" ? (
                <XCircle className="size-4" />
              ) : (
                idx
              )}
            </span>
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Stage {idx} of {ENGINE_STEPS.length}
              </p>
              <CardTitle className="text-lg leading-tight">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              stateBadge.border,
              stateBadge.text,
            )}
          >
            {stateBadge.label}
          </span>
        </div>
        {stepMeta ? (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
            {stepMeta.description}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {state === "upcoming" ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/40 bg-background/30 px-4 py-3 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Click <span className="text-foreground">Advance</span> to run this
            stage.
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border/40 bg-background/30 px-4 py-3 text-xs text-muted-foreground">
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Stage 0 (bonus): Landing page preview
// ---------------------------------------------------------------------------

function LandingPreviewSection({
  asset,
  publicUrl,
  businessName,
}: {
  asset: AssetRow;
  publicUrl: string | null;
  businessName?: string | null;
}) {
  const payload = asset.payload as Record<string, unknown>;
  const headline = typeof payload.headline === "string" ? payload.headline : null;
  const subheadline =
    typeof payload.subheadline === "string" ? payload.subheadline : null;
  const bullets = Array.isArray(payload.bullets)
    ? (payload.bullets.filter((b) => typeof b === "string") as string[])
    : [];
  const primaryCta =
    typeof payload.primaryCta === "string" ? payload.primaryCta : "Get my free quote";
  const socialProof =
    typeof payload.socialProof === "string" ? payload.socialProof : null;

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/[0.03]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-200/90">
              Live · public landing page
            </p>
            <CardTitle className="text-lg">{businessName ?? "Your launched page"}</CardTitle>
          </div>
          {publicUrl ? (
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
            >
              Open page
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-background shadow-xl">
          <div className="flex items-center gap-2 border-b border-border/40 bg-card/80 px-4 py-2">
            <span className="size-2.5 rounded-full bg-rose-400/70" aria-hidden />
            <span className="size-2.5 rounded-full bg-amber-400/70" aria-hidden />
            <span className="size-2.5 rounded-full bg-emerald-400/70" aria-hidden />
            <div className="ml-2 flex flex-1 items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-1 text-[10px] text-muted-foreground">
              <Globe className="size-3" aria-hidden />
              <span className="truncate font-mono">{publicUrl ?? "/p/<slug>"}</span>
            </div>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-violet-300">
                Local experts
              </p>
              {headline ? (
                <h2 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                  {headline}
                </h2>
              ) : null}
              {subheadline ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {subheadline}
                </p>
              ) : null}
              {bullets.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {bullets.slice(0, 4).map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-emerald-400"
                        aria-hidden
                      />
                      <span className="text-foreground/90">{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {socialProof ? (
                <p className="rounded-lg border border-border/40 bg-card/40 p-3 text-xs italic text-muted-foreground">
                  “{socialProof}”
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Free quote · 60-second form
              </p>
              <div className="mt-3 space-y-2">
                {["Name", "Phone", "Email", "Address"].map((label) => (
                  <div
                    key={label}
                    className="rounded-md border border-border/40 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
                <div className="mt-2 rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2 text-center text-xs font-semibold text-white">
                  {primaryCta}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function pickPublicUrl(launchPayload: Record<string, unknown> | null): string | null {
  if (!launchPayload) return null;
  const url = (launchPayload as Record<string, unknown>).publicUrl;
  return typeof url === "string" ? url : null;
}

// ---------------------------------------------------------------------------
// Stage 1: Input
// ---------------------------------------------------------------------------

function InputView({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload) return <EmptyHint message="No input captured." />;
  const fields: Array<[label: string, value: unknown, icon?: React.ReactNode]> = [
    ["Website", payload.websiteUrl, <Globe key="g" className="size-3" />],
    ["Niche", payload.niche],
    ["Goal / Offer", payload.goal, <Target key="t" className="size-3" />],
    ["Target audience", payload.targetAudience, <Users key="u" className="size-3" />],
    ["Location", payload.location],
    ["Budget (USD/mo)", payload.budget],
    ["Traffic source", payload.trafficSource],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, value, icon]) => (
        <FieldBlock key={label} label={label} value={value} icon={icon} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage 2: Research
// ---------------------------------------------------------------------------

function ResearchView({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload) return <EmptyHint message="Research output will appear here." />;
  const audience = typeof payload.audienceProfile === "string" ? payload.audienceProfile : null;
  const painPoints = stringArray(payload.painPoints);
  const offerAngles = stringArray(payload.offerAngles);
  const keywords = stringArray(payload.keywords);
  const positioningHooks = stringArray(payload.positioningHooks);
  const competitors = Array.isArray(payload.competitors)
    ? (payload.competitors as Array<Record<string, unknown>>)
    : [];
  const insights = stringArray(payload.marketInsights);

  return (
    <div className="space-y-5">
      {audience ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200/80">
            Audience profile
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{audience}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <ListBlock title="Pain points" items={painPoints} accent="rose" />
        <ListBlock title="Offer angles" items={offerAngles} accent="emerald" />
      </div>

      {keywords.length > 0 ? (
        <ChipCloud title="Target keywords" items={keywords} />
      ) : null}
      {positioningHooks.length > 0 ? (
        <ChipCloud title="Positioning hooks" items={positioningHooks} accent="violet" />
      ) : null}

      {competitors.length > 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Competitor scan
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {competitors.slice(0, 6).map((c, i) => (
              <li
                key={i}
                className="rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-xs"
              >
                <p className="font-semibold text-foreground">
                  {typeof c.name === "string" ? c.name : `Competitor ${i + 1}`}
                </p>
                {typeof c.strength === "string" ? (
                  <p className="text-[11px] text-muted-foreground">
                    Strength: {c.strength}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {insights.length > 0 ? (
        <ListBlock title="Market insights" items={insights} accent="cyan" />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage 3: Strategy
// ---------------------------------------------------------------------------

function StrategyView({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload) return <EmptyHint message="Strategy output will appear here." />;
  const positioning = typeof payload.positioning === "string" ? payload.positioning : null;
  const offer = typeof payload.offer === "string" ? payload.offer : null;
  const cta = typeof payload.cta === "string" ? payload.cta : null;
  const funnelType = typeof payload.funnelType === "string" ? payload.funnelType : null;
  const trafficStrategy = stringArray(payload.trafficStrategy);
  const metrics = payload.successMetrics as Record<string, unknown> | null;

  return (
    <div className="space-y-5">
      {positioning ? (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.04] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200/90">
            Positioning
          </p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-foreground">
            {positioning}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {offer ? <FieldBlock label="Offer" value={offer} /> : null}
        {cta ? <FieldBlock label="Primary CTA" value={cta} /> : null}
        {funnelType ? <FieldBlock label="Funnel type" value={funnelType} /> : null}
      </div>

      {trafficStrategy.length > 0 ? (
        <ChipCloud title="Traffic strategy" items={trafficStrategy} accent="cyan" />
      ) : null}

      {metrics ? (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Success metrics targets
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(metrics).slice(0, 6).map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] px-3 py-2"
              >
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/80">
                  <TrendingUp className="size-3" aria-hidden />
                  {humanize(k)}
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                  {String(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage 4: Funnel
// ---------------------------------------------------------------------------

function FunnelView({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload) return <EmptyHint message="Funnel blueprint will appear here." />;
  const summary = typeof payload.summary === "string" ? payload.summary : null;
  const nodes = Array.isArray(payload.nodes)
    ? (payload.nodes as Array<{ id?: unknown; label?: unknown }>)
    : [];
  const followup = (payload.followupSequence ?? null) as
    | { emails?: unknown; sms?: unknown }
    | null;
  const emails = stringArray(followup?.emails);
  const sms = stringArray(followup?.sms);

  return (
    <div className="space-y-5">
      {summary ? (
        <p className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm leading-relaxed text-foreground/90">
          {summary}
        </p>
      ) : null}

      {nodes.length > 0 ? (
        <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Funnel flow
          </p>
          <div className="flex flex-col items-stretch gap-2">
            {nodes.map((n, i) => {
              const label = typeof n.label === "string" ? n.label : `Step ${i + 1}`;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-full max-w-md rounded-xl border border-violet-500/30 bg-violet-500/[0.05] px-4 py-2.5 text-center text-sm font-semibold text-foreground">
                    {label}
                  </div>
                  {i < nodes.length - 1 ? (
                    <ArrowDown
                      className="my-1 size-4 text-muted-foreground/50"
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {emails.length > 0 || sms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {emails.length > 0 ? (
            <ListBlock title="Email follow-ups" items={emails} accent="violet" />
          ) : null}
          {sms.length > 0 ? <ListBlock title="SMS follow-ups" items={sms} accent="cyan" /> : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage 5: Generation
// ---------------------------------------------------------------------------

function GenerationView({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload) return <EmptyHint message="Generation plan will appear here." />;
  const planned = stringArray(payload.plannedAssets);
  if (planned.length === 0) {
    return <EmptyHint message="No planned assets listed yet." />;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {planned.map((a) => (
        <div
          key={a}
          className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-xs font-medium"
        >
          <CheckCircle2 className="size-3.5 text-emerald-400" aria-hidden />
          {humanize(a)}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage 7: Scoring
// ---------------------------------------------------------------------------

function ScoringView({
  payload,
  assets,
}: {
  payload: Record<string, unknown> | null;
  assets: AssetRow[];
}) {
  if (!payload && assets.length === 0) {
    return <EmptyHint message="Scoring breakdown will appear here." />;
  }

  const winnerByKind =
    payload && payload.winnerByKind && typeof payload.winnerByKind === "object"
      ? (payload.winnerByKind as Record<string, string>)
      : {};

  const landingAssets = assets
    .filter((a) => a.kind === "landing_page")
    .slice()
    .sort((a, b) => a.variant_label.localeCompare(b.variant_label));

  return (
    <div className="space-y-4">
      {Object.keys(winnerByKind).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Object.entries(winnerByKind).map(([kind, label]) => (
            <span
              key={kind}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200"
            >
              {humanize(kind)} winner: Variant {label}
            </span>
          ))}
        </div>
      ) : null}

      {landingAssets.length > 0 ? (
        <div className="space-y-2">
          {landingAssets.map((a) => {
            const score = (a.score as Record<string, unknown> | null) ?? null;
            const total = pickTotalScore(score);
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card/40 px-4 py-3",
                  a.is_winner ? "border-emerald-500/40" : "border-border/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                    a.is_winner
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-muted/40 text-muted-foreground",
                  )}
                >
                  {a.variant_label}
                </span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-border/30">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        a.is_winner ? "bg-emerald-400" : "bg-violet-400/70",
                      )}
                      style={{ width: `${Math.max(0, Math.min(100, total ?? 0))}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right font-mono text-sm font-semibold">
                  {total !== null ? Math.round(total) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function FieldBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: unknown;
  icon?: React.ReactNode;
}) {
  const text =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground/95">{text}</p>
    </div>
  );
}

function ListBlock({
  title,
  items,
  accent = "muted",
}: {
  title: string;
  items: string[];
  accent?: "muted" | "rose" | "emerald" | "violet" | "cyan";
}) {
  if (items.length === 0) return null;
  const accentColor = {
    muted: "text-muted-foreground/80",
    rose: "text-rose-200/90",
    emerald: "text-emerald-200/90",
    violet: "text-violet-200/90",
    cyan: "text-cyan-200/90",
  }[accent];
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <p className={cn("mb-2 text-[10px] font-medium uppercase tracking-[0.18em]", accentColor)}>
        {title}
      </p>
      <ul className="space-y-1.5 text-sm text-foreground/90">
        {items.slice(0, 8).map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/40" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChipCloud({
  title,
  items,
  accent = "muted",
}: {
  title: string;
  items: string[];
  accent?: "muted" | "violet" | "cyan";
}) {
  const chipClass = {
    muted: "border-border/60 bg-card/60 text-foreground/85",
    violet: "border-violet-500/30 bg-violet-500/[0.08] text-violet-100",
    cyan: "border-cyan-500/30 bg-cyan-500/[0.08] text-cyan-100",
  }[accent];
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 14).map((k, i) => (
          <span
            key={i}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              chipClass,
            )}
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function pickTotalScore(score: Record<string, unknown> | null): number | null {
  if (!score) return null;
  const directTotal =
    typeof score.total === "number"
      ? score.total
      : typeof score.totalScore === "number"
        ? score.totalScore
        : null;
  if (directTotal !== null) return directTotal;
  const axes = score.axes;
  if (axes && typeof axes === "object") {
    const nums = Object.values(axes as Record<string, unknown>).filter(
      (v): v is number => typeof v === "number",
    );
    if (nums.length > 0) return nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  return null;
}

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}
