import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import type { ConnectedAccount } from "@/types/ceo-command-center";

type ConnectedAccountsProps = {
  accounts: ConnectedAccount[];
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 text-xs font-bold text-violet-200">
              {account.name.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-xs font-medium text-slate-200">{account.name}</p>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
