-- AI Marketing Operating System foundation
-- Workspaces, landing page editor, ad accounts, approvals, optimization, audit

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type ai_operating_mode as enum ('manual', 'assisted', 'autonomous');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type workspace_role as enum (
    'owner', 'admin', 'marketer', 'sales_rep', 'viewer', 'agency_partner'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ad_platform as enum (
    'meta', 'google', 'tiktok', 'microsoft', 'zernio', 'zapier', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type connection_status as enum (
    'connected', 'not_connected', 'token_expired', 'needs_permissions', 'sync_failed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type landing_version_label as enum (
    'draft', 'published', 'a', 'b', 'c'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type approval_type as enum (
    'campaign_launch', 'budget_change', 'ai_creative', 'agent_action',
    'crm_mass_action', 'automation_change', 'optimization_action'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type approval_status as enum (
    'pending', 'approved', 'rejected', 'modified', 'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type campaign_lifecycle as enum (
    'draft', 'generating', 'pending_approval', 'live', 'paused', 'completed', 'ai_optimizing'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type optimization_type as enum (
    'budget_shift', 'creative_fatigue', 'audience_expansion',
    'cpl_spike', 'roas_drop', 'landing_page', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type recommendation_status as enum (
    'pending', 'approved', 'rejected', 'applied', 'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type growth_engine_stage as enum (
    'input', 'ai_research', 'campaign_creative', 'funnel_blueprint',
    'ai_generation_suite', 'variant_generation', 'ai_scoring', 'launch_system'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Workspace extensions on businesses
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists timezone text default 'America/New_York',
  add column if not exists currency text default 'USD',
  add column if not exists ai_mode ai_operating_mode default 'assisted',
  add column if not exists notification_config jsonb not null default '{
    "email": true, "sms": false, "slack": false, "webhook": false, "zapier": false
  }'::jsonb,
  add column if not exists workspace_settings jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Team / workspace members
-- ---------------------------------------------------------------------------

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  email text,
  role workspace_role not null default 'viewer',
  module_permissions jsonb not null default '{}'::jsonb,
  approval_authority jsonb not null default '{"max_budget_change": 0, "can_approve_creative": false}'::jsonb,
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique(business_id, user_id),
  unique(business_id, email)
);

create index if not exists idx_workspace_members_business on workspace_members(business_id);

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user', 'ai', 'agent', 'system')),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_business on audit_logs(business_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Ad accounts (encrypted credentials server-side)
-- ---------------------------------------------------------------------------

create table if not exists ad_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform ad_platform not null,
  account_name text,
  external_account_id text,
  connection_status connection_status not null default 'not_connected',
  credentials_encrypted text,
  credentials_hint text,
  metadata jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  campaign_count int default 0,
  total_spend numeric(12,2) default 0,
  total_leads int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, platform, external_account_id)
);

create index if not exists idx_ad_accounts_business on ad_accounts(business_id);

-- ---------------------------------------------------------------------------
-- Agent permissions (scoped to business + optional agent)
-- ---------------------------------------------------------------------------

create table if not exists agent_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_id uuid references agents(id) on delete cascade,
  ad_account_id uuid references ad_accounts(id) on delete cascade,
  permission_key text not null,
  granted boolean not null default false,
  requires_approval boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, agent_id, ad_account_id, permission_key)
);

create index if not exists idx_agent_permissions_business on agent_permissions(business_id);

-- ---------------------------------------------------------------------------
-- Landing page extensions
-- ---------------------------------------------------------------------------

alter table landing_pages
  add column if not exists subheadline text,
  add column if not exists cta_text text default 'Get Started',
  add column if not exists audience text,
  add column if not exists industry text,
  add column if not exists campaign_id uuid references campaigns(id) on delete set null,
  add column if not exists status text default 'draft' check (status in ('draft', 'published', 'archived')),
  add column if not exists active_version_id uuid;

create table if not exists landing_page_versions (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references landing_pages(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  version_label landing_version_label not null default 'draft',
  name text not null default 'Draft',
  sections jsonb not null default '[]'::jsonb,
  form_fields jsonb not null default '[]'::jsonb,
  traffic_weight int not null default 0 check (traffic_weight >= 0 and traffic_weight <= 100),
  is_winner boolean not null default false,
  ai_scores jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_landing_page_versions_page on landing_page_versions(landing_page_id);

create table if not exists landing_page_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  landing_page_id uuid references landing_pages(id) on delete cascade,
  asset_type text not null check (asset_type in ('image', 'video', 'logo', 'background')),
  file_url text not null,
  file_name text,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_landing_page_assets_business on landing_page_assets(business_id);

create table if not exists landing_page_analytics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  landing_page_id uuid not null references landing_pages(id) on delete cascade,
  version_id uuid references landing_page_versions(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  analytics_date date not null default current_date,
  visitors int not null default 0,
  submissions int not null default 0,
  conversion_rate numeric(6,4) default 0,
  source text,
  utm_campaign text,
  utm_source text,
  utm_medium text,
  created_at timestamptz not null default now(),
  unique(landing_page_id, version_id, analytics_date, coalesce(source, ''), coalesce(utm_campaign, ''))
);

create index if not exists idx_landing_page_analytics_page on landing_page_analytics(landing_page_id, analytics_date desc);

-- ---------------------------------------------------------------------------
-- Campaign extensions
-- ---------------------------------------------------------------------------

alter table campaigns
  add column if not exists name text,
  add column if not exists ad_account_id uuid references ad_accounts(id) on delete set null,
  add column if not exists landing_page_id uuid references landing_pages(id) on delete set null,
  add column if not exists lifecycle_status campaign_lifecycle default 'draft',
  add column if not exists roas numeric(8,2) default 0;

-- ---------------------------------------------------------------------------
-- Lead extensions + timeline
-- ---------------------------------------------------------------------------

alter table leads
  add column if not exists landing_page_id uuid references landing_pages(id) on delete set null,
  add column if not exists landing_page_version_id uuid references landing_page_versions(id) on delete set null,
  add column if not exists budget text,
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists ai_score numeric(5,2),
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system' check (actor_type in ('user', 'ai', 'agent', 'system')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_events_lead on lead_events(lead_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Approvals
-- ---------------------------------------------------------------------------

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  approval_type approval_type not null,
  status approval_status not null default 'pending',
  title text not null,
  description text,
  entity_type text,
  entity_id uuid,
  risk_score numeric(5,2) not null default 50,
  confidence_score numeric(5,2),
  expected_impact text,
  explanation jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  requested_by_type text not null default 'ai' check (requested_by_type in ('user', 'ai', 'agent')),
  requested_by_id uuid,
  decided_by uuid references users(id) on delete set null,
  decision_note text,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_approval_requests_business on approval_requests(business_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Optimization recommendations
-- ---------------------------------------------------------------------------

create table if not exists optimization_recommendations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  landing_page_id uuid references landing_pages(id) on delete set null,
  recommendation_type optimization_type not null,
  status recommendation_status not null default 'pending',
  title text not null,
  confidence_score numeric(5,2) not null default 70,
  risk_score numeric(5,2) not null default 30,
  expected_impact text,
  explanation jsonb not null default '{}'::jsonb,
  suggested_action jsonb not null default '{}'::jsonb,
  applied_at timestamptz,
  impact_actual jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_optimization_recs_business on optimization_recommendations(business_id, status);

-- ---------------------------------------------------------------------------
-- Growth engine runs
-- ---------------------------------------------------------------------------

create table if not exists growth_engine_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  input_url text,
  business_name text,
  industry text,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'failed', 'paused')),
  current_stage growth_engine_stage not null default 'input',
  stage_progress int not null default 0 check (stage_progress >= 0 and stage_progress <= 100),
  website_analysis jsonb not null default '{}'::jsonb,
  outcome_estimates jsonb not null default '{}'::jsonb,
  leads_generated int default 0,
  campaigns_launched int default 0,
  landing_pages_created int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_growth_engine_runs_business on growth_engine_runs(business_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Automation workflow extensions
-- ---------------------------------------------------------------------------

alter table automation_rules
  drop constraint if exists automation_rules_action_type_check;

alter table automation_rules
  add constraint automation_rules_action_type_check
  check (action_type in ('webhook', 'sms', 'email', 'slack', 'crm_task', 'ai_qualification'));

alter table automation_rules
  add column if not exists conditions jsonb not null default '[]'::jsonb,
  add column if not exists actions jsonb not null default '[]'::jsonb,
  add column if not exists is_template boolean not null default false;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

alter table workspace_members enable row level security;
alter table audit_logs enable row level security;
alter table ad_accounts enable row level security;
alter table agent_permissions enable row level security;
alter table landing_page_versions enable row level security;
alter table landing_page_assets enable row level security;
alter table landing_page_analytics enable row level security;
alter table lead_events enable row level security;
alter table approval_requests enable row level security;
alter table optimization_recommendations enable row level security;
alter table growth_engine_runs enable row level security;

-- Helper: business owner access
create or replace function public.user_owns_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from businesses b
    where b.id = p_business_id and b.user_id = auth.uid()
  );
$$;

-- workspace_members
create policy "workspace_members owner access" on workspace_members
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- audit_logs
create policy "audit_logs owner select" on audit_logs
for select using (user_owns_business(business_id));

create policy "audit_logs owner insert" on audit_logs
for insert with check (user_owns_business(business_id));

-- ad_accounts
create policy "ad_accounts owner access" on ad_accounts
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- agent_permissions
create policy "agent_permissions owner access" on agent_permissions
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- landing_page_versions
create policy "landing_page_versions owner access" on landing_page_versions
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

create policy "landing_page_versions public read published" on landing_page_versions
for select using (
  exists (
    select 1 from landing_pages lp
    where lp.id = landing_page_versions.landing_page_id and lp.published = true
  )
);

-- landing_page_assets
create policy "landing_page_assets owner access" on landing_page_assets
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- landing_page_analytics
create policy "landing_page_analytics owner access" on landing_page_analytics
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- lead_events
create policy "lead_events owner access" on lead_events
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- approval_requests
create policy "approval_requests owner access" on approval_requests
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- optimization_recommendations
create policy "optimization_recommendations owner access" on optimization_recommendations
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- growth_engine_runs
create policy "growth_engine_runs owner access" on growth_engine_runs
for all using (user_owns_business(business_id))
with check (user_owns_business(business_id));

-- Public landing page analytics insert (via service role only in practice)
-- Service role bypasses RLS for public submission tracking
