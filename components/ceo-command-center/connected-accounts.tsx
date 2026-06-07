import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import { cn } from "@/lib/utils";
import type { ConnectedAccount } from "@/types/ceo-command-center";

type ConnectedAccountsProps = {
  accounts: ConnectedAccount[];
};

const statusStyles = {
  connected: {
    label: "Connected",
    className: "text-emerald-400",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    className: "text-amber-300",
    icon: Clock3,
  },
  disconnected: {
    label: "Disconnected",
    className: "text-slate-500",
    icon: AlertCircle,
  },
};

export function ConnectedAccounts({ accounts }: ConnectedAccountsProps) {
  return (
    <CardShell
      title="Connected Accounts"
      action={
        <Link
          href="/dashboard/campaign-ops"
          className="text-xs font-medium text-violet-300 hover:text-violet-200"
        >
          Manage
        </Link>
      }
    >
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-300">No connected accounts yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Connected ad, CRM, and communication tools will appear here.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {accounts.map((account) => {
          const status = statusStyles[account.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={account.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 text-xs font-bold text-violet-200">
                {account.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-medium text-slate-200">{account.name}</p>
              <span className={cn("inline-flex items-center gap-1 text-[10px]", status.className)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
      )}
    </CardShell>
  );
}
