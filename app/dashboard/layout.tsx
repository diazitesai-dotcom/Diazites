import { AppSidebarShell } from "@/components/layout/app-sidebar-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSidebarShell
      variant="dashboard"
      brandHref="/dashboard"
      brandTitle="Diazites"
      footerLink={{ href: "/", label: "Marketing site" }}
    >
      {children}
    </AppSidebarShell>
  );
}
