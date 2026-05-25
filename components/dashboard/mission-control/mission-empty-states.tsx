"use client";

import Link from "next/link";
import { Megaphone, Rocket, Wallet } from "lucide-react";

import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ZeroCampaignsEmpty() {
  return (
    <GlassCard
      title="No live campaigns"
      description="Your acquisition engine is idle — launch to start generating demand."
      className="border-amber-500/15"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
            <Rocket className="size-5 text-amber-400" />
          </span>
          <p className="text-sm text-muted-foreground">
            Run the 8-stage Growth Engine to generate creative, funnel assets, and a launch plan in
            one flow.
          </p>
        </div>
        <Link
          href="/dashboard/engine"
          className={cn(buttonVariants({ variant: "gradient" }), "shrink-0 rounded-xl")}
        >
          Launch Growth Engine
        </Link>
      </div>
    </GlassCard>
  );
}

export function ZeroSpendEmpty() {
  return (
    <GlassCard
      title="No ad spend yet"
      description="Connect an ad platform to unlock spend tracking, CPL, and optimization."
      className="border-violet-500/15"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
            <Wallet className="size-5 text-violet-400" />
          </span>
          <p className="text-sm text-muted-foreground">
            Meta, Google, TikTok, and Microsoft connectors sync spend and performance automatically.
          </p>
        </div>
        <Link
          href="/dashboard/campaign-ops"
          className={cn(buttonVariants({ variant: "outline" }), "shrink-0 rounded-xl")}
        >
          Connect Ad Account
        </Link>
      </div>
    </GlassCard>
  );
}

export function CombinedAcquisitionEmpty() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ZeroCampaignsEmpty />
      <ZeroSpendEmpty />
    </div>
  );
}

export function FunnelEmptyHint() {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-muted-foreground">
      <Megaphone className="size-3.5 shrink-0 text-violet-400" />
      Publish a landing page to start tracking visitors → leads conversion.
      <Link href="/dashboard/funnel" className="ml-auto font-medium text-violet-300 hover:underline">
        Build page
      </Link>
    </div>
  );
}
