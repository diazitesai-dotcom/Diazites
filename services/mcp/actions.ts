"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AgentType } from "@/types/domain";
import type { CreateMcpConnectionInput } from "@/types/mcp";
import {
  createMcpConnection,
  listMcpConnections,
  revokeMcpConnection,
  updateMcpConnectionAccess,
} from "@/services/mcp/mcp-connection.service";
import type { McpClientType, McpScope } from "@/utils/mcp-constants";

async function requireUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null as null };
  return { supabase, userId: user.id };
}

export async function listMcpConnectionsAction() {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { success: false as const, error: "Not authenticated" };
  return listMcpConnections(supabase, userId);
}

export async function createMcpConnectionAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { success: false as const, error: "Not authenticated" };

  const label = String(formData.get("label") ?? "").trim();
  const clientType = String(formData.get("client_type") ?? "custom") as McpClientType;
  const zernioBridge = formData.get("zernio_bridge") === "on";

  const allowedAgentTypes = formData
    .getAll("allowed_agent_types")
    .map((v) => String(v))
    .filter(Boolean) as AgentType[];

  const scopes = formData.getAll("scopes").map((v) => String(v)).filter(Boolean) as McpScope[];

  const input: CreateMcpConnectionInput = {
    label,
    clientType,
    allowedAgentTypes,
    scopes,
    zernioBridgeEnabled: zernioBridge,
  };

  const result = await createMcpConnection(supabase, userId, input);
  if (result.success) {
    revalidatePath("/dashboard/agents");
  }
  return result;
}

export async function revokeMcpConnectionAction(connectionId: string) {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { success: false as const, error: "Not authenticated" };

  const result = await revokeMcpConnection(supabase, userId, connectionId);
  if (result.success) revalidatePath("/dashboard/agents");
  return result;
}

export async function updateMcpConnectionAccessAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { success: false as const, error: "Not authenticated" };

  const connectionId = String(formData.get("connection_id") ?? "");
  const zernioBridge = formData.get("zernio_bridge") === "on";
  const allowedAgentTypes = formData
    .getAll("allowed_agent_types")
    .map((v) => String(v))
    .filter(Boolean) as AgentType[];
  const scopes = formData.getAll("scopes").map((v) => String(v)).filter(Boolean) as McpScope[];

  const result = await updateMcpConnectionAccess(supabase, userId, connectionId, {
    allowedAgentTypes,
    scopes,
    zernioBridgeEnabled: zernioBridge,
  });
  if (result.success) revalidatePath("/dashboard/agents");
  return result;
}
