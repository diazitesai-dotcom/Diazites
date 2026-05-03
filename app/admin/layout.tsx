import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";

/** Avoid prerendering without Supabase env (e.g. Vercel build before env is applied). */
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppSidebarShell
      variant="admin"
      brandHref="/admin"
      brandTitle="Admin"
      footerLink={{ href: "/dashboard", label: "Back to app" }}
    >
      {children}
    </AppSidebarShell>
  );
}
