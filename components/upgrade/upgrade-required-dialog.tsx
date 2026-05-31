"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/lib/navigation/platform-nav";
import type { UpgradePromptContext } from "@/types/entitlements";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: UpgradePromptContext | null;
};

export function UpgradeRequiredDialog({ open, onOpenChange, context }: Props) {
  if (!context) return null;

  const billingHref = `${ROUTES.organization}?tab=billing&upgrade=${context.requiredPlan}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/[0.08]">
        <DialogHeader>
          <DialogTitle>{context.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{context.message}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Link href={billingHref} onClick={() => onOpenChange(false)}>
            <Button className="w-full rounded-xl" variant="gradient">
              Upgrade to {context.requiredPlan === "pro" ? "Pro" : "Growth"}
            </Button>
          </Link>
          <Link href={`${ROUTES.organization}?tab=billing`} onClick={() => onOpenChange(false)}>
            <Button className="w-full rounded-xl" variant="outline">
              Compare plans
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
