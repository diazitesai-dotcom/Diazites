import Link from "next/link";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNavbar />
      <main className="relative flex-1 px-4 py-20 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(139,92,246,0.15),transparent)]" />
        <Card className="relative mx-auto max-w-xl border-white/[0.08] shadow-[0_24px_80px_-48px_rgba(99,102,241,0.45)]">
          <CardHeader>
            <CardTitle className="text-2xl">Book a demo</CardTitle>
            <CardDescription className="text-base">
              Email us to schedule your onboarding call with the Diazites team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              hello@diazites.com · Enterprise SLAs available.
            </p>
            <Link
              href="mailto:hello@diazites.com"
              className={buttonVariants({ variant: "gradient", size: "lg", className: "rounded-xl" })}
            >
              Email Diazites
            </Link>
          </CardContent>
        </Card>
      </main>
      <MarketingFooter />
    </div>
  );
}
