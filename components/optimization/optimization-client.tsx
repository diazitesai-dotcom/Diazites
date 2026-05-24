"use client";

import { useTransition } from "react";

import { decideOptimizationAction } from "@/actions/marketing-os.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RecommendationRow = {
  id: string;
  recommendation_type: string;
  title: string;
  status: string;
  confidence_score: number;
  risk_score: number;
  expected_impact: string | null;
  explanation: Record<string, unknown>;
};

export function OptimizationClient({
  initialRecommendations,
  healthScore,
}: {
  initialRecommendations: RecommendationRow[];
  healthScore: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Campaign health score</CardTitle>
          <CardDescription>Composite score from CPL, ROAS, and live campaign coverage.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold">{healthScore}/100</p>
        </CardContent>
      </Card>

      {initialRecommendations.map((rec) => (
        <Card key={rec.id} className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">{rec.title}</CardTitle>
            <CardDescription>
              {rec.recommendation_type.replace(/_/g, " ")} · confidence {rec.confidence_score} · risk{" "}
              {rec.risk_score}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rec.expected_impact ? <p className="text-sm">{rec.expected_impact}</p> : null}
            <p className="text-sm text-muted-foreground">
              {String(rec.explanation?.reason ?? "AI recommendation based on performance patterns.")}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="gradient"
                disabled={pending || rec.status !== "pending"}
                onClick={() => {
                  startTransition(async () => {
                    await decideOptimizationAction(rec.id, "approved");
                    window.location.reload();
                  });
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || rec.status !== "pending"}
                onClick={() => {
                  startTransition(async () => {
                    await decideOptimizationAction(rec.id, "rejected");
                    window.location.reload();
                  });
                }}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await decideOptimizationAction(rec.id, "applied");
                    window.location.reload();
                  });
                }}
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
