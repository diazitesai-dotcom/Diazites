"use client";

import Link from "next/link";
import { useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Building2,
  FileText,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ShieldCheck,
  CreditCard,
  Settings,
  UserCircle2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { filterNavGroupsByPlan } from "@/lib/entitlements/nav-filter";
import {
  POST_LOGIN_SESSION_PARAM,
  POST_LOGIN_SESSION_VALUE,
} from "@/lib/auth/mission-control-routing";
import type { EntitlementPlanKey } from "@/types/entitlements";
import {
  GROWTH_SIDEBAR_GROUPS,
  PRODUCT_TAGLINE,
  ROUTES,
  type DashboardNavItem,
} from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";
import type { PlatformServiceKey } from "@/types/access-control";

import type { AccountContext } from "@/lib/auth/account-context";

import { AccountMenu } from "./account-menu";
import { NotificationBell } from "./notification-bell";

type NavItem = {
  href: string;
  label: string;
  icon: DashboardNavItem["icon"];
  description?: string;
};

/** Shown on Growth OS sidebar for Diazites platform operators. */
const PLATFORM_ADMIN_DASHBOARD_NAV: NavItem[] = [
  {
    href: "/admin/accounts",
    label: "Platform accounts",
    icon: Building2,
    description: "Agencies, sub-accounts & clients",
  },
  {
    href: "/admin/user-control",
    label: "User control",
    icon: UserCircle2,
    description: "Plans & service access",
  },
  {
    href: "/admin",
    label: "Admin overview",
    icon: Shield,
    description: "Owner dashboard & metrics",
  },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Shield },
  { href: "/admin/user-control", label: "User control", icon: UserCircle2 },
  { href: "/admin/accounts", label: "Platform accounts", icon: Building2 },
  { href: "/admin/users", label: "Admin user manager", icon: Users },
  { href: "/admin/agents", label: "Agents & MCP", icon: Bot },
  { href: "/admin/usage", label: "AI Usage", icon: Zap },
  { href: "/admin/audit", label: "Audit Log", icon: ShieldCheck },
  { href: "/admin/templates", label: "Templates", icon: FileText },
  { href: "/admin/promo-codes", label: "Promo codes", icon: Zap },
  { href: "/admin/merchant-services", label: "Merchant Services", icon: CreditCard },
  { href: "/admin/onboarding", label: "Onboarding", icon: UserCircle2 },
  { href: "/admin/setup", label: "Admin setup", icon: Settings },
];

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/setup") return pathname.startsWith("/admin/setup");
  if (href === "/admin/user-control") return pathname.startsWith("/admin/user-control");
  if (href === "/admin/accounts") return pathname.startsWith("/admin/accounts");
  if (href === "/admin/users") return pathname.startsWith("/admin/users");
  if (href === ROUTES.missionControl) return pathname === ROUTES.missionControl;
  if (href === ROUTES.campaignOps) {
    return (
      pathname === ROUTES.campaignOps ||
      pathname.startsWith("/dashboard/integrations")
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
  if (href === ROUTES.businessProfile) {
    return pathname === ROUTES.businessProfile || pathname.startsWith(`${ROUTES.businessProfile}/`);
  }
  if (href === ROUTES.onboarding) {
    return pathname === ROUTES.onboarding || pathname.startsWith(`${ROUTES.onboarding}/`);
  }
  if (href === ROUTES.tasks) return pathname.startsWith(ROUTES.tasks);
  if (href === ROUTES.calendar) {
    return pathname.startsWith(ROUTES.calendar) || pathname.startsWith("/dashboard/follow-up");
  }
  if (href === ROUTES.analytics || href === ROUTES.analyticsTraffic) {
    return pathname.startsWith(ROUTES.analytics);
  }
  if (href === ROUTES.automationPipelines) {
    return (
      pathname.startsWith(ROUTES.automationPipelines) ||
      pathname === ROUTES.automationCenter
    );
  }
  if (href === ROUTES.workflows) return pathname.startsWith(ROUTES.workflows);
  if (href === ROUTES.aiCallCommandCenter) return pathname.startsWith(ROUTES.aiCallCommandCenter);
  if (href === ROUTES.merchantServices) return pathname.startsWith(ROUTES.merchantServices);
  if (href === ROUTES.aiTextCommandCenter) return pathname.startsWith(ROUTES.aiTextCommandCenter);
  if (href === ROUTES.emailCampaignCenter) return pathname.startsWith(ROUTES.emailCampaignCenter);
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarShellProps = {
  children: React.ReactNode;
  variant: "dashboard" | "admin";
  brandHref: string;
  brandTitle: string;
  footerLink?: { href: string; label: string };
  account?: AccountContext | null;
  /** Serializable entitlements from server — icons stay client-side. */
  enabledServiceKeys?: PlatformServiceKey[];
  entitlementPlanKey?: EntitlementPlanKey;
  isOwnerAdmin?: boolean;
  /** Diazites owner — show agency / sub-account admin links on the dashboard sidebar. */
  showPlatformAdminNav?: boolean;
};

export function AppSidebarShell({
  children,
  variant,
  brandHref,
  brandTitle,
  footerLink,
  account,
  enabledServiceKeys,
  entitlementPlanKey = "starter",
  isOwnerAdmin = false,
  showPlatformAdminNav = false,
}: AppSidebarShellProps) {
  const growthNavGroups = useMemo(() => {
    if (isOwnerAdmin) return filterNavGroupsByPlan(GROWTH_SIDEBAR_GROUPS, [], true, "enterprise");
    if (enabledServiceKeys?.length) {
      return filterNavGroupsByPlan(
        GROWTH_SIDEBAR_GROUPS,
        enabledServiceKeys,
        false,
        entitlementPlanKey,
      );
    }
    return filterNavGroupsByPlan(GROWTH_SIDEBAR_GROUPS, [], false, entitlementPlanKey);
  }, [enabledServiceKeys, entitlementPlanKey, isOwnerAdmin]);

  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postLogin = params.get(POST_LOGIN_SESSION_PARAM) === POST_LOGIN_SESSION_VALUE;
    const onboardingComplete = params.get("onboarding") === "complete";
    if (postLogin || onboardingComplete) {
      window.setTimeout(() => setCollapsed(true), 0);
    }
    if (postLogin) {
      params.delete(POST_LOGIN_SESSION_PARAM);
      const qs = params.toString();
      const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }, []);

  const renderNavLink = (
    item: NavItem & { locked?: boolean; lockReason?: string },
    iconOnly: boolean,
    onNavigate?: () => void,
  ) => {
    const Icon = item.icon;
    const active = isNavItemActive(pathname, item.href);
    const locked = item.locked === true;

    return (
      <Link
        key={item.href}
        href={locked ? `${ROUTES.organization}?tab=billing` : item.href}
        title={iconOnly ? item.label : undefined}
        onClick={onNavigate}
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
            {locked && !iconOnly ? (
              <span className="mt-0.5 inline-flex rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-300">
                Upgrade
              </span>
            ) : null}
          </span>
        ) : null}
      </Link>
    );
  };

  const renderNavBody = (iconOnly: boolean, onNavigate?: () => void) => {
    if (variant === "admin") {
      return (
        <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
          {ADMIN_NAV.map((item) => renderNavLink(item, iconOnly, onNavigate))}
        </nav>
      );
    }

    return (
      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 py-3">
        {showPlatformAdminNav ? (
          <div className="pb-2">
            <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-400/80">
              Platform ops
            </p>
            <div className="flex flex-col gap-0.5">
              {PLATFORM_ADMIN_DASHBOARD_NAV.map((item) =>
                renderNavLink(item, iconOnly, onNavigate),
              )}
            </div>
            <div className="mx-2 mt-3 border-b border-amber-500/20" aria-hidden />
          </div>
        ) : null}
        {growthNavGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            className={cn(
              group.standalone && !iconOnly && groupIndex > 0 && "mt-1",
              group.standalone && !iconOnly && "pb-2",
            )}
          >
            {!iconOnly && !group.standalone ? (
              <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                {group.label}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <div key={`${group.id}-${item.href}-${item.label}`}>
                  {renderNavLink(
                    {
                      href: item.href,
                      label: item.label,
                      icon: item.icon,
                      description: iconOnly ? undefined : item.description,
                    },
                    iconOnly,
                    onNavigate,
                  )}
                </div>
              ))}
            </div>
            {group.standalone && !iconOnly ? (
              <div className="mx-2 mt-3 border-b border-white/[0.08]" aria-hidden />
            ) : null}
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

        {renderNavBody(collapsed)}

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
            {variant === "dashboard" ? (
              <NotificationBell />
            ) : null}
            {account ? <AccountMenu account={account} variant={variant} /> : null}
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
              {renderNavBody(false, () => setMobileOpen(false))}
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
