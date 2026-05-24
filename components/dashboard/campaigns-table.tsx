"use client";

import Link from "next/link";
import { Megaphone, Sparkles, Target, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Launch your first campaign from the Growth Engine, connect an ad platform, or import
            existing performance data.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/dashboard/engine"
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] p-4 transition-colors hover:bg-white/[0.03]"
            >
              <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Launch Growth Engine</p>
                <p className="text-xs text-muted-foreground">
                  8-stage AI research, creative, funnel, and launch.
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/ads"
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] p-4 transition-colors hover:bg-white/[0.03]"
            >
              <Target className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Connect Ads Platform</p>
                <p className="text-xs text-muted-foreground">
                  Meta, Google, TikTok, Microsoft, Zernio, or Zapier.
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/campaigns"
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] p-4 transition-colors hover:bg-white/[0.03]"
            >
              <Upload className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Import Campaign</p>
                <p className="text-xs text-muted-foreground">
                  Sync campaigns after connecting an ad account.
                </p>
              </div>
            </Link>
          </div>
          <Link
            href="/dashboard/funnel"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex rounded-xl")}
          >
            <Megaphone className="mr-2 h-4 w-4" />
            Build a funnel landing page
          </Link>
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
