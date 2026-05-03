import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";

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
