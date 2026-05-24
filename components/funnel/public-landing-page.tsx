"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LandingFormField, LandingSection } from "@/types/marketing-os";

type PublicLandingPageProps = {
  page: Record<string, unknown>;
  version: Record<string, unknown> | null;
  utm?: { source?: string; medium?: string; campaign?: string };
};

const defaultFields: LandingFormField[] = [
  { id: "name", key: "name", label: "Name", type: "text", required: true, crmField: "name" },
  { id: "phone", key: "phone", label: "Phone", type: "phone", required: true, crmField: "phone" },
  { id: "email", key: "email", label: "Email", type: "email", required: true, crmField: "email" },
];

export function PublicLandingPage({ page, version, utm }: PublicLandingPageProps) {
  const sections = (version?.sections as LandingSection[] | undefined) ?? [];
  const formFields = (version?.form_fields as LandingFormField[] | undefined) ?? defaultFields;
  const hero = sections.find((s) => s.type === "hero" && s.enabled);
  const offer = sections.find((s) => s.type === "offer" && s.enabled);

  useEffect(() => {
    void fetch("/api/landing-pages/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: page.business_id,
        landingPageId: page.id,
        versionId: version?.id,
        campaignId: page.campaign_id,
        source: utm?.source ?? "direct",
        utmSource: utm?.source,
        utmMedium: utm?.medium,
        utmCampaign: utm?.campaign,
      }),
    });
  }, [page, version, utm]);

  return (
    <main className="min-h-screen bg-background">
      <PageContent
        page={page}
        hero={hero}
        offer={offer}
        formFields={formFields}
        version={version}
        utm={utm}
      />
    </main>
  );
}

function PageContent({
  page,
  hero,
  offer,
  formFields,
  version,
  utm,
}: {
  page: Record<string, unknown>;
  hero?: LandingSection;
  offer?: LandingSection;
  formFields: LandingFormField[];
  version: Record<string, unknown> | null;
  utm?: { source?: string; medium?: string; campaign?: string };
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {String(hero?.content?.headline ?? page.headline ?? "Welcome")}
        </h1>
        {hero?.content?.subheadline || page.subheadline ? (
          <p className="text-lg text-muted-foreground">
            {String(hero?.content?.subheadline ?? page.subheadline)}
          </p>
        ) : null}
        {page.location ? (
          <p className="text-sm text-muted-foreground">Serving {String(page.location)}</p>
        ) : null}
      </header>

      {offer ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-medium">{String(offer.content?.title ?? "Our Offer")}</h2>
          <p className="mt-2 text-muted-foreground">{String(offer.content?.body ?? page.offer ?? "")}</p>
        </section>
      ) : null}

      <section className="mt-10 rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-medium">Request a quote</h2>
        <LeadForm
          businessId={String(page.business_id)}
          landingPageId={String(page.id)}
          versionId={version?.id ? String(version.id) : undefined}
          campaignId={page.campaign_id ? String(page.campaign_id) : undefined}
          formFields={formFields}
          utm={utm}
        />
      </section>
    </div>
  );
}

function LeadForm({
  businessId,
  landingPageId,
  versionId,
  campaignId,
  formFields,
  utm,
}: {
  businessId: string;
  landingPageId: string;
  versionId?: string;
  campaignId?: string;
  formFields: LandingFormField[];
  utm?: { source?: string; medium?: string; campaign?: string };
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setDone("");

    const formData = new FormData(event.currentTarget);
    const customFields: Record<string, string> = {};
    const payload: Record<string, unknown> = {
      businessId,
      landingPageId,
      landingPageVersionId: versionId ?? null,
      campaignId: campaignId ?? null,
      source: "landing_page",
      utmSource: utm?.source ?? null,
      utmMedium: utm?.medium ?? null,
      utmCampaign: utm?.campaign ?? null,
      customFields,
    };

    for (const field of formFields) {
      const value = formData.get(field.key);
      const str = typeof value === "string" ? value.trim() : "";
      if (field.crmField === "name") payload.name = str;
      else if (field.crmField === "phone") payload.phone = str;
      else if (field.crmField === "email") payload.email = str;
      else if (field.crmField === "address") payload.address = str;
      else if (field.crmField === "roofing_need") payload.roofingNeed = str;
      else if (field.crmField === "timeline") payload.timeline = str;
      else if (field.crmField === "budget") payload.budget = str;
      else if (field.crmField === "notes") payload.notes = str;
      else customFields[field.key] = str;
    }

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!response.ok) {
      setDone("Something went wrong. Please try again.");
      return;
    }
    setDone("Thanks — we'll be in touch shortly.");
    event.currentTarget.reset();
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={onSubmit}>
      {formFields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          {field.type === "textarea" ? (
            <Textarea id={field.key} name={field.key} required={field.required} />
          ) : (
            <Input
              id={field.key}
              name={field.key}
              type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
              required={field.required}
            />
          )}
        </div>
      ))}
      <Button disabled={loading} type="submit" variant="gradient" className="w-full rounded-xl">
        {loading ? "Submitting…" : "Submit"}
      </Button>
      {done ? <p className="text-sm text-muted-foreground">{done}</p> : null}
    </form>
  );
}
