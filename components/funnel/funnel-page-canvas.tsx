"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LandingFormField, LandingSection } from "@/types/marketing-os";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  offer: "Offer",
  benefits: "Benefits",
  testimonials: "Testimonials",
  faq: "FAQ",
  video: "Video",
  gallery: "Gallery",
  before_after: "Before / After",
  map: "Map",
  pricing: "Pricing",
  contact_form: "Form",
  calendar: "Calendar",
  trust_badges: "Trust Badges",
};

type FunnelPageCanvasProps = {
  page: Record<string, unknown>;
  sections: LandingSection[];
  formFields: LandingFormField[];
  selectedSectionId: string | null;
  device: "desktop" | "tablet" | "mobile";
  onSelectSection: (id: string) => void;
  onUpdateSection: (id: string, patch: Partial<LandingSection>) => void;
};

export function FunnelPageCanvas({
  page,
  sections,
  formFields,
  selectedSectionId,
  device,
  onSelectSection,
  onUpdateSection,
}: FunnelPageCanvasProps) {
  const enabled = [...sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const width =
    device === "mobile" ? "max-w-[390px]" : device === "tablet" ? "max-w-[768px]" : "max-w-[1024px]";

  return (
    <div className="flex min-h-full justify-center bg-[#0a0a0f] p-6">
      <div
        className={cn(
          "w-full overflow-hidden rounded-xl border border-white/10 bg-background shadow-2xl transition-all",
          width,
        )}
      >
        {enabled.length === 0 ? (
          <div className="flex min-h-[480px] items-center justify-center p-8 text-center text-sm text-muted-foreground">
            Enable at least one section from the Layers panel to build your page.
          </div>
        ) : (
          enabled.map((section) => (
            <CanvasSection
              key={section.id}
              section={section}
              page={page}
              formFields={formFields}
              selected={selectedSectionId === section.id}
              onSelect={() => onSelectSection(section.id)}
              onUpdate={(patch) => onUpdateSection(section.id, patch)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CanvasSection({
  section,
  page,
  formFields,
  selected,
  onSelect,
  onUpdate,
}: {
  section: LandingSection;
  page: Record<string, unknown>;
  formFields: LandingFormField[];
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<LandingSection>) => void;
}) {
  const label = SECTION_LABELS[section.type] ?? section.type;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      className={cn(
        "group relative border-b border-white/[0.06] transition-all",
        selected
          ? "ring-2 ring-inset ring-violet-500/60"
          : "hover:ring-1 hover:ring-inset hover:ring-violet-500/30",
      )}
    >
      <span className="absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-200 opacity-0 transition-opacity group-hover:opacity-100 data-[selected=true]:opacity-100">
        {label}
      </span>

      {section.type === "hero" ? (
        <section className="bg-gradient-to-br from-violet-950/80 via-background to-cyan-950/40 px-8 py-16 text-center">
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
              onUpdate({ content: { ...section.content, headline: e.currentTarget.textContent ?? "" } })
            }
          >
            {String(section.content.headline ?? page.headline ?? "Your Headline")}
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
              onUpdate({ content: { ...section.content, subheadline: e.currentTarget.textContent ?? "" } })
            }
          >
            {String(section.content.subheadline ?? page.subheadline ?? "Your subheadline goes here")}
          </p>
          {page.location ? (
            <p className="mt-3 text-sm text-muted-foreground">Serving {String(page.location)}</p>
          ) : null}
          <Button variant="gradient" className="mt-8 rounded-xl px-8" type="button">
            {String(section.content.cta ?? page.cta_text ?? "Get Started")}
          </Button>
        </section>
      ) : null}

      {section.type === "offer" ? (
        <section className="px-8 py-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="text-2xl font-semibold">
              {String(section.content.title ?? "Our Offer")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {String(section.content.body ?? page.offer ?? "Describe your offer here.")}
            </p>
          </div>
        </section>
      ) : null}

      {section.type === "benefits" ? (
        <section className="px-8 py-12">
          <h2 className="mb-6 text-center text-2xl font-semibold">Why Choose Us</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {((section.content.items as string[] | undefined) ?? ["Benefit one", "Benefit two"]).map(
              (item, i) => (
                <li
                  key={`${item}-${i}`}
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
        </section>
      ) : null}

      {section.type === "testimonials" ? (
        <section className="px-8 py-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-lg italic text-muted-foreground">
              &ldquo;{String(section.content.quote ?? "Amazing service — highly recommend!")}&rdquo;
            </p>
            <p className="mt-3 text-sm font-medium">
              — {String(section.content.author ?? "Happy Customer")}
            </p>
          </div>
        </section>
      ) : null}

      {section.type === "faq" ? (
        <section className="px-8 py-12">
          <h2 className="mb-6 text-2xl font-semibold">FAQ</h2>
          <div className="space-y-3">
            {((section.content.items as Array<{ q: string; a: string }> | undefined) ?? [
              { q: "How fast can you respond?", a: "We respond within 24 hours." },
            ]).map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-4">
                <p className="font-medium">{item.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {section.type === "contact_form" ? (
        <section className="px-8 py-12">
          <h2 className="mb-6 text-2xl font-semibold">
            {String(section.content.title ?? "Request a Quote")}
          </h2>
          <div className="space-y-3 rounded-2xl border border-white/10 p-6">
            {formFields.slice(0, 5).map((field) => (
              <div key={field.id} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea placeholder={field.label} disabled className="resize-none" />
                ) : (
                  <Input placeholder={field.label} disabled />
                )}
              </div>
            ))}
            <Button variant="gradient" className="w-full rounded-xl" type="button" disabled>
              Submit
            </Button>
          </div>
        </section>
      ) : null}

      {section.type === "trust_badges" ? (
        <section className="px-8 py-10">
          <div className="flex flex-wrap justify-center gap-4">
            {((section.content.badges as string[] | undefined) ?? ["Licensed", "Insured", "5-Star Rated"]).map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-200"
                >
                  {badge}
                </span>
              ),
            )}
          </div>
        </section>
      ) : null}

      {!["hero", "offer", "benefits", "testimonials", "faq", "contact_form", "trust_badges"].includes(
        section.type,
      ) ? (
        <section className="px-8 py-12 text-center text-sm text-muted-foreground">
          {label} section — configure in the properties panel
        </section>
      ) : null}
    </div>
  );
}
