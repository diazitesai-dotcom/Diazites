"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startEngineRunAction } from "@/services/engine/actions";

type StartRunFormProps = {
  defaults?: {
    websiteUrl?: string | null;
    location?: string | null;
    niche?: string | null;
    budget?: number | null;
  };
};

export function StartRunForm({ defaults }: StartRunFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await startEngineRunAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="website_url"
          label="Website URL"
          placeholder="https://example.com"
          defaultValue={defaults?.websiteUrl ?? ""}
        />
        <Field
          name="niche"
          label="Niche / Industry"
          placeholder="Residential roofing"
          defaultValue={defaults?.niche ?? ""}
        />
        <Field
          name="goal"
          label="Goal / Offer"
          placeholder="Free roof inspection"
        />
        <Field
          name="target_audience"
          label="Target audience"
          placeholder="Homeowners, 35-65, FL"
        />
        <Field
          name="location"
          label="Location"
          placeholder="Tampa, FL"
          defaultValue={defaults?.location ?? ""}
        />
        <Field
          name="budget"
          label="Monthly budget (USD)"
          placeholder="2500"
          type="number"
          defaultValue={defaults?.budget ?? ""}
        />
      </div>
      <Field
        name="traffic_source"
        label="Primary traffic source"
        placeholder="Meta Ads, Google Ads, TikTok…"
      />

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <div>
        <Button type="submit" variant="gradient" size="lg" disabled={pending}>
          {pending ? "Starting run…" : "Start Growth Engine run"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string | number;
}) {
  const id = `engine-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
      />
    </div>
  );
}
