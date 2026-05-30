import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";
import { getAccountContext } from "@/lib/auth/account-context";

/** Avoid prerendering without Supabase env (e.g. Vercel build before env is applied). */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await getAccountContext();

  return (
    <AppSidebarShell
      variant="admin"
      brandHref="/admin"
      brandTitle="Admin"
      footerLink={{ href: "/dashboard", label: "Back to app" }}
      account={account}
    >
      {children}
    </AppSidebarShell>
  );
}
