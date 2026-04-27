import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Diazites AI Marketing Platform
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Get More Roofing Leads Automatically With AI
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Launch campaigns, automate follow-up, and book more roofing jobs
            from one platform built for contractors.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Start Free
            </Link>
            <Link
              href="/contact"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Book Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid gap-4 px-4 pb-12 md:grid-cols-3">
        {[
          "How It Works",
          "Problems We Solve",
          "AI Agents",
          "Lead Funnel Demo",
          "Pricing",
          "FAQ",
          "Contact",
        ].map((section) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle>{section}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Production section scaffold ready for expansion with conversion
                content and media assets.
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
