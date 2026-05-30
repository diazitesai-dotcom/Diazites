import Link from "next/link";

import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { LEGAL_LAST_UPDATED, LEGAL_NAV_LINKS } from "@/lib/legal/constants";
import type { LegalDocument } from "@/lib/legal/types";

export function LegalPageShell({ document }: { document: LegalDocument }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNavbar />
      <main className="flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-16 h-64 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(139,92,246,0.12),transparent)]" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/90">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {document.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{document.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>

          <nav
            aria-label="Legal documents"
            className="mt-8 flex flex-wrap gap-2 border-b border-border/60 pb-8"
          >
            {LEGAL_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/30 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-10">
            <LegalDocumentView document={document} />
          </div>

          <p className="mt-12 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100/90">
            This page is provided for transparency and does not constitute legal advice. For
            questions about your specific situation, consult qualified counsel.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
