"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "team", label: "Team", href: `${ROUTES.organization}?tab=team` },
  { id: "billing", label: "Billing", href: `${ROUTES.organization}?tab=billing` },
  { id: "settings", label: "Workspace", href: `${ROUTES.organization}?tab=settings` },
  { id: "security", label: "Security", href: `${ROUTES.organization}?tab=security` },
  { id: "api", label: "API access", href: `${ROUTES.organization}?tab=api` },
  { id: "audit", label: "Audit logs", href: `${ROUTES.organization}?tab=audit` },
] as const;

export type OrganizationTab = (typeof TABS)[number]["id"];

export function OrganizationShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const active = (searchParams.get("tab") as OrganizationTab | null) ?? "team";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.08] pb-3">
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                isActive
                  ? "bg-violet-500/25 text-violet-100"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <div key={`${pathname}-${active}`}>{children}</div>
    </div>
  );
}
