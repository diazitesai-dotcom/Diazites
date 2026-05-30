"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrialSnapshot } from "@/services/billing/trial.service";

export function TrialBanner({
  trial,
  shouldShowUpgrade,
}: {
  trial: TrialSnapshot | null;
  shouldShowUpgrade: boolean;
}) {
  if (!trial?.isTrialing) return null;

  const urgent = trial.daysRemaining <= 3;

  return (
    <div
      className={cn(
        "relative mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        urgent
          ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
          : "border-violet-500/30 bg-violet-500/10 text-violet-100",
      )}
    >
      <div>
        <p className="font-medium">
          {trial.daysRemaining} Day{trial.daysRemaining === 1 ? "" : "s"} Remaining In Trial
        </p>
        <p className="text-xs opacity-80">
          {trial.promoCode
            ? `Promo ${trial.promoCode} applied · full platform access during trial`
            : "14-day trial · CRM, workflows, AI agents, calling, and campaigns included"}
        </p>
      </div>
      {shouldShowUpgrade ? (
        <Link
          href="/dashboard/organization?tab=billing"
          className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
        >
          Upgrade now
        </Link>
      ) : null}
    </div>
  );
}

export function SoftPaywallNotice({ visible, message }: { visible: boolean; message: string }) {
  if (!visible) return null;
  return (
    <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      {message}
    </div>
  );
}
