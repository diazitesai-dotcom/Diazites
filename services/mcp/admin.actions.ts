"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { adminRevokeMcpConnection } from "@/services/mcp/admin-mcp.service";

export async function adminRevokeMcpConnectionAction(connectionId: string) {
  await requireAdmin();
  const adminClient = createServiceRoleClient();
  const result = await adminRevokeMcpConnection(adminClient, connectionId);
  if (result.success) {
    revalidatePath("/admin/agents");
  }
  return result;
}
