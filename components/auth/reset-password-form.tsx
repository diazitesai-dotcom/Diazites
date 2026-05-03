"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "@/services/auth/actions";

export function ResetPasswordForm() {
  return (
    <Card className="border-white/[0.08] shadow-[0_24px_80px_-48px_rgba(99,102,241,0.45)]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl tracking-tight">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updatePasswordAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" required autoComplete="new-password" />
          </div>
          <Button type="submit" variant="gradient" className="w-full rounded-xl">
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
