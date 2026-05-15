"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveEngineRunInputAction } from "@/services/engine/run-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EngineRunSaveFormProps = {
  runId: string;
  input: Record<string, unknown>;
};

export function EngineRunSaveForm({ runId, input }: EngineRunSaveFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveEngineRunInputAction(runId, fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const fields = [
    { key: "websiteUrl", label: "Website URL" },
    { key: "niche", label: "Niche" },
    { key: "goal", label: "Goal" },
    { key: "targetAudience", label: "Target audience" },
    { key: "location", label: "Location" },
    { key: "trafficSource", label: "Traffic source" },
  ] as const;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/[0.06] p-4">
      <p className="text-sm font-medium">Save run inputs</p>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {fields.map((f) => (
        <div key={f.key} className="space-y-2">
          <Label htmlFor={`input_${f.key}`}>{f.label}</Label>
          <Input
            id={`input_${f.key}`}
            name={`input_${f.key}`}
            defaultValue={String(input[f.key] ?? "")}
          />
        </div>
      ))}
      <Button type="submit" variant="gradient" className="rounded-xl" disabled={pending}>
        {pending ? "Saving…" : "Save inputs"}
      </Button>
    </form>
  );
}
