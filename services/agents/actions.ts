"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AgentType } from "@/types/domain";

import { activateAgent } from "@/services/agents/agent.service";

export async function activateAgentAction(formData: FormData) {
  const agentType = String(formData.get("agent_type") ?? "") as AgentType;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const result = await activateAgent(supabase, user.id, agentType);

  if (!result.success) {
    redirect(`/dashboard/agents?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agents");
  redirect("/dashboard/agents?success=activated");
}
