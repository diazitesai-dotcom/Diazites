"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { tryBootstrapPlatformAdminRedirectAction } from "@/actions/bootstrap-admin.actions";
import { Button } from "@/components/ui/button";

export function AdminAccessDeniedBanner() {
  const params = useSearchParams();
  if (params.get("admin_access") !== "denied") return null;

  const bootstrapFailed = params.get("bootstrap") === "failed";

  return (
    <div
      className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      role="alert"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium text-foreground">Platform admin access required</p>
        <p className="text-muted-foreground">
          <Link href="/admin" className="text-violet-400 hover:underline">
            /admin
          </Link>{" "}
          is only for Diazites operators in{" "}
          <code className="rounded bg-white/5 px-1 text-xs">admin_users</code>. Your account is
          signed in as a workspace user, so you were redirected here.
        </p>
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Fix:</strong> In Supabase SQL Editor run{" "}
          <code className="rounded bg-white/5 px-1">
            insert into admin_users (user_id, role) select id, &apos;admin&apos; from users where
            email ilike &apos;YOUR_EMAIL&apos;;
          </code>
        </p>
        <p className="text-xs text-muted-foreground">
          Or set{" "}
          <code className="rounded bg-white/5 px-1">PLATFORM_BOOTSTRAP_ADMIN_EMAIL</code> in Vercel
          to your login email, redeploy, then click below or sign in again.
        </p>
        {bootstrapFailed ? (
          <p className="text-xs text-amber-300">
            Bootstrap did not grant access — check that your Vercel env email exactly matches your
            login email and that no other admin exists (unless bootstrap allow flag is set).
          </p>
        ) : null}
        <form action={tryBootstrapPlatformAdminRedirectAction}>
          <Button type="submit" size="sm" variant="outline" className="rounded-lg">
            Retry platform admin access
          </Button>
        </form>
      </div>
    </div>
  );
}
