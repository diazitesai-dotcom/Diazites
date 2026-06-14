"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  CreditCard,
  Crosshair,
  Globe,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Rocket,
  Settings,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/services/auth/actions";

const TOP_NAV_ITEMS = [
  { href: "/dashboard?section=home", label: "Home", icon: Home },
  { href: "/dashboard/launch-review", label: "Launch Review", icon: Rocket },
  { href: "/dashboard", label: "Full Dashboard", icon: LayoutDashboard },
] as const;

const BUSINESS_TOOL_ITEMS = [
  { href: "/dashboard/analytics", label: "Revenue Center", icon: TrendingUp },
  { href: "/dashboard/leads", label: "Leads & CRM", icon: Users },
  { href: "/dashboard/calendar", label: "Calendars", icon: Calendar },
  { href: "/dashboard/inbox", label: "Conversations", icon: MessageSquare, badge: 12 },
  { href: "/dashboard/automations/pipelines", label: "Pipelines", icon: Target },
  { href: "/dashboard/agents", label: "AI Employees", icon: Bot },
  { href: "/dashboard/campaign-ops", label: "Marketing", icon: Zap },
  { href: "/dashboard/funnel", label: "Websites & Funnels", icon: Globe },
  { href: "/dashboard/reports", label: "Reputation", icon: Star },
  { href: "/dashboard/reports", label: "Reporting", icon: BarChart3 },
  { href: "/dashboard/analytics", label: "Competitors", icon: Crosshair },
  { href: "/dashboard/ai-text", label: "AI Content Factory", icon: Sparkles },
  { href: "/dashboard/merchant-services", label: "Payments", icon: CreditCard },
] as const;

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

type NavItem =
  | (typeof TOP_NAV_ITEMS)[number]
  | (typeof BUSINESS_TOOL_ITEMS)[number]
  | (typeof BOTTOM_NAV_ITEMS)[number];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    const [routePath = href, rawSearch = ""] = href.split("?");
    const routeParams = new URLSearchParams(rawSearch);
    const routeSection = routeParams.get("section");
    const currentSection = searchParams.get("section");

    if (routePath === "/dashboard") {
      return pathname === "/dashboard" && currentSection === routeSection;
    }

    return pathname === routePath || pathname.startsWith(`${routePath}/`);
  };

  const renderNavItem = (item: NavItem, onNavigate?: () => void) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
          active
            ? "bg-gradient-to-r from-violet-600/25 to-indigo-600/15 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]"
            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-violet-300" : "text-slate-500 group-hover:text-slate-300",
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {"badge" in item && item.badge ? (
          <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#070b14]/95 px-4 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="text-center" onClick={() => setMobileOpen(false)}>
          <p className="text-base font-bold tracking-[0.2em] text-white">DIAZITES</p>
          <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-violet-400/90">
            AI Business OS
          </p>
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative flex h-full w-[min(320px,86vw)] flex-col border-r border-white/[0.08] bg-[#070b14] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
              <div>
                <p className="text-lg font-bold tracking-[0.2em] text-white">DIAZITES</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-violet-400/90">
                  AI Business OS
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-0.5">
                {TOP_NAV_ITEMS.map((item) => renderNavItem(item, () => setMobileOpen(false)))}
              </div>
              <div className="my-4 border-t border-white/[0.06]" />
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                My Business Agent Tools
              </p>
              <div className="space-y-0.5">
                {BUSINESS_TOOL_ITEMS.map((item) =>
                  renderNavItem(item, () => setMobileOpen(false)),
                )}
              </div>
            </nav>

            <div className="border-t border-white/[0.06] px-3 py-4">
              <div className="space-y-0.5">
                {BOTTOM_NAV_ITEMS.map((item) => renderNavItem(item, () => setMobileOpen(false)))}
              </div>
              <form action={signOutAction} className="mt-2">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
                >
                  <LogOut className="h-4 w-4 text-slate-500" />
                  <span className="flex-1 text-left">Sign Out</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 gap-1 rounded-2xl border border-white/[0.08] bg-[#070b14]/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
        {[
          TOP_NAV_ITEMS[0],
          TOP_NAV_ITEMS[1],
          TOP_NAV_ITEMS[2],
          BOTTOM_NAV_ITEMS[0],
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={`mobile-${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition",
                active
                  ? "bg-violet-600/25 text-white"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-violet-300" : "text-slate-500")} />
              <span className="max-w-full truncate">{item.label.replace("Full ", "")}</span>
            </Link>
          );
        })}
      </nav>

      <aside className="hidden h-full w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#070b14]/95 backdrop-blur-xl md:flex">
        <div className="border-b border-white/[0.06] px-5 py-6">
          <p className="text-lg font-bold tracking-[0.2em] text-white">DIAZITES</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-violet-400/90">
            AI Business OS
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {TOP_NAV_ITEMS.map((item) => renderNavItem(item))}
          </div>

          <div className="my-4 border-t border-white/[0.06]" />

          <button
            type="button"
            onClick={() => setToolsOpen((open) => !open)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:bg-white/[0.03] hover:text-slate-300"
            aria-expanded={toolsOpen}
          >
            <span className="flex-1">My Business Agent Tools</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", !toolsOpen && "-rotate-90")}
            />
          </button>

          {toolsOpen ? (
            <div className="mt-1 space-y-0.5">
              {BUSINESS_TOOL_ITEMS.map((item) => renderNavItem(item))}
            </div>
          ) : null}
        </nav>

        <div className="border-t border-white/[0.06] px-3 py-4">
          <div className="space-y-0.5">{BOTTOM_NAV_ITEMS.map((item) => renderNavItem(item))}</div>

          <form action={signOutAction} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Sign Out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
