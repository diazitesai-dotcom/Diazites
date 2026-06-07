"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Calendar,
  CreditCard,
  Crown,
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
  Crosshair,
} from "lucide-react";

import { CircularProgress } from "@/components/ceo-command-center/shared/circular-progress";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/services/auth/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
  {
    href: "/dashboard/organization?tab=billing&upgrade=agents",
    label: "Upgrade Plan",
    icon: Crown,
  },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  healthScore?: number;
  healthChange?: number;
};

export function Sidebar({ healthScore = 84, healthChange = 12 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#070b14]/95 backdrop-blur-xl">
      <div className="border-b border-white/[0.06] px-5 py-6">
        <p className="text-lg font-bold tracking-[0.2em] text-white">DIAZITES</p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-violet-400/90">
          AI Business OS
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
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
              {"badge" in item && item.badge ? (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-violet-600/10 p-4">
        <p className="text-xs font-semibold text-amber-100">Unlock more agents</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">
          Upgrade to add more AI employees, campaigns, automations, and feature tabs.
        </p>
        <Link
          href="/dashboard/organization?tab=billing&upgrade=agents"
          className="mt-3 block w-full rounded-lg bg-amber-400/15 py-2 text-center text-xs font-semibold text-amber-100 transition hover:bg-amber-400/25"
        >
          View upgrade options
        </Link>
      </div>

      <div className="mx-3 mb-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/40 to-indigo-950/30 p-4">
        <p className="text-xs font-medium text-slate-400">Business Health Score</p>
        <div className="mt-3 flex items-center gap-3">
          <CircularProgress
            value={healthScore}
            size={56}
            strokeWidth={5}
            label={`${healthScore}`}
            sublabel="/100"
            gradientId="sidebar-health-gradient"
          />
          <div>
            <p className="text-lg font-bold text-emerald-400">+{healthChange}%</p>
            <p className="text-[10px] text-slate-500">vs last month</p>
          </div>
        </div>
        <Link
          href="/dashboard/analytics"
          className="mt-3 block w-full rounded-lg bg-violet-600/20 py-2 text-center text-xs font-medium text-violet-200 transition hover:bg-violet-600/30"
        >
          View Full Report
        </Link>
      </div>

      <form action={signOutAction} className="mx-3 mb-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out of session
        </button>
      </form>
    </aside>
  );
}
