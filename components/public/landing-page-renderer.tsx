import { CheckCircle2 } from "lucide-react";

import { LandingLeadForm } from "@/components/public/landing-lead-form";

export type LandingAssetPayload = {
  headline?: string;
  subheadline?: string;
  bullets?: string[];
  primaryCta?: string;
  socialProof?: string;
  heroImageBrief?: string;
};

type LandingPageRendererProps = {
  slug: string;
  asset: LandingAssetPayload;
  businessName?: string | null;
  location?: string | null;
};

export function LandingPageRenderer({
  slug,
  asset,
  businessName,
  location,
}: LandingPageRendererProps) {
  const headline = asset.headline ?? "Get a free estimate today";
  const subheadline =
    asset.subheadline ??
    "Professional, local, and fully insured — get help in minutes.";
  const bullets = asset.bullets ?? [];
  const primaryCta = asset.primaryCta ?? "Get my free quote";
  const socialProof = asset.socialProof;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="surface-grid absolute inset-x-0 top-0 h-[480px] opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 30% 0%, rgba(167,139,250,0.18), transparent 60%), radial-gradient(ellipse 50% 35% at 80% 10%, rgba(34,211,238,0.12), transparent 60%)",
        }}
      />

      <header className="relative z-10 border-b border-border/40 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <p className="text-sm font-semibold tracking-tight">
            {businessName ?? "Local Roofing Experts"}
          </p>
          {location ? (
            <p className="text-xs text-muted-foreground">{location}</p>
          ) : null}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <section className="space-y-6">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-violet-300">
              {location ? `Serving ${location}` : "Local experts"}
            </p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
              {headline}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              {subheadline}
            </p>

            {bullets.length > 0 ? (
              <ul className="space-y-2.5 pt-2">
                {bullets.slice(0, 6).map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
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
              <p className="rounded-xl border border-border/50 bg-card/60 p-4 text-sm italic text-muted-foreground">
                “{socialProof}”
              </p>
            ) : null}
          </section>

          <aside id="lead-form" className="lg:sticky lg:top-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Free quote · 60-second form
            </p>
            <LandingLeadForm slug={slug} primaryCta={primaryCta} />
          </aside>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/40 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {businessName ?? "Local Roofing Experts"}.
          All rights reserved.
        </p>
      </footer>
    </div>
  );
}
