"use client";

import Link from "next/link";
import {
  Building2,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UserCircle2,
  Users,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AccountContext } from "@/lib/auth/account-context";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/services/auth/actions";

type AccountMenuProps = {
  account: AccountContext;
  variant: "dashboard" | "admin";
};

function getInitials(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
    }
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? "U";
  return local.slice(0, 2).toUpperCase();
}

function getDisplayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) return fullName.trim();
  const local = email.split("@")[0];
  return local ? local.replace(/[._-]/g, " ") : "Account";
}

export function AccountMenu({ account, variant }: AccountMenuProps) {
  const displayName = getDisplayName(account.fullName, account.email);
  const initials = getInitials(account.fullName, account.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex max-w-[min(220px,42vw)] items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-2 py-1.5 text-left transition-colors",
          "hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
        )}
        aria-label="Account menu"
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-xs font-bold text-white"
          aria-hidden
        >
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium leading-tight">{displayName}</span>
          <span className="block truncate text-[10px] text-muted-foreground">{account.email}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{displayName}</span>
            <span className="text-xs text-muted-foreground">{account.email}</span>
            {account.businessName && variant === "dashboard" ? (
              <span className="text-xs text-violet-300/90">{account.businessName}</span>
            ) : null}
            {variant === "admin" ? (
              <span className="text-xs text-violet-300/90">Platform admin</span>
            ) : null}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {variant === "dashboard" ? (
          <>
            <DropdownMenuItem render={<Link href={`${ROUTES.organization}?tab=settings`} />}>
              <Settings className="size-4" aria-hidden />
              Workspace settings
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`${ROUTES.organization}?tab=billing`} />}>
              <CreditCard className="size-4" aria-hidden />
              Team & billing
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`${ROUTES.organization}?tab=team`} />}>
              <Users className="size-4" aria-hidden />
              Manage team
            </DropdownMenuItem>
            {account.isPlatformAdmin ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/admin/accounts" />}>
                  <Building2 className="size-4" aria-hidden />
                  Platform accounts
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/admin/user-control" />}>
                  <UserCircle2 className="size-4" aria-hidden />
                  User control
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <Shield className="size-4" aria-hidden />
                  Admin overview
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/admin/users" />}>
                  <Users className="size-4" aria-hidden />
                  Admin user manager
                </DropdownMenuItem>
              </>
            ) : null}
          </>
        ) : (
          <>
            <DropdownMenuItem render={<Link href="/admin/users" />}>
              <Users className="size-4" aria-hidden />
              Admin user manager
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={ROUTES.missionControl} />}>
              <LayoutDashboard className="size-4" aria-hidden />
              Back to Growth OS
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <form action={signOutAction}>
          <DropdownMenuItem variant="destructive" render={<button type="submit" className="w-full" />}>
            <LogOut className="size-4" aria-hidden />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
