"use client";

import { Sidebar } from "@/components/ceo-command-center/sidebar";

type CeoCommandCenterShellProps = {
  children: React.ReactNode;
};

export function CeoCommandCenterShell({ children }: CeoCommandCenterShellProps) {
  return (
    <div className="ceo-command-center flex min-h-screen bg-[#050810] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(139,92,246,0.06),transparent)]" />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
