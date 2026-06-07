"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  CreditCard,
  Crosshair,
  Globe,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/services/auth/actions";

const TOP_NAV_ITEMS = [
  { href: "/dashboard/analytics", label: "Overall Health", icon: Activity },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

type SidebarProps = {
  healthScore?: number;
  healthChange?: number;
};

export function Sidebar({ healthScore = 84 }: SidebarProps) {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(true);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);

  const renderNavItem = (
    item: (typeof TOP_NAV_ITEMS)[number] | (typeof BUSINESS_TOOL_ITEMS)[number] | (typeof BOTTOM_NAV_ITEMS)[number],
    options?: { showHealthScore?: boolean },
  ) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href + item.label}
        href={item.href}
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
        {options?.showHealthScore ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            {healthScore}
          </span>
        ) : null}
        {"badge" in item && item.badge ? (
          <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#070b14]/95 backdrop-blur-xl">
      <div className="border-b border-white/[0.06] px-5 py-6">
        <p className="text-lg font-bold tracking-[0.2em] text-white">DIAZITES</p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-violet-400/90">
          AI Business OS
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {renderNavItem(TOP_NAV_ITEMS[0], { showHealthScore: true })}
          {renderNavItem(TOP_NAV_ITEMS[1])}
        </div>

        <div className="my-4 border-t border-white/[0.06]" />

        <button
          type="button"
          onClick={() => setToolsOpen((open) => !open)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:bg-white/[0.03] hover:text-slate-300"
          aria-expanded={toolsOpen}
        >
          <span className="flex-1">My Business Tools</span>
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
  );
}
