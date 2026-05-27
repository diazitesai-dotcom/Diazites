-- Marketing OS landing editor extensions (safe to apply after 014).
-- Does NOT recreate ad_accounts — engine migration 009 owns that table.

do $$ begin
  create type landing_version_label as enum ('draft', 'published', 'a', 'b', 'c');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_operating_mode as enum ('manual', 'assisted', 'autonomous');
exception when duplicate_object then null;
end $$;

alter table businesses
  add column if not exists timezone text default 'America/New_York',
  add column if not exists currency text default 'USD',
  add column if not exists ai_mode ai_operating_mode default 'assisted',
  add column if not exists notification_config jsonb not null default '{
    "email": true, "sms": false, "slack": false, "webhook": false, "zapier": false
  }'::jsonb,
  add column if not exists workspace_settings jsonb not null default '{}'::jsonb;

alter table landing_pages
  add column if not exists subheadline text,
  add column if not exists cta_text text default 'Get Started',
  add column if not exists audience text,
  add column if not exists industry text,
  add column if not exists campaign_id uuid references campaigns(id) on delete set null,
  add column if not exists page_status text default 'draft'
    check (page_status in ('draft', 'published', 'archived')),
  add column if not exists active_version_id uuid;

alter table campaigns
  add column if not exists name text,
  add column if not exists landing_page_id uuid references landing_pages(id) on delete set null,
  add column if not exists lifecycle_status text default 'draft'
    check (lifecycle_status in (
      'draft', 'generating', 'pending_approval', 'live', 'paused', 'completed', 'ai_optimizing'
    )),
  add column if not exists roas numeric(8,2) default 0;

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

alter table leads
  add column if not exists landing_page_id uuid references landing_pages(id) on delete set null,
  add column if not exists landing_page_version_id uuid references landing_page_versions(id) on delete set null,
  add column if not exists budget text,
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists ai_score numeric(5,2),
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

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

create table if not exists agent_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_id uuid references agents(id) on delete cascade,
  permission_key text not null,
  granted boolean not null default false,
  requires_approval boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, agent_id, permission_key)
);

create index if not exists idx_agent_permissions_business on agent_permissions(business_id);

alter table landing_page_versions enable row level security;
alter table landing_page_assets enable row level security;
alter table landing_page_analytics enable row level security;
alter table lead_events enable row level security;
alter table agent_permissions enable row level security;

create or replace function public.user_owns_business(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from businesses b where b.id = p_business_id and b.user_id = auth.uid());
$$;

drop policy if exists "landing_page_versions owner access" on landing_page_versions;
create policy "landing_page_versions owner access" on landing_page_versions
for all using (user_owns_business(business_id)) with check (user_owns_business(business_id));

drop policy if exists "landing_page_assets owner access" on landing_page_assets;
create policy "landing_page_assets owner access" on landing_page_assets
for all using (user_owns_business(business_id)) with check (user_owns_business(business_id));

drop policy if exists "landing_page_analytics owner access" on landing_page_analytics;
create policy "landing_page_analytics owner access" on landing_page_analytics
for all using (user_owns_business(business_id)) with check (user_owns_business(business_id));

drop policy if exists "lead_events owner access" on lead_events;
create policy "lead_events owner access" on lead_events
for all using (user_owns_business(business_id)) with check (user_owns_business(business_id));

drop policy if exists "agent_permissions owner access" on agent_permissions;
create policy "agent_permissions owner access" on agent_permissions
for all using (user_owns_business(business_id)) with check (user_owns_business(business_id));
