"use client";

import { useState, useTransition } from "react";

import { batchApproveAction, decideApprovalAction } from "@/actions/marketing-os.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ApprovalRow = {
  id: string;
  approval_type: string;
  title: string;
  description: string | null;
  status: string;
  risk_score: number;
  confidence_score: number | null;
  expected_impact: string | null;
  explanation: Record<string, unknown>;
  created_at: string;
};

export function ApprovalsClient({ initialApprovals }: { initialApprovals: ApprovalRow[] }) {
  const [approvals, setApprovals] = useState(initialApprovals.filter((a) => a.status === "pending"));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function reload() {
    startTransition(async () => {
      const { listApprovalsAction } = await import("@/actions/marketing-os.actions");
      const result = await listApprovalsAction(true);
      if (result.ok) setApprovals(result.data as ApprovalRow[]);
    });
  }

  return (
    <div className="space-y-4">
      {approvals.length === 0 ? (
        <Card className="border-white/[0.06]">
          <CardContent className="py-12 text-center text-muted-foreground">
            No pending approvals. AI and agent actions with medium/high risk will appear here.
          </CardContent>
        </Card>
      ) : (
        approvals.map((item) => (
          <Card key={item.id} className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>
                {item.approval_type.replace(/_/g, " ")} · risk {item.risk_score}
                {item.confidence_score != null ? ` · confidence ${item.confidence_score}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
              {item.expected_impact ? (
                <p className="text-sm">
                  Expected impact: <strong>{item.expected_impact}</strong>
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="gradient"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await decideApprovalAction(item.id, "approved");
                      setMessage(result.ok ? "Approved." : result.error);
                      reload();
                    });
                  }}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await decideApprovalAction(item.id, "rejected", "Rejected by operator");
                      setMessage(result.ok ? "Rejected." : result.error);
                      reload();
                    });
                  }}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      {approvals.length > 1 ? (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await batchApproveAction(approvals.map((a) => a.id));
              setMessage(result.ok ? `Batch approved ${result.data.approved}.` : result.error);
              reload();
            });
          }}
        >
          Batch approve all
        </Button>
      ) : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
