import { redirect } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Building2, DollarSign, Megaphone, Users } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) {
    redirect("/dashboard");
  }

  const metrics = [
    {
      label: "Total clients",
      value: "42",
      icon: Building2,
      hint: "+6 quarter to date",
      trend: "up" as const,
    },
    {
      label: "Leads",
      value: "1,248",
      icon: Users,
      hint: "Last 30 days",
      trend: "neutral" as const,
    },
    {
      label: "Campaigns",
      value: "157",
      icon: Megaphone,
      hint: "Across regions",
      trend: "neutral" as const,
    },
    {
      label: "Revenue",
      value: "$82,740",
      icon: DollarSign,
      hint: "Attributed MRR",
      trend: "up" as const,
    },
  ];

  const modules: [string, string][] = [
    ["Client Management", "#"],
    ["Agent Management", "#"],
    ["Campaigns", "#"],
    ["Leads", "#"],
    ["AI Automation", "#"],
    ["Billing", "#"],
    ["Templates", "/admin/templates"],
    ["Reports", "#"],
    ["Support", "#"],
    ["Roles", "#"],
    ["Alerts", "#"],
    ["Settings", "#"],
    ["Onboarding Tracker", "/admin/onboarding"],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <PageHeader
        eyebrow="Internal"
        title="Admin console"
        description="Operational oversight across tenants, automation health, and revenue signals."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Modules</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map(([name, href]) => (
            <Card key={name} className="border-white/[0.06] transition-transform hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle className="text-base">{name}</CardTitle>
                <CardDescription>
                  {href === "#" ? (
                    "Internal module scaffold ready."
                  ) : (
                    <Link className="font-medium text-violet-400 underline-offset-4 hover:underline" href={href}>
                      Open module
                    </Link>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
