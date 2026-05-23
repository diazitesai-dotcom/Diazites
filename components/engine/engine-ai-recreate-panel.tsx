"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Mail, Megaphone, RefreshCw, Route, LayoutTemplate } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { recreateEngineAssetAction } from "@/services/engine/actions";

type EngineAiRecreatePanelProps = {
  runId: string;
  disabled?: boolean;
};

const RECREATE_OPTIONS = [
  {
    target: "landing_page",
    label: "Landing pages",
    description: "Regenerate A–D landing variants",
    icon: LayoutTemplate,
  },
  {
    target: "ad",
    label: "Ads",
    description: "Regenerate A–D ad copy sets",
    icon: Megaphone,
  },
  {
    target: "funnel",
    label: "Funnel",
    description: "Rebuild funnel blueprint + follow-ups",
    icon: Route,
  },
  {
    target: "email",
    label: "Emails",
    description: "Regenerate A–D email sequences",
    icon: Mail,
  },
  {
    target: "all_assets",
    label: "All creatives",
    description: "Landing, ads, email, headlines together",
    icon: RefreshCw,
  },
] as const;

export function EngineAiRecreatePanel({ runId, disabled }: EngineAiRecreatePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function recreate(target: string) {
    setMessage(null);
    setError(null);
    const formData = new FormData();
    formData.set("run_id", runId);
    formData.set("target", target);
    startTransition(async () => {
      const result = await recreateEngineAssetAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(result.data.message);
      router.refresh();
    });
  }

  return (
    <Card className="border-violet-500/25 bg-violet-500/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">AI recreate</CardTitle>
        <CardDescription>
          Not happy with an output? Regenerate landing pages, ads, funnel, or emails using your
          current research and strategy — without restarting the run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {RECREATE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <Button
                key={opt.target}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto flex-col items-start gap-1 rounded-xl py-3 text-left"
                disabled={disabled || pending}
                onClick={() => recreate(opt.target)}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="size-3.5 shrink-0 text-violet-300" aria-hidden />
                  {opt.label}
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {opt.description}
                </span>
              </Button>
            );
          })}
        </div>
        {pending ? (
          <p className="text-xs text-muted-foreground">AI is regenerating — this may take a minute…</p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
