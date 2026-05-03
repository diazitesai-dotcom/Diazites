"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CampaignRow } from "@/lib/dashboard/load-campaigns-page";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CampaignsTable({ campaigns }: { campaigns: CampaignRow[] }) {
  if (campaigns.length === 0) {
    return (
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg">No campaigns yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create a campaign from the API or admin tools to see performance here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-white/[0.06]">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-lg">Campaign performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead>Platform</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>CPL</TableHead>
              <TableHead>Conversion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="border-border/60">
                <TableCell className="font-medium">{campaign.platform}</TableCell>
                <TableCell>{fmtMoney(Number(campaign.budget ?? 0))}</TableCell>
                <TableCell>{campaign.goal ?? "—"}</TableCell>
                <TableCell>{campaign.location ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      campaign.status === "active"
                        ? "success"
                        : campaign.status === "draft"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {campaign.status ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell>{fmtMoney(Number(campaign.spend ?? 0))}</TableCell>
                <TableCell>{campaign.leads_count ?? 0}</TableCell>
                <TableCell>
                  {campaign.cpl != null ? fmtMoney(Number(campaign.cpl)) : "—"}
                </TableCell>
                <TableCell>
                  {campaign.conversion_rate != null
                    ? `${Number(campaign.conversion_rate).toFixed(0)}%`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
