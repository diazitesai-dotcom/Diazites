"use client";

import { Sidebar } from "@/components/ceo-command-center/sidebar";

type CeoCommandCenterShellProps = {
  children: React.ReactNode;
  healthScore?: number;
  healthChange?: number;
};

export function CeoCommandCenterShell({
  children,
  healthScore = 84,
  healthChange = 12,
}: CeoCommandCenterShellProps) {
  return (
    <div className="ceo-command-center flex min-h-screen bg-[#050810] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(139,92,246,0.06),transparent)]" />
      <Sidebar healthScore={healthScore} healthChange={healthChange} />
      <div className="relative flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
