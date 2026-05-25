"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Rocket } from "lucide-react";

import { useGrowthEngineOs } from "@/components/engine/growth-engine-os/growth-engine-os-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startEngineRunAction } from "@/services/engine/actions";

export function BusinessIntakeForm() {
  const router = useRouter();
  const { intake, config } = useGrowthEngineOs();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("os_config", JSON.stringify(config));
    startTransition(async () => {
      const result = await startEngineRunAction(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/engine/${result.data.runId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="website_url"
          label="Website URL"
          defaultValue={intake.websiteUrl}
          placeholder="https://yourbusiness.com"
          required
        />
        <Field name="business_name" label="Business name" defaultValue={intake.businessName} />
        <Field name="niche" label="Industry / niche" defaultValue={intake.niche} />
        <Field name="location" label="Location" defaultValue={intake.location} />
        <Field name="budget" label="Monthly budget (USD)" type="number" defaultValue={intake.monthlyBudget ?? ""} />
        <Field name="goal" label="Goal / offer" defaultValue={intake.goal} />
        <Field name="target_audience" label="Target audience" defaultValue={intake.targetAudience} />
        <Field name="revenue_target" label="Revenue target" defaultValue={intake.revenueTarget} />
        <Field
          name="traffic_source"
          label="Preferred traffic sources"
          defaultValue={intake.trafficSources}
          placeholder="Meta Ads, Google Ads, Facebook Marketplace, Craigslist"
        />
        <Field name="crm_destination" label="CRM destination" defaultValue={intake.crmDestination} />
        <Field name="landing_style" label="Landing page style" defaultValue={intake.landingStyle} />
        <Field name="brand_tone" label="Brand tone" defaultValue={intake.brandTone} />
        <Field name="contact_info" label="Contact info" defaultValue={intake.contactInfo} />
      </div>
      <TextField name="competitors" label="Competitors" defaultValue={intake.competitors} />
      <TextField name="pain_points" label="Pain points" defaultValue={intake.painPoints} />
      <TextField name="usp" label="Unique selling proposition" defaultValue={intake.usp} />
      <TextField name="services_products" label="Services / products" defaultValue={intake.servicesProducts} />
      <TextField name="testimonials" label="Testimonials / proof" defaultValue={intake.testimonials} />
      <TextField name="compliance_restrictions" label="Compliance restrictions" defaultValue={intake.complianceRestrictions} />

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      ) : null}

      <Button type="submit" variant="gradient" size="lg" disabled={pending} className="rounded-xl">
        <Rocket className="mr-2 size-4" />
        {pending ? "Launching Growth Engine…" : "Launch Growth Engine run"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  const id = `ge-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const id = `ge-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={name} rows={2} defaultValue={defaultValue} className="resize-y min-h-[60px]" />
    </div>
  );
}
