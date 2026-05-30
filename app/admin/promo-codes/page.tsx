import { redirect } from "next/navigation";

import { AdminPromoCodesClient } from "@/components/admin/admin-promo-codes-client";
import { PageHeader } from "@/components/layout/page-header";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPromoCodeRepository } from "@/repositories/promo-code.repository";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminUser) redirect("/dashboard");

  const repo = createPromoCodeRepository(supabase);
  const { data: codes } = await repo.listAll();

  const { data: redemptions } = await supabase
    .from("promo_code_redemptions")
    .select("promo_code_id, converted_at");

  const stats = (codes ?? []).map((c) => ({
    ...c,
    redemptions: (redemptions ?? []).filter((r) => r.promo_code_id === c.id).length,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Promo codes"
        description="Create, pause, and track trial extension codes."
      />
      <AdminPromoCodesClient codes={stats} />
    </div>
  );
}
