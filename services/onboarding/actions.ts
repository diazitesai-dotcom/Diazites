"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { completeOnboardingProfile } from "@/services/onboarding/onboarding-completion.service";

export async function saveOnboardingAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const form = {
    businessName: String(formData.get("business_name") ?? ""),
    ownerName: String(formData.get("owner_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    website: String(formData.get("website") ?? ""),
    serviceArea: String(formData.get("service_area") ?? ""),
    cityState: String(formData.get("city_state") ?? ""),
    services: String(formData.get("services") ?? ""),
    businessHours: String(formData.get("business_hours") ?? ""),
    monthlyBudget: Number(formData.get("monthly_budget") ?? 0),
  };

  const result = await completeOnboardingProfile(supabase, user.id, form);

  if (!result.success) {
    redirect(`/onboarding?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard");
}
