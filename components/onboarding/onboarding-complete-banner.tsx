"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function OnboardingCompleteBanner() {
  const params = useSearchParams();
  if (params.get("onboarding") !== "complete") return null;

  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
      role="status"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
      <div>
        <p className="font-medium text-foreground">Business setup complete</p>
        <p className="text-muted-foreground">
          Mission Control is ready. Connect integrations and explore the tabs enabled for your
          account — your admin can unlock more services anytime.
        </p>
      </div>
    </div>
  );
}
