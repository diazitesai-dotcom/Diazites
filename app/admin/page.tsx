import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  return (
    <main className="container space-y-8 py-10">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Clients", "42"],
          ["Leads", "1,248"],
          ["Campaigns", "157"],
          ["Revenue", "$82,740"],
        ].map(([name, value]) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
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
        ].map(([name, href]) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle>{name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {href === "#" ? (
                "Internal module scaffold ready."
              ) : (
                <Link className="underline" href={href}>
                  Open module
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
