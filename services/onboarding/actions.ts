"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveOnboardingAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const payload = {
    user_id: user.id,
    business_name: String(formData.get("business_name") ?? ""),
    owner_name: String(formData.get("owner_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    website: String(formData.get("website") ?? ""),
    service_area: String(formData.get("service_area") ?? ""),
    city_state: String(formData.get("city_state") ?? ""),
    services: String(formData.get("services") ?? ""),
    business_hours: String(formData.get("business_hours") ?? ""),
    monthly_budget: Number(formData.get("monthly_budget") ?? 0),
    status: "completed",
  };

  const { error } = await supabase.from("onboarding").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
