"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PipelineStatus } from "@/types/domain";

type Lead = {
  id: string;
  name: string;
  source: string;
  campaign: string;
  status: PipelineStatus;
  notes: string;
};

const statuses: PipelineStatus[] = ["new", "contacted", "qualified", "booked", "won", "lost"];

export function LeadsBoard({ leads }: { leads: Lead[] }) {
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const grouped = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        items: leads.filter((lead) => lead.status === status),
      })),
    [leads],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          className={`rounded-md px-3 py-1 text-sm ${view === "kanban" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setView("kanban")}
          type="button"
        >
          Kanban
        </button>
        <button
          className={`rounded-md px-3 py-1 text-sm ${view === "table" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setView("table")}
          type="button"
        >
          Table
        </button>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {grouped.map((column) => (
            <Card key={column.status}>
              <CardHeader>
                <CardTitle className="capitalize">{column.status}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {column.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leads yet.</p>
                ) : (
                  column.items.map((lead) => (
                    <div key={lead.id} className="rounded-md border p-3">
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.campaign}</p>
                      <Badge className="mt-2" variant="outline">
                        {lead.source}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell>{lead.campaign}</TableCell>
                    <TableCell className="capitalize">{lead.status}</TableCell>
                    <TableCell>{lead.notes}</TableCell>
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
