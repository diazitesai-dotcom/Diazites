"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CAMPAIGN_GOALS } from "@/lib/platform/growth-spec";
import { saveOnboardingAction } from "@/services/onboarding/actions";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "business", title: "Business", description: "Company identity & contact" },
  { id: "market", title: "Market", description: "Services, audience & offer" },
  { id: "brand", title: "Brand & goals", description: "Tone, budget & campaign goal" },
  { id: "notify", title: "Notifications", description: "Lead alerts & review" },
] as const;

export function OnboardingWizard() {
  const [step, setStep] = useState(0);

  const canBack = step > 0;
  const isLast = step === STEPS.length - 1;

  return (
    <Card className="border-white/[0.06] shadow-[0_24px_80px_-48px_rgba(99,102,241,0.35)]">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                i === step
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-100"
                  : "border-white/[0.08] text-muted-foreground hover:border-white/15",
              )}
            >
              <span className="font-semibold">{s.title}</span>
            </button>
          ))}
        </div>
        <CardTitle className="text-lg pt-2">{STEPS[step].title}</CardTitle>
        <CardDescription>{STEPS[step].description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={saveOnboardingAction} className="space-y-6">
          {step === 0 ? <StepBusiness /> : null}
          {step === 1 ? <StepMarket /> : null}
          {step === 2 ? <StepBrand /> : null}
          {step === 3 ? <StepNotify /> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!canBack}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
            {isLast ? (
              <Button type="submit" variant="gradient" className="rounded-xl px-8">
                Launch command center
              </Button>
            ) : (
              <Button
                type="button"
                variant="gradient"
                className="rounded-xl px-8"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Continue
                <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  className,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} />
    </div>
  );
}

function StepBusiness() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Business name" name="business_name" required />
      <Field label="Owner name" name="owner_name" required />
      <Field label="Business email" name="business_email" type="email" />
      <Field label="Login email" name="email" type="email" required />
      <Field label="Phone number" name="phone" />
      <Field label="Website URL" name="website" />
      <Field label="Business address" name="business_address" className="md:col-span-2" />
      <Field label="Service areas" name="service_area" />
      <Field label="City / state" name="city_state" />
      <Field label="Business hours" name="business_hours" />
      <Field label="Industry" name="industry" />
      <Field label="Business type" name="business_type" />
    </div>
  );
}

function StepMarket() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="services">Main services</Label>
        <Textarea id="services" name="services" rows={3} placeholder="List primary services you sell" />
      </div>
      <Field label="Target audience" name="target_audience" className="md:col-span-2" />
      <Field label="Ideal customer" name="ideal_customer" className="md:col-span-2" />
      <Field label="Offer / promotion" name="offer_promotion" className="md:col-span-2" />
      <Field label="Existing website (if different)" name="existing_website" />
      <Field label="Existing CRM" name="existing_crm" />
    </div>
  );
}

function StepBrand() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Monthly ad budget ($)" name="monthly_budget" type="number" />
      <div className="space-y-2">
        <Label htmlFor="campaign_goal">Campaign goal</Label>
        <select
          id="campaign_goal"
          name="campaign_goal"
          className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
          defaultValue="generate_leads"
        >
          {CAMPAIGN_GOALS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <Field label="Brand tone" name="brand_tone" placeholder="Professional, friendly, bold…" />
      <Field label="Brand colors" name="brand_colors" placeholder="#0f172a, #8b5cf6" />
      <p className="md:col-span-2 text-xs text-muted-foreground">
        Logo upload connects after onboarding via Business Setup → Brand Settings (Supabase Storage).
      </p>
    </div>
  );
}

function StepNotify() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Lead notification email" name="lead_notify_email" type="email" />
      <Field label="Lead notification phone" name="lead_notify_phone" />
      <p className="md:col-span-2 text-sm text-muted-foreground">
        Next: connect ad accounts, activate AI agents, and approve your first campaigns from Mission
        Control. Agents will not spend budget or go live without your approval unless you enable Full
        Auto-Execute per agent.
      </p>
    </div>
  );
}
