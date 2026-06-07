"use client";

import { Bell, ChevronDown, HelpCircle, MessageCircle, Rocket } from "lucide-react";

import { cn } from "@/lib/utils";

type HeaderProps = {
  userName?: string;
  userInitials?: string;
  onLaunch?: () => void;
};

export function Header({ userName = "Tim", userInitials = "TM", onLaunch }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[#070b14]/80 px-6 py-4 backdrop-blur-xl">
      <div>
        <h1 className="text-xl font-semibold text-white">
          CEO Command Center <span aria-hidden>👋</span>
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">Good morning, {userName}!</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Messages"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white sm:block"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <div className="ml-1 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-semibold text-white">
            {userInitials}
          </div>
          <span className="hidden text-sm font-medium text-white sm:inline">{userName}</span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>

        <button
          type="button"
          onClick={onLaunch}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-indigo-500",
          )}
        >
          <Rocket className="h-4 w-4" />
          <span className="hidden sm:inline">Launch My System</span>
          <span className="sm:hidden">Launch</span>
        </button>
      </div>
    </header>
  );
}
