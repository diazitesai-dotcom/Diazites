import { NextResponse } from "next/server";

import { getPublicAppUrl } from "@/lib/env";
import { extractBearerToken } from "@/lib/mcp/token";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateMcpRequest } from "@/services/mcp/mcp-connection.service";
import { handleMcpJsonRpc } from "@/services/mcp/mcp-server";

export const runtime = "nodejs";

/**
 * Diazites MCP HTTP endpoint for external agents (OpenClaw, Hermes, Cursor, etc.).
 * Authenticate with: Authorization: Bearer diaz_mcp_...
 */
export async function POST(request: Request) {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <diaz_mcp_ token>" },
      { status: 401 },
    );
  }

  const supabase = createServiceRoleClient();
  const auth = await authenticateMcpRequest(supabase, token);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, body: rpcBody } = await handleMcpJsonRpc(supabase, auth.data, body);

  if (rpcBody === null) {
    return new NextResponse(null, { status });
  }

  return NextResponse.json(rpcBody, { status });
}

export async function GET() {
  const baseUrl = getPublicAppUrl();
  return NextResponse.json({
    name: "diazites-mcp",
    version: "1.0.0",
    transport: "http",
    endpoint: `${baseUrl}/api/mcp`,
    auth: "Authorization: Bearer diaz_mcp_<token>",
    docsUrl: `${baseUrl}/docs/agents`,
    tokens: `${baseUrl}/dashboard/agents`,
  });
}
