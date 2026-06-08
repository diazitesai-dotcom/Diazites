"use client";

import Link from "next/link";
import { Bell, ChevronDown, Crown, HelpCircle, LogOut, MessageCircle, Rocket } from "lucide-react";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/services/auth/actions";

type HeaderProps = {
  userName?: string;
  userInitials?: string;
  onLaunch?: () => void;
};

export function Header({ userName = "Tim", userInitials = "TM", onLaunch }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#070b14]/80 px-3 py-3 backdrop-blur-xl md:px-6 md:py-4">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-white md:text-xl">
          CEO Command Center <span aria-hidden>👋</span>
        </h1>
        <p className="mt-0.5 truncate text-xs text-slate-400 md:text-sm">
          Good morning, {userName}!
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          className="hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white sm:block"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white sm:block"
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

        <Link
          href="/dashboard/organization?tab=billing&upgrade=agents"
          className="hidden items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/15 lg:inline-flex"
        >
          <Crown className="h-4 w-4" />
          Upgrade
        </Link>

        <div className="ml-1 hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-semibold text-white">
            {userInitials}
          </div>
          <span className="hidden text-sm font-medium text-white sm:inline">{userName}</span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>

        <form action={signOutAction} className="hidden md:block">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>

        <button
          type="button"
          onClick={onLaunch}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-indigo-500 sm:px-4 sm:text-sm",
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
