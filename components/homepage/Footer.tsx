import Link from "next/link";

import { SITE_URL } from "@/lib/homepage-data";
import { LEGAL_NAV_LINKS } from "@/lib/legal/constants";

const footerLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Agents", href: "#agents" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
  { label: "Log in", href: "/login" },
];

const social = [
  { label: "LinkedIn", href: "https://linkedin.com/company/diazites" },
  { label: "X", href: "https://x.com/diazites" },
  { label: "YouTube", href: "https://youtube.com/@diazites" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-gradient-to-b from-muted/40 to-background py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-violet-500/25">
              D
            </span>
            Diazites
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            AI marketing automation for modern businesses—capture leads, automate
            follow-up, and grow pipeline without bolting together ten tools.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            <a
              href={SITE_URL}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {SITE_URL.replace(/^https:\/\//, "")}
            </a>
          </p>
        </div>

        <div className="flex flex-wrap gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Product
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerLinks.map((l) => (
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Social
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {social.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-6xl border-t border-border/50 px-4 pt-10 sm:px-6">
        <p className="text-center text-xs text-muted-foreground">
          © {year} Diazites AI Marketing Platform. All rights reserved.
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {LEGAL_NAV_LINKS.map((l, i) => (
            <span key={l.href}>
              {i > 0 ? " · " : null}
              <Link href={l.href} className="hover:text-foreground hover:underline">
                {l.label}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
