"use client";

import { useState } from "react";
import { KeyRound, Plug } from "lucide-react";

import { cn } from "@/lib/utils";

export function OnboardingZernioConnectCard({
  apiKey,
  onApiKeyChange,
  verified,
  accountCount,
  error,
}: {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  verified: boolean;
  accountCount?: number;
  error?: string | null;
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4 md:col-span-2">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-cyan-500/15 p-2">
          <Plug className="h-4 w-4 text-cyan-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-medium text-white">Zernio API (optional)</p>
            <p className="mt-1 text-xs text-slate-400">
              Connect Zernio now so <strong className="text-slate-300">Launch My System</strong> can
              reach Meta, Google, TikTok, and 14+ ad platforms through one key. Skip if you&apos;ll
              connect later in Campaign Ops.
            </p>
          </div>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-xs text-slate-400">
              <KeyRound className="h-3 w-3" />
              Zernio API key
            </span>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Paste your Zernio API key"
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            {showKey ? "Hide key" : "Show key"}
          </button>
          {verified ? (
            <p className="text-xs text-emerald-300">
              Key saved — will connect {accountCount ?? 0} app(s) when you launch.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-xs text-rose-300">
              {error}
            </p>
          ) : null}
          <p
            className={cn(
              "text-[10px]",
              apiKey.trim() ? "text-cyan-200/70" : "text-slate-500",
            )}
          >
            {apiKey.trim()
              ? "We verify and store this when you launch — not before business setup completes."
              : "Optional — leave blank to connect Zernio from Integrations later."}
          </p>
        </div>
      </div>
    </div>
  );
}
