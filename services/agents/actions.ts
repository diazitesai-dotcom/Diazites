"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AgentType } from "@/types/domain";

export async function activateAgentAction(formData: FormData) {
  const agentType = String(formData.get("agent_type") ?? "") as AgentType;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/onboarding?error=complete-business-profile-first");
  }

  await supabase.from("agents").upsert(
    {
      business_id: business.id,
      agent_type: agentType,
      status: "pending",
      activated_at: new Date().toISOString(),
    },
    {
      onConflict: "business_id,agent_type",
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agents");
  redirect("/dashboard/agents?success=activated");
}
