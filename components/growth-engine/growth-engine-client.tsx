"use client";

import { useState, useTransition } from "react";

import { startGrowthEngineAction } from "@/actions/marketing-os.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STAGES = [
  "input",
  "ai_research",
  "campaign_creative",
  "funnel_blueprint",
  "ai_generation_suite",
  "variant_generation",
  "ai_scoring",
  "launch_system",
] as const;

type RunRow = {
  id: string;
  input_url: string | null;
  business_name: string | null;
  industry: string | null;
  status: string;
  current_stage: string;
  stage_progress: number;
  website_analysis: Record<string, unknown>;
  outcome_estimates: Record<string, unknown>;
  leads_generated: number | null;
  campaigns_launched: number | null;
  landing_pages_created: number | null;
  created_at: string;
};

export function GrowthEngineClient({ initialRuns }: { initialRuns: RunRow[] }) {
  const [url, setUrl] = useState("https://");
  const [runs, setRuns] = useState(initialRuns);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Start Growth Engine</CardTitle>
          <CardDescription>Enter a website URL to run the 8-stage AI marketing pipeline.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourbusiness.com" />
          </div>
          <Button
            className="mt-auto rounded-xl"
            variant="gradient"
            disabled={pending || !url.startsWith("http")}
            onClick={() => {
              startTransition(async () => {
                const result = await startGrowthEngineAction(url);
                setMessage(result.ok ? "Growth Engine run started." : result.error);
                if (result.ok) {
                  const { listGrowthEngineRunsAction } = await import("@/actions/marketing-os.actions");
                  const list = await listGrowthEngineRunsAction();
                  if (list.ok) setRuns(list.data as RunRow[]);
                }
              });
            }}
          >
            Run analysis
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {runs.map((run) => (
          <Card key={run.id} className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-base">{run.business_name ?? run.input_url ?? "Run"}</CardTitle>
              <CardDescription>
                {run.industry ?? "Industry pending"} · {run.status} · stage {run.current_stage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                  style={{ width: `${run.stage_progress}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {STAGES.map((stage) => (
                  <span
                    key={stage}
                    className={
                      run.current_stage === stage ? "rounded bg-violet-500/20 px-2 py-0.5 text-violet-200" : ""
                    }
                  >
                    {stage.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              {run.outcome_estimates ? (
                <p className="text-sm">
                  Est. reach {(run.outcome_estimates as { estimatedReach?: number }).estimatedReach ?? "—"} · leads{" "}
                  {(run.outcome_estimates as { estimatedLeads?: number }).estimatedLeads ?? "—"} · CPL $
                  {(run.outcome_estimates as { estimatedCpl?: number }).estimatedCpl ?? "—"}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
