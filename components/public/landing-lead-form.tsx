"use client";

import { useEffect, useState, useTransition } from "react";

type LandingLeadFormProps = {
  slug: string;
  primaryCta: string;
};

function fireTrack(
  slug: string,
  type: "page_view" | "cta_click" | "form_view" | "form_submit",
  payload?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        type,
        landingPageSlug: slug,
        payload: payload ?? {},
      }),
    });
  } catch {
    // never throw from telemetry
  }
}

export function LandingLeadForm({ slug, primaryCta }: LandingLeadFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fireTrack(slug, "page_view", { path: window.location.pathname });
    fireTrack(slug, "form_view");
  }, [slug]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const body = {
          landingPageSlug: slug,
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          address: String(formData.get("address") ?? ""),
          roofingNeed: String(formData.get("roofing_need") ?? ""),
          source: "landing_page",
        };

        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(json?.error ?? "Submission failed");
        }

        setSubmitted(true);
        fireTrack(slug, "form_submit");

        if (typeof window !== "undefined") {
          const win = window as unknown as { fbq?: (...a: unknown[]) => void };
          if (typeof win.fbq === "function") win.fbq("track", "Lead");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Submission failed");
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.06] p-6 text-center">
        <p className="text-lg font-semibold text-emerald-200">
          Thanks — we got your request.
        </p>
        <p className="mt-1 text-sm text-emerald-200/80">
          We&apos;ll reach out within one business day.
        </p>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur"
    >
      <LeadField name="name" label="Full name" required placeholder="Your name" />
      <LeadField name="email" label="Email" type="email" placeholder="you@example.com" />
      <LeadField name="phone" label="Phone" type="tel" placeholder="(555) 555-5555" />
      <LeadField name="address" label="Property address" placeholder="Street, city" />
      <div className="space-y-1.5">
        <label htmlFor="lf-roofing_need" className="text-sm font-medium">
          Tell us about your project
        </label>
        <textarea
          id="lf-roofing_need"
          name="roofing_need"
          rows={3}
          className="w-full rounded-xl border border-input bg-background/40 px-3 py-2 text-sm outline-none focus-visible:border-violet-500/40 focus-visible:ring-[3px] focus-visible:ring-violet-500/25"
          placeholder="What's happening with your roof?"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        onClick={() => {
          fireTrack(slug, "cta_click");
          if (typeof window !== "undefined") {
            const win = window as unknown as {
              fbq?: (...a: unknown[]) => void;
              gtag?: (...a: unknown[]) => void;
            };
            if (typeof win.fbq === "function")
              win.fbq("trackCustom", "CTA_Click", { slug });
            if (typeof win.gtag === "function")
              win.gtag("event", "cta_click", { slug });
          }
        }}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-6 py-3 text-base font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_32px_-12px_rgba(99,102,241,0.55)] transition hover:brightness-[1.06] disabled:opacity-60"
      >
        {pending ? "Sending…" : primaryCta || "Get my free quote"}
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        We&apos;ll never share your information. By submitting, you agree to be contacted about your inquiry.
      </p>
    </form>
  );
}

function LeadField({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const id = `lf-${name}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-input bg-background/40 px-3 py-2 text-sm outline-none focus-visible:border-violet-500/40 focus-visible:ring-[3px] focus-visible:ring-violet-500/25"
      />
    </div>
  );
}
