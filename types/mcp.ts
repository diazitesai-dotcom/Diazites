import type { AgentType } from "@/types/domain";
import type { McpClientType, McpScope } from "@/utils/mcp-constants";

export type AgentMcpConnectionRow = {
  id: string;
  business_id: string;
  label: string;
  client_type: McpClientType;
  token_prefix: string;
  allowed_agent_types: AgentType[];
  scopes: McpScope[];
  zernio_bridge_enabled: boolean;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type AgentMcpConnectionPublic = Omit<AgentMcpConnectionRow, "token_hash">;

export type CreateMcpConnectionInput = {
  label: string;
  clientType: McpClientType;
  allowedAgentTypes: AgentType[];
  scopes: McpScope[];
  zernioBridgeEnabled: boolean;
};

export type McpAuthContext = {
  connectionId: string;
  businessId: string;
  allowedAgentTypes: AgentType[];
  scopes: McpScope[];
  zernioBridgeEnabled: boolean;
};
