import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthCardProps {
  title: string;
  submitText: string;
  action: (formData: FormData) => Promise<void>;
  footerHref: string;
  footerText: string;
  footerCta: string;
  showPassword?: boolean;
}

export function AuthCard({
  title,
  submitText,
  action,
  footerHref,
  footerText,
  footerCta,
  showPassword = true,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md border-white/[0.08] shadow-[0_24px_80px_-48px_rgba(99,102,241,0.45)]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        <CardDescription>Secure access to your Diazites workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={action}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          {showPassword ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
          ) : null}
          <Button type="submit" variant="gradient" className="mt-2 w-full rounded-xl">
            {submitText}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          {footerText}{" "}
          <Link className="font-medium text-violet-400 underline-offset-4 hover:underline" href={footerHref}>
            {footerCta}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
