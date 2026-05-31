import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { LEGAL_NAV_LINKS, LEGAL_LAST_UPDATED } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

const productLinks = [
  { href: "/#platform", label: "Platform" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/docs/agents", label: "Agent API" },
  { href: "/contact", label: "Contact" },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/20 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-semibold tracking-tight">Diazites</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The AI Growth Operating System for agencies and businesses — ads, CRM, agents,
            payments, and reporting in one command center.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Product
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {productLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Legal
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {LEGAL_NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Account
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "gradient", size: "sm" }))}
            >
              Get started
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-border/50 px-4 pt-8 sm:px-6">
        <p className="text-center text-xs text-muted-foreground">
          © {year} Diazites. All rights reserved. · Policies updated {LEGAL_LAST_UPDATED}
        </p>
      </div>
    </footer>
  );
}
