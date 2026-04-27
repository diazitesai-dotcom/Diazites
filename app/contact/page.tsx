import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <main className="container py-16">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Book a Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Email us at hello@diazites.com to schedule your onboarding call.
          </p>
          <Link
            href="mailto:hello@diazites.com"
            className={buttonVariants({ variant: "default" })}
          >
            Email Diazites
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
