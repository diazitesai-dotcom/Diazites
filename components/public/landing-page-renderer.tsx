import Image from "next/image";
import { ArrowRight, CheckCircle2, ChevronDown, Play, Sparkles } from "lucide-react";

import { LandingLeadForm } from "@/components/public/landing-lead-form";
import type { PublicLandingAsset } from "@/lib/landing/build-public-config";
import type { LandingSection } from "@/types/marketing-os";
import { cn } from "@/lib/utils";

export type LandingAssetPayload = PublicLandingAsset;

type ThemeKey = "violet" | "cyan" | "emerald" | "amber" | "rose" | "indigo";

const THEME_STYLES: Record<
  ThemeKey,
  { glow: string; accent: string; badge: string; ring: string; cta: string }
> = {
  violet: {
    glow: "rgba(167,139,250,0.22)",
    accent: "text-violet-300",
    badge: "bg-violet-500/15 border-violet-500/30 text-violet-200",
    ring: "ring-violet-500/40",
    cta: "bg-violet-500 hover:bg-violet-400 text-white",
  },
  cyan: {
    glow: "rgba(34,211,238,0.18)",
    accent: "text-cyan-300",
    badge: "bg-cyan-500/15 border-cyan-500/30 text-cyan-100",
    ring: "ring-cyan-500/40",
    cta: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
  },
  emerald: {
    glow: "rgba(52,211,153,0.18)",
    accent: "text-emerald-300",
    badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-100",
    ring: "ring-emerald-500/40",
    cta: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
  },
  amber: {
    glow: "rgba(251,191,36,0.16)",
    accent: "text-amber-300",
    badge: "bg-amber-500/15 border-amber-500/30 text-amber-100",
    ring: "ring-amber-500/40",
    cta: "bg-amber-400 hover:bg-amber-300 text-slate-950",
  },
  rose: {
    glow: "rgba(251,113,133,0.18)",
    accent: "text-rose-300",
    badge: "bg-rose-500/15 border-rose-500/30 text-rose-100",
    ring: "ring-rose-500/40",
    cta: "bg-rose-500 hover:bg-rose-400 text-white",
  },
  indigo: {
    glow: "rgba(129,140,248,0.2)",
    accent: "text-indigo-300",
    badge: "bg-indigo-500/15 border-indigo-500/30 text-indigo-100",
    ring: "ring-indigo-500/40",
    cta: "bg-indigo-500 hover:bg-indigo-400 text-white",
  },
};

type DesignKey = "aurora" | "spotlight" | "editorial" | "minimal";

type LayoutStyle = {
  /** Hero composition. */
  hero: "split" | "centered" | "image-bg";
  /** Base page background color. */
  pageBg: string;
  /** Background pattern, given the theme glow color. */
  background: (glow: string) => string;
  /** Corner radius scale for cards/images. */
  radius: string;
  /** CTA button shape. */
  ctaShape: string;
  /** Heading font + tracking. */
  heading: string;
  /** Eyebrow casing. */
  eyebrow: string;
  /** Outer content width. */
  maxWidth: string;
};

const LAYOUT_STYLES: Record<DesignKey, LayoutStyle> = {
  aurora: {
    hero: "split",
    pageBg: "bg-[#06060b]",
    background: (glow) =>
      `radial-gradient(ellipse 70% 50% at 20% -10%, ${glow}, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 0%, rgba(255,255,255,0.04), transparent 50%)`,
    radius: "rounded-2xl",
    ctaShape: "rounded-full",
    heading: "font-bold tracking-tight",
    eyebrow: "uppercase tracking-[0.28em]",
    maxWidth: "max-w-6xl",
  },
  spotlight: {
    hero: "image-bg",
    pageBg: "bg-[#050507]",
    background: (glow) =>
      `radial-gradient(circle at 50% 0%, ${glow}, transparent 60%), radial-gradient(circle at 50% 120%, rgba(255,255,255,0.05), transparent 55%)`,
    radius: "rounded-3xl",
    ctaShape: "rounded-full",
    heading: "font-extrabold tracking-tight",
    eyebrow: "uppercase tracking-[0.35em]",
    maxWidth: "max-w-5xl",
  },
  editorial: {
    hero: "centered",
    pageBg: "bg-[#0a0a0c]",
    background: () =>
      `linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`,
    radius: "rounded-none",
    ctaShape: "rounded-md",
    heading: "font-serif font-medium tracking-tight",
    eyebrow: "uppercase tracking-[0.2em]",
    maxWidth: "max-w-4xl",
  },
  minimal: {
    hero: "centered",
    pageBg: "bg-[#08080c]",
    background: (glow) => `radial-gradient(ellipse 60% 40% at 50% -20%, ${glow}, transparent 70%)`,
    radius: "rounded-xl",
    ctaShape: "rounded-lg",
    heading: "font-semibold tracking-tight",
    eyebrow: "uppercase tracking-[0.18em]",
    maxWidth: "max-w-3xl",
  },
};

const THEME_ORDER: ThemeKey[] = ["violet", "cyan", "emerald", "amber", "rose", "indigo"];
const DESIGN_ORDER: DesignKey[] = ["aurora", "spotlight", "editorial", "minimal"];

/** Stable hash so a given slug always renders the same (but varied) design. */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

type LandingPageRendererProps = {
  slug: string;
  asset: LandingAssetPayload;
  sections?: LandingSection[];
  businessName?: string | null;
  location?: string | null;
};

export function LandingPageRenderer({
  slug,
  asset,
  sections = [],
  businessName,
  location,
}: LandingPageRendererProps) {
  const seed = hashSeed(slug || asset.headline || "diazites");

  const theme: ThemeKey =
    (asset.theme as ThemeKey) && THEME_STYLES[asset.theme as ThemeKey]
      ? (asset.theme as ThemeKey)
      : THEME_ORDER[seed % THEME_ORDER.length];
  const styles = THEME_STYLES[theme] ?? THEME_STYLES.violet;

  const design: DesignKey =
    (asset.design as DesignKey) && LAYOUT_STYLES[asset.design as DesignKey]
      ? (asset.design as DesignKey)
      : DESIGN_ORDER[(seed >> 3) % DESIGN_ORDER.length];
  const layout = LAYOUT_STYLES[design] ?? LAYOUT_STYLES.aurora;

  const displayBrand = asset.brandName?.trim() || businessName || "Your brand";
  const headline = asset.headline ?? "Grow faster with AI";
  const subheadline =
    asset.subheadline ?? "Modern landing pages, agents, and automation in one platform.";
  const bullets = asset.bullets ?? [];
  const primaryCta = asset.primaryCta ?? "Get started";
  const heroImage = asset.heroImageUrl;
  const stats = asset.stats ?? [];
  const gallery = asset.gallery ?? [];
  const testimonials = asset.testimonials ?? [];
  const faqs = asset.faqs ?? [];
  const videoUrl = asset.videoEmbedUrl;

  const offerSection = sections.find((s) => s.type === "offer" && s.enabled);
  const socialProof =
    asset.socialProof || (offerSection?.content?.body ? String(offerSection.content.body) : "");

  const eyebrowText = location ? `Serving ${location}` : "AI growth platform";

  return (
    <div className={cn("relative min-h-screen overflow-hidden text-foreground", layout.pageBg)}>
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        aria-hidden
        style={{
          backgroundImage: layout.background(styles.glow),
          backgroundSize: design === "editorial" ? "44px 44px" : undefined,
        }}
      />

      <header className="relative z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 px-4 py-4",
            layout.maxWidth,
          )}
        >
          <p className="text-sm font-semibold tracking-tight">{displayBrand}</p>
          <div className="flex items-center gap-3">
            {location ? (
              <p className="hidden text-xs text-muted-foreground sm:block">{location}</p>
            ) : null}
            <a
              href="#lead-form"
              className={cn(
                "border px-3 py-1.5 text-xs font-medium transition-colors",
                layout.ctaShape,
                styles.badge,
              )}
            >
              {primaryCta}
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <HeroBlock
          layout={layout}
          styles={styles}
          design={design}
          eyebrow={eyebrowText}
          eyebrowClass={cn("text-xs font-bold", layout.eyebrow, styles.accent)}
          headline={headline}
          subheadline={subheadline}
          bullets={bullets}
          stats={stats}
          heroImage={heroImage}
          primaryCta={primaryCta}
          ctaClass={cn(
            "inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-colors",
            layout.ctaShape,
            styles.cta,
          )}
        />

        {videoUrl ? (
          <section className={cn("mx-auto px-4 py-12", layout.maxWidth)}>
            <div className="mb-6 flex items-center gap-2">
              <Play className={cn("size-5", styles.accent)} />
              <h2 className={cn("text-2xl", layout.heading)}>See it in action</h2>
            </div>
            <div
              className={cn(
                "aspect-video overflow-hidden border border-white/10 bg-black shadow-2xl",
                layout.radius,
              )}
            >
              <iframe
                src={videoUrl}
                title="Product demo"
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        ) : null}

        {gallery.length > 0 ? (
          <section className={cn("mx-auto px-4 py-12", layout.maxWidth)}>
            <h2 className={cn("mb-6 text-2xl", layout.heading)}>Product showcase</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((img, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden border border-white/10",
                    layout.radius,
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {testimonials.length > 0 ? (
          <section className={cn("mx-auto px-4 py-12", layout.maxWidth)}>
            <h2 className={cn("mb-6 text-2xl", layout.heading)}>Trusted by teams like yours</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <blockquote
                  key={i}
                  className={cn("border border-white/10 bg-white/[0.03] p-5", layout.radius)}
                >
                  <p className="text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="mt-4 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{t.author}</span>
                    {t.role ? ` · ${t.role}` : null}
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        ) : null}

        {socialProof ? (
          <section className="mx-auto max-w-3xl px-4 py-8 text-center">
            <p
              className={cn(
                "border border-white/10 bg-white/[0.03] px-6 py-5 text-lg italic text-muted-foreground",
                layout.radius,
              )}
            >
              {socialProof}
            </p>
          </section>
        ) : null}

        {faqs.length > 0 ? (
          <section className="mx-auto max-w-3xl px-4 py-12">
            <h2 className={cn("mb-6 text-center text-2xl", layout.heading)}>FAQ</h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className={cn(
                    "group border border-white/10 bg-white/[0.02] px-4 py-3",
                    layout.radius,
                  )}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium">
                    {f.question}
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <ProcessBlock layout={layout} styles={styles} brand={displayBrand} />

        <section id="lead-form" className="relative scroll-mt-8 px-4 py-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-[420px] -translate-y-1/2"
            aria-hidden
            style={{
              backgroundImage: `radial-gradient(ellipse 50% 60% at 50% 50%, ${styles.glow}, transparent 70%)`,
            }}
          />
          <div className={cn("relative mx-auto", layout.maxWidth)}>
            <div
              className={cn(
                "mx-auto max-w-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 shadow-2xl ring-1 backdrop-blur-xl sm:p-10",
                layout.radius,
                styles.ring,
              )}
            >
              <div className="text-center">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                    layout.ctaShape,
                    styles.badge,
                  )}
                >
                  <Sparkles className="size-3.5" />
                  Free consultation
                </span>
                <h2 className={cn("mt-5 text-3xl md:text-4xl", layout.heading)}>
                  Claim your free consultation
                </h2>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  No obligation, no pressure. Tell us about your project and {displayBrand} will
                  follow up within 24 hours.
                </p>
              </div>

              <div className="mx-auto mt-8 max-w-lg">
                <LandingLeadForm slug={slug} primaryCta={primaryCta} />
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs text-muted-foreground">
                {["100% free quote", "No spam, ever", "Fast 24h response", "Local & insured"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className={cn("size-3.5", styles.accent)} />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <ClosingCta layout={layout} styles={styles} brand={displayBrand} cta={primaryCta} />
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {displayBrand}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function ProcessBlock({
  layout,
  styles,
  brand,
}: {
  layout: LayoutStyle;
  styles: (typeof THEME_STYLES)[ThemeKey];
  brand: string;
}) {
  const steps = [
    {
      title: "Tell us what you need",
      body: "Share your goals in a quick 60-second form — no commitment required.",
    },
    {
      title: "Get a tailored plan",
      body: `${brand} reviews your details and sends a clear, personalized recommendation.`,
    },
    {
      title: "Start seeing results",
      body: "Approve the plan and we get to work — with progress you can track every step.",
    },
  ];

  return (
    <section className={cn("mx-auto px-4 py-14", layout.maxWidth)}>
      <div className="mb-10 text-center">
        <p className={cn("text-xs font-bold", layout.eyebrow, styles.accent)}>How it works</p>
        <h2 className={cn("mt-3 text-3xl md:text-4xl", layout.heading)}>
          Get started in three simple steps
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "relative border border-white/10 bg-white/[0.03] p-6",
              layout.radius,
            )}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center border text-sm font-bold",
                layout.ctaShape,
                styles.badge,
              )}
            >
              {i + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosingCta({
  layout,
  styles,
  brand,
  cta,
}: {
  layout: LayoutStyle;
  styles: (typeof THEME_STYLES)[ThemeKey];
  brand: string;
  cta: string;
}) {
  return (
    <section className={cn("mx-auto px-4 pb-20 pt-6", layout.maxWidth)}>
      <div
        className={cn(
          "relative overflow-hidden border border-white/10 px-6 py-14 text-center shadow-2xl sm:px-12",
          layout.radius,
        )}
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 100% at 50% 0%, ${styles.glow}, transparent 70%)`,
        }}
      >
        <h2 className={cn("mx-auto max-w-2xl text-3xl md:text-4xl", layout.heading)}>
          Ready to work with {brand}?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Join the customers already growing with us. It only takes a minute to get started.
        </p>
        <a
          href="#lead-form"
          className={cn(
            "mt-8 inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold transition-colors",
            layout.ctaShape,
            styles.cta,
          )}
        >
          {cta}
          <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}

function HeroBlock({
  layout,
  styles,
  design,
  eyebrow,
  eyebrowClass,
  headline,
  subheadline,
  bullets,
  stats,
  heroImage,
  primaryCta,
  ctaClass,
}: {
  layout: LayoutStyle;
  styles: (typeof THEME_STYLES)[ThemeKey];
  design: DesignKey;
  eyebrow: string;
  eyebrowClass: string;
  headline: string;
  subheadline: string;
  bullets: string[];
  stats: Array<{ value: string; label: string }>;
  heroImage?: string;
  primaryCta: string;
  ctaClass: string;
}) {
  const StatsBlock = stats.length > 0 && (
    <div className="grid grid-cols-3 gap-3 pt-2">
      {stats.map((s, i) => (
        <div
          key={i}
          className={cn("border border-white/10 bg-white/[0.03] px-3 py-3 text-center", layout.radius)}
        >
          <p className={cn("text-xl font-bold", styles.accent)}>{s.value}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );

  const BulletsBlock = bullets.length > 0 && (
    <ul className="space-y-2.5">
      {bullets.slice(0, 5).map((b, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          <span className="text-foreground/90">{b}</span>
        </li>
      ))}
    </ul>
  );

  const Cta = (
    <a href="#lead-form" className={ctaClass}>
      {primaryCta}
    </a>
  );

  // Image-background hero: text overlaid on a full-width hero image.
  if (design === "spotlight") {
    return (
      <section className="relative">
        <div className="relative min-h-[78vh] w-full overflow-hidden">
          {heroImage ? (
            <Image
              src={heroImage}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
          <div
            className={cn(
              "relative z-10 mx-auto flex min-h-[78vh] flex-col items-center justify-center px-4 py-20 text-center",
              layout.maxWidth,
            )}
          >
            <p className={eyebrowClass}>{eyebrow}</p>
            <h1 className={cn("mt-5 max-w-4xl text-4xl leading-[1.05] md:text-6xl lg:text-7xl", layout.heading)}>
              {headline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{subheadline}</p>
            <div className="mt-8">{Cta}</div>
            {StatsBlock ? <div className="mt-10 w-full max-w-2xl">{StatsBlock}</div> : null}
          </div>
        </div>
      </section>
    );
  }

  // Centered hero (editorial / minimal): single column, image as banner below.
  if (layout.hero === "centered") {
    return (
      <section className={cn("mx-auto px-4 pb-8 pt-12 text-center md:pt-20", layout.maxWidth)}>
        <p className={cn(eyebrowClass, "inline-block")}>{eyebrow}</p>
        <h1
          className={cn(
            "mx-auto mt-5 max-w-3xl text-4xl leading-[1.08] md:text-5xl lg:text-6xl",
            layout.heading,
          )}
        >
          {headline}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {subheadline}
        </p>
        <div className="mt-8 flex justify-center">{Cta}</div>
        {StatsBlock ? <div className="mx-auto mt-10 max-w-2xl">{StatsBlock}</div> : null}
        {heroImage ? (
          <div
            className={cn(
              "relative mx-auto mt-12 aspect-[16/9] max-w-4xl overflow-hidden border border-white/10 shadow-2xl ring-1",
              layout.radius,
              styles.ring,
            )}
          >
            <Image
              src={heroImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              unoptimized
            />
          </div>
        ) : null}
        {BulletsBlock ? (
          <div className="mx-auto mt-10 max-w-lg text-left">{BulletsBlock}</div>
        ) : null}
      </section>
    );
  }

  // Split hero (aurora default): copy left, image right.
  return (
    <section className={cn("mx-auto px-4 pb-8 pt-10 md:pt-16", layout.maxWidth)}>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className={eyebrowClass}>{eyebrow}</p>
          <h1 className={cn("text-4xl leading-[1.05] md:text-5xl lg:text-6xl", layout.heading)}>
            {headline}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{subheadline}</p>
          <div>{Cta}</div>
          {StatsBlock}
          {BulletsBlock}
        </div>

        <div className="relative">
          {heroImage ? (
            <div
              className={cn(
                "relative aspect-[4/3] overflow-hidden border border-white/10 shadow-2xl ring-1",
                layout.radius,
                styles.ring,
              )}
            >
              <Image
                src={heroImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div
              className={cn(
                "aspect-[4/3] border border-dashed border-white/15 bg-white/[0.02]",
                layout.radius,
              )}
            />
          )}
        </div>
      </div>
    </section>
  );
}
