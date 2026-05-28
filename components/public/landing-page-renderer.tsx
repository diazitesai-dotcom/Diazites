import Image from "next/image";
import { CheckCircle2, ChevronDown, Play } from "lucide-react";

import { LandingLeadForm } from "@/components/public/landing-lead-form";
import type { PublicLandingAsset } from "@/lib/landing/build-public-config";
import type { LandingSection } from "@/types/marketing-os";
import { cn } from "@/lib/utils";

export type LandingAssetPayload = PublicLandingAsset;

type ThemeKey = "violet" | "cyan" | "emerald" | "amber";

const THEME_STYLES: Record<
  ThemeKey,
  { glow: string; accent: string; badge: string; ring: string }
> = {
  violet: {
    glow: "rgba(167,139,250,0.22)",
    accent: "text-violet-300",
    badge: "bg-violet-500/15 border-violet-500/30 text-violet-200",
    ring: "ring-violet-500/40",
  },
  cyan: {
    glow: "rgba(34,211,238,0.18)",
    accent: "text-cyan-300",
    badge: "bg-cyan-500/15 border-cyan-500/30 text-cyan-100",
    ring: "ring-cyan-500/40",
  },
  emerald: {
    glow: "rgba(52,211,153,0.18)",
    accent: "text-emerald-300",
    badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-100",
    ring: "ring-emerald-500/40",
  },
  amber: {
    glow: "rgba(251,191,36,0.16)",
    accent: "text-amber-300",
    badge: "bg-amber-500/15 border-amber-500/30 text-amber-100",
    ring: "ring-amber-500/40",
  },
};

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
  const theme = (asset.theme as ThemeKey) ?? "violet";
  const styles = THEME_STYLES[theme] ?? THEME_STYLES.violet;
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06060b] text-foreground">
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(ellipse 70% 50% at 20% -10%, ${styles.glow}, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 0%, rgba(255,255,255,0.04), transparent 50%)`,
        }}
      />

      <header className="relative z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <p className="text-sm font-semibold tracking-tight">{displayBrand}</p>
          <div className="flex items-center gap-3">
            {location ? (
              <p className="hidden text-xs text-muted-foreground sm:block">{location}</p>
            ) : null}
            <a
              href="#lead-form"
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                styles.badge,
              )}
            >
              {primaryCta}
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <p className={cn("text-xs font-bold uppercase tracking-[0.28em]", styles.accent)}>
                {location ? `Serving ${location}` : "AI growth platform"}
              </p>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                {headline}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{subheadline}</p>

              {stats.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {stats.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center"
                    >
                      <p className={cn("text-xl font-bold", styles.accent)}>{s.value}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {bullets.length > 0 ? (
                <ul className="space-y-2.5">
                  {bullets.slice(0, 5).map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                      <span className="text-foreground/90">{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="relative">
              {heroImage ? (
                <div
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 shadow-2xl ring-1",
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
                <div className="aspect-[4/3] rounded-2xl border border-dashed border-white/15 bg-white/[0.02]" />
              )}
            </div>
          </div>
        </section>

        {videoUrl ? (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-center gap-2">
              <Play className={cn("size-5", styles.accent)} />
              <h2 className="text-2xl font-semibold">See it in action</h2>
            </div>
            <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
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
          <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="mb-6 text-2xl font-semibold">Product showcase</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10"
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
          <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="mb-6 text-2xl font-semibold">Trusted by teams like yours</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <blockquote
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
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
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-lg italic text-muted-foreground">
              {socialProof}
            </p>
          </section>
        ) : null}

        {faqs.length > 0 ? (
          <section className="mx-auto max-w-3xl px-4 py-12">
            <h2 className="mb-6 text-center text-2xl font-semibold">FAQ</h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
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

        <section
          id="lead-form"
          className="mx-auto max-w-6xl scroll-mt-8 px-4 py-16"
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold">Ready to launch?</h2>
              <p className="text-muted-foreground">
                Tell us about your project — {displayBrand} will follow up fast.
              </p>
            </div>
            <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Free consultation
              </p>
              <LandingLeadForm slug={slug} primaryCta={primaryCta} />
            </aside>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {displayBrand}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
