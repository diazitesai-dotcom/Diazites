"use client";

import { useMemo, useState, useTransition } from "react";

import { updateLeadStatusAction } from "@/actions/leads.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PipelineStatus } from "@/types/domain";
import { bucketClasses, bucketLabel, type LeadScoreBucket } from "@/lib/lead-scoring";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  name: string;
  source: string;
  campaign: string;
  status: PipelineStatus;
  notes: string;
  score: number;
  scoreBucket: LeadScoreBucket;
};

const statuses: PipelineStatus[] = ["new", "contacted", "qualified", "booked", "won", "lost"];

function statusBadgeVariant(
  status: PipelineStatus,
): "secondary" | "info" | "success" | "warning" | "outline" {
  switch (status) {
    case "new":
      return "info";
    case "contacted":
      return "secondary";
    case "qualified":
      return "warning";
    case "booked":
    case "won":
      return "success";
    case "lost":
      return "outline";
    default:
      return "secondary";
  }
}

export function LeadsBoard({ leads }: { leads: Lead[] }) {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [pending, startTransition] = useTransition();

  function onStatusChange(leadId: string, status: PipelineStatus) {
    startTransition(async () => {
      await updateLeadStatusAction(leadId, status);
    });
  }

  const grouped = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        items: leads.filter((lead) => lead.status === status),
      })),
    [leads],
  );

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        {pending ? "Saving…" : "Table view supports quick stage updates."}
      </p>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border/60 bg-muted/20 p-1">
        <Button
          type="button"
          variant={view === "kanban" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-lg",
            view === "kanban" &&
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 text-white shadow-md hover:brightness-105",
          )}
          onClick={() => setView("kanban")}
        >
          Kanban
        </Button>
        <Button
          type="button"
          variant={view === "table" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-lg",
            view === "table" &&
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 text-white shadow-md hover:brightness-105",
          )}
          onClick={() => setView("table")}
        >
          Table
        </Button>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {grouped.map((column) => (
            <Card key={column.status} className="border-white/[0.06] bg-card/60">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center justify-between text-base capitalize">
                  {column.status}
                  <Badge variant="outline" className="tabular-nums">
                    {column.items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {column.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leads in this stage.</p>
                ) : (
                  column.items.map((lead) => (
                    <div
                      key={lead.id}
                      className="group rounded-xl border border-border/60 bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/25 hover:shadow-[0_12px_40px_-24px_rgba(99,102,241,0.35)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.campaign}</p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                            bucketClasses(lead.scoreBucket),
                          )}
                          title={`${bucketLabel(lead.scoreBucket)} · score ${lead.score}`}
                        >
                          {lead.score}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[11px]">
                          {lead.source}
                        </Badge>
                        <Badge
                          variant={statusBadgeVariant(lead.status)}
                          className="text-[11px] capitalize"
                        >
                          {lead.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {lead.notes}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/[0.06] overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[88px]">Score</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                <TableRow key={lead.id} className="border-border/60">
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                        bucketClasses(lead.scoreBucket),
                      )}
                      title={`${bucketLabel(lead.scoreBucket)} · score ${lead.score}`}
                    >
                      {lead.score}
                      <span className="text-[10px] font-normal opacity-70">
                        {bucketLabel(lead.scoreBucket)}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>{lead.campaign}</TableCell>
                  <TableCell>
                    <select
                      className="rounded-md border border-border/60 bg-background/80 px-2 py-1.5 text-xs capitalize outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                      value={lead.status}
                      disabled={pending}
                      onChange={(e) =>
                        onStatusChange(lead.id, e.target.value as PipelineStatus)
                      }
                      aria-label={`Status for ${lead.name}`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                      {lead.notes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
