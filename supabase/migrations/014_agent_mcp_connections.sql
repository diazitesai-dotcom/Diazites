-- External AI agents (OpenClaw, Hermes, Cursor, etc.) connect via MCP using
-- per-business bearer tokens. Tokens are stored hashed; plain text shown once at creation.

create table if not exists agent_mcp_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  label text not null,
  client_type text not null check (
    client_type in ('openclaw', 'hermes', 'cursor', 'windsurf', 'claude', 'custom')
  ),
  token_hash text not null unique,
  token_prefix text not null,
  allowed_agent_types text[] not null default '{}',
  scopes text[] not null default array['agents:read', 'leads:read'],
  zernio_bridge_enabled boolean not null default false,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agent_mcp_connections_business_id_idx
  on agent_mcp_connections (business_id);

create index if not exists agent_mcp_connections_token_hash_idx
  on agent_mcp_connections (token_hash)
  where revoked_at is null;

alter table agent_mcp_connections enable row level security;

create policy "Owners manage MCP connections for their business"
  on agent_mcp_connections
  for all
  using (
    business_id in (
      select b.id from businesses b where b.user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select b.id from businesses b where b.user_id = auth.uid()
    )
  );
