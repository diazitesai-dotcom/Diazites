import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={action}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          {showPassword ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          ) : null}
          <Button type="submit" className="w-full">
            {submitText}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          {footerText}{" "}
          <Link className="underline" href={footerHref}>
            {footerCta}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
