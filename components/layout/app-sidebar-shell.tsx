"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  FileText,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ShieldCheck,
  UserCircle2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  DASHBOARD_NAV_GROUPS,
  PRODUCT_TAGLINE,
  ROUTES,
  type DashboardNavItem,
} from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

import { NotificationBell } from "./notification-bell";

type NavItem = {
  href: string;
  label: string;
  icon: DashboardNavItem["icon"];
  description?: string;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Shield },
  { href: "/admin/agents", label: "Agents & MCP", icon: Bot },
  { href: "/admin/usage", label: "AI Usage", icon: Zap },
  { href: "/admin/audit", label: "Audit Log", icon: ShieldCheck },
  { href: "/admin/templates", label: "Templates", icon: FileText },
  { href: "/admin/onboarding", label: "Onboarding", icon: UserCircle2 },
];

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === ROUTES.missionControl) return pathname === ROUTES.missionControl;
  if (href === ROUTES.campaignOps) {
    return (
      pathname === ROUTES.campaignOps ||
      pathname.startsWith("/dashboard/ads") ||
      pathname.startsWith("/dashboard/campaigns")
    );
  }
  if (href === ROUTES.organization) {
    return (
      pathname === ROUTES.organization ||
      pathname.startsWith("/dashboard/team") ||
      pathname.startsWith("/dashboard/billing") ||
      pathname.startsWith("/dashboard/settings")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarShellProps = {
  children: React.ReactNode;
  variant: "dashboard" | "admin";
  brandHref: string;
  brandTitle: string;
  footerLink?: { href: string; label: string };
};

export function AppSidebarShell({
  children,
  variant,
  brandHref,
  brandTitle,
  footerLink,
}: AppSidebarShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const renderNavLink = (item: NavItem, iconOnly: boolean) => {
    const Icon = item.icon;
    const active = isNavItemActive(pathname, item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        title={iconOnly ? item.label : undefined}
        className={cn(
          "group relative flex rounded-xl transition-colors",
          iconOnly ? "justify-center px-2 py-2.5" : "gap-2.5 px-2.5 py-2",
          active
            ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/10 text-foreground shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]"
            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
        )}
      >
        {active ? (
          <span
            className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400"
            aria-hidden
          />
        ) : null}
        <Icon
          className={cn(
            "size-[18px] shrink-0",
            active ? "text-violet-300" : "text-muted-foreground group-hover:text-foreground",
          )}
          aria-hidden
        />
        {!iconOnly ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium leading-tight">{item.label}</span>
            {item.description ? (
              <span className="block truncate text-[10px] leading-tight text-muted-foreground/80 group-hover:text-muted-foreground">
                {item.description}
              </span>
            ) : null}
          </span>
        ) : null}
      </Link>
    );
  };

  const NavBody = ({ iconOnly }: { iconOnly: boolean }) => {
    if (variant === "admin") {
      return (
        <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
          {ADMIN_NAV.map((item) => renderNavLink(item, iconOnly))}
        </nav>
      );
    }

    return (
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3">
        {DASHBOARD_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {!iconOnly ? (
              <p className="mb-1.5 px-2.5 text-[9px] font-bold uppercase tracking-[0.22em] text-violet-400/70">
                {group.label}
              </p>
            ) : (
              <div className="mx-auto mb-1 h-px w-8 bg-white/10" aria-hidden />
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) =>
                renderNavLink(
                  {
                    href: item.href,
                    label: item.label,
                    icon: item.icon,
                    description: item.description,
                  },
                  iconOnly,
                ),
              )}
            </div>
          </div>
        ))}
      </nav>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "relative z-30 hidden shrink-0 border-r border-border/80 bg-sidebar/95 backdrop-blur-xl md:flex md:flex-col",
          collapsed ? "w-[76px]" : "w-[248px]",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border/60 px-3">
          <Link
            href={brandHref}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 transition-opacity hover:opacity-90",
              collapsed && "justify-center",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-xs font-bold text-white shadow-[0_0_24px_-8px_rgba(99,102,241,0.65)]">
              D
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-tight">{brandTitle}</span>
                <span className="block truncate text-[10px] font-medium text-violet-300/90">
                  {variant === "dashboard" ? "Growth OS" : "Admin"}
                </span>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        {!collapsed && variant === "dashboard" ? (
          <p className="border-b border-white/[0.06] px-4 py-2.5 text-[10px] leading-snug text-muted-foreground">
            {PRODUCT_TAGLINE}
          </p>
        ) : null}

        <NavBody iconOnly={collapsed} />

        {footerLink ? (
          <div className="border-t border-border/60 p-2">
            <Link
              href={footerLink.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {!collapsed ? footerLink.label : null}
            </Link>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl border border-border/60 text-foreground"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <Link href={brandHref} className="block truncate text-sm font-semibold tracking-tight">
                {brandTitle}
              </Link>
              {variant === "dashboard" ? (
                <p className="truncate text-[10px] text-violet-300/90">{PRODUCT_TAGLINE}</p>
              ) : null}
            </div>
          </div>
          <span className="hidden md:block" aria-hidden />
          <div className="flex items-center gap-2">
            {variant === "dashboard" ? <NotificationBell /> : null}
          </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,92vw)] flex-col border-r border-border/80 bg-sidebar shadow-2xl md:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
                <div>
                  <span className="text-sm font-semibold">{brandTitle}</span>
                  {variant === "dashboard" ? (
                    <p className="text-[10px] text-violet-300/90">{PRODUCT_TAGLINE}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex size-9 items-center justify-center rounded-lg border border-border/60"
                  aria-label="Close navigation"
                >
                  <X className="size-4" />
                </button>
              </div>
              <NavBody iconOnly={false} />
              {footerLink ? (
                <div className="border-t border-border/60 p-2">
                  <Link
                    href={footerLink.href}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                    {footerLink.label}
                  </Link>
                </div>
              ) : null}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
