"use client";

import { formatDistanceToNow } from "date-fns";
import { useState, useTransition } from "react";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";

import { decideApprovalAction } from "@/services/approvals/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ApprovalRow } from "@/repositories/cross-cutting.repository";

const SUBJECT_LABEL: Record<ApprovalRow["subject_kind"], string> = {
  engine_decision: "Engine decision",
  engine_launch: "Engine launch",
  ad_campaign: "Ad campaign",
  asset: "Asset",
};

export function ApprovalsList({ items }: { items: ApprovalRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<string, string>>({});

  function onDecide(id: string, decision: "approved" | "rejected") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("decision", decision);
    if (notes[id]) fd.set("note", notes[id]);
    startTransition(async () => {
      await decideApprovalAction(fd);
    });
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-white/[0.08]">
        <CardContent className="py-8 text-sm text-muted-foreground">
          Nothing waiting on you right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} className="border-amber-500/15 bg-amber-500/[0.04]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4 text-amber-300" aria-hidden />
                {SUBJECT_LABEL[item.subject_kind] ?? item.subject_kind}
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            </div>
            <CardDescription className="font-mono text-xs">
              {item.subject_id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.note ? (
              <p className="text-sm text-muted-foreground">{item.note}</p>
            ) : null}
            <Input
              placeholder="Optional note (visible in audit log)"
              value={notes[item.id] ?? ""}
              onChange={(e) =>
                setNotes((n) => ({ ...n, [item.id]: e.target.value }))
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => onDecide(item.id, "approved")}
                disabled={isPending}
              >
                <CheckCircle2 className="mr-1 size-3.5" aria-hidden /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecide(item.id, "rejected")}
                disabled={isPending}
              >
                <XCircle className="mr-1 size-3.5" aria-hidden /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
