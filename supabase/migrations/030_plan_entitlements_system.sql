-- Plan-based feature entitlements per business workspace.
-- Apply after 029_starter_automation_entitlements.sql

-- ---------------------------------------------------------------------------
-- Catalog templates (plan → entitlement defaults)
-- ---------------------------------------------------------------------------

create table if not exists public.plan_entitlement_templates (
  plan_key text not null,
  entitlement_key text not null,
  value_int bigint,
  value_bool boolean,
  primary key (plan_key, entitlement_key)
);

create table if not exists public.account_entitlements (
  business_id uuid not null references public.businesses(id) on delete cascade,
  entitlement_key text not null,
  value_int bigint,
  value_bool boolean,
  plan_key text not null default 'starter',
  updated_at timestamptz not null default now(),
  primary key (business_id, entitlement_key)
);

create index if not exists idx_account_entitlements_business on public.account_entitlements(business_id);

create table if not exists public.feature_usage_counters (
  business_id uuid not null references public.businesses(id) on delete cascade,
  feature_key text not null,
  period_start date not null,
  quantity numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (business_id, feature_key, period_start)
);

alter table public.businesses
  add column if not exists entitlement_plan_key text default 'starter';

-- ---------------------------------------------------------------------------
-- Plans: trial + starter (align with billing)
-- ---------------------------------------------------------------------------

insert into public.platform_plans (key, label, description, sort_order) values
  ('trial', 'Trial', '14-day trial — Starter stack included.', 5),
  ('starter', 'Starter', 'Launch your first AI growth system.', 8)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- Starter service access (dashboard tabs)
insert into public.plan_service_entitlements (plan_key, service_key, enabled_by_default) values
  ('starter', 'basic_services', true),
  ('starter', 'mission_control', true),
  ('starter', 'email_campaigns', true),
  ('starter', 'ai_call', true),
  ('starter', 'agents', true),
  ('starter', 'ads_management', true),
  ('starter', 'workflow_reporting', true),
  ('trial', 'basic_services', true),
  ('trial', 'mission_control', true),
  ('trial', 'email_campaigns', true),
  ('trial', 'ai_call', true),
  ('trial', 'agents', true),
  ('trial', 'ads_management', true),
  ('trial', 'workflow_reporting', true)
on conflict (plan_key, service_key) do update set enabled_by_default = excluded.enabled_by_default;

-- ---------------------------------------------------------------------------
-- Seed entitlement templates (starter values from product spec)
-- ---------------------------------------------------------------------------

create or replace function public._seed_plan_entitlements(
  p_plan text,
  p_key text,
  p_int bigint default null,
  p_bool boolean default null
) returns void language plpgsql as $$
begin
  insert into public.plan_entitlement_templates (plan_key, entitlement_key, value_int, value_bool)
  values (p_plan, p_key, p_int, p_bool)
  on conflict (plan_key, entitlement_key) do update set
    value_int = excluded.value_int,
    value_bool = excluded.value_bool;
end;
$$;

-- Starter
select public._seed_plan_entitlements('starter', 'users', 1, null);
select public._seed_plan_entitlements('starter', 'workspaces', 1, null);
select public._seed_plan_entitlements('starter', 'crm_pipelines', 1, null);
select public._seed_plan_entitlements('starter', 'pipeline_stages', 5, null);
select public._seed_plan_entitlements('starter', 'workflows', 5, null);
select public._seed_plan_entitlements('starter', 'contacts', 500, null);
select public._seed_plan_entitlements('starter', 'landing_pages', 1, null);
select public._seed_plan_entitlements('starter', 'forms', 1, null);
select public._seed_plan_entitlements('starter', 'ad_accounts', 1, null);
select public._seed_plan_entitlements('starter', 'ad_platforms', 1, null);
select public._seed_plan_entitlements('starter', 'campaigns', 3, null);
select public._seed_plan_entitlements('starter', 'ad_spend_monitored', 5000, null);
select public._seed_plan_entitlements('starter', 'ads_agent_lite', null, true);
select public._seed_plan_entitlements('starter', 'ads_agent_full', null, false);
select public._seed_plan_entitlements('starter', 'lead_capture_agent_lite', null, true);
select public._seed_plan_entitlements('starter', 'crm_agent_lite', null, true);
select public._seed_plan_entitlements('starter', 'follow_up_agent_lite', null, true);
select public._seed_plan_entitlements('starter', 'ai_voice_lite', null, true);
select public._seed_plan_entitlements('starter', 'ai_voice_minutes', 100, null);
select public._seed_plan_entitlements('starter', 'outbound_ai_calls', 25, null);
select public._seed_plan_entitlements('starter', 'emails_monthly', 500, null);
select public._seed_plan_entitlements('starter', 'sms_monthly', 100, null);
select public._seed_plan_entitlements('starter', 'merchant_setup', null, true);
select public._seed_plan_entitlements('starter', 'merchant_automation', null, false);
select public._seed_plan_entitlements('starter', 'analytics_basic', null, true);
select public._seed_plan_entitlements('starter', 'analytics_advanced', null, false);
select public._seed_plan_entitlements('starter', 'settings_access', null, true);
select public._seed_plan_entitlements('starter', 'zapier_basic', null, true);
select public._seed_plan_entitlements('starter', 'zapier_advanced', null, false);
select public._seed_plan_entitlements('starter', 'external_api_access', null, false);
select public._seed_plan_entitlements('starter', 'mcp_connectors', null, false);
select public._seed_plan_entitlements('starter', 'subaccounts', 1, null);
select public._seed_plan_entitlements('starter', 'white_label', null, false);
select public._seed_plan_entitlements('starter', 'team_permissions', null, false);
select public._seed_plan_entitlements('starter', 'priority_support', null, false);

-- Trial mirrors starter
insert into public.plan_entitlement_templates (plan_key, entitlement_key, value_int, value_bool)
select 'trial', entitlement_key, value_int, value_bool
from public.plan_entitlement_templates
where plan_key = 'starter'
on conflict (plan_key, entitlement_key) do nothing;

-- Growth (subset — expand in app catalog for null = unlimited)
select public._seed_plan_entitlements('growth', 'users', 5, null);
select public._seed_plan_entitlements('growth', 'workflows', 25, null);
select public._seed_plan_entitlements('growth', 'contacts', 2500, null);
select public._seed_plan_entitlements('growth', 'landing_pages', 10, null);
select public._seed_plan_entitlements('growth', 'ad_accounts', 5, null);
select public._seed_plan_entitlements('growth', 'ad_platforms', 3, null);
select public._seed_plan_entitlements('growth', 'ads_agent_full', null, true);
select public._seed_plan_entitlements('growth', 'ai_voice_minutes', 500, null);
select public._seed_plan_entitlements('growth', 'outbound_ai_calls', 100, null);
select public._seed_plan_entitlements('growth', 'analytics_advanced', null, true);
select public._seed_plan_entitlements('growth', 'zapier_advanced', null, true);
select public._seed_plan_entitlements('growth', 'merchant_automation', null, true);

-- Pro / Enterprise flags
select public._seed_plan_entitlements('pro', 'users', 25, null);
select public._seed_plan_entitlements('pro', 'ads_agent_full', null, true);
select public._seed_plan_entitlements('pro', 'white_label', null, true);
select public._seed_plan_entitlements('pro', 'team_permissions', null, true);
select public._seed_plan_entitlements('pro', 'external_api_access', null, true);
select public._seed_plan_entitlements('pro', 'mcp_connectors', null, true);
select public._seed_plan_entitlements('pro', 'priority_support', null, true);

select public._seed_plan_entitlements('enterprise', 'users', null, null);
select public._seed_plan_entitlements('enterprise', 'external_api_access', null, true);
select public._seed_plan_entitlements('enterprise', 'mcp_connectors', null, true);
select public._seed_plan_entitlements('enterprise', 'priority_support', null, true);

-- Refresh account entitlements from plan template
create or replace function public.refresh_account_entitlements(
  p_business_id uuid,
  p_plan_key text default 'starter'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.businesses
  set entitlement_plan_key = p_plan_key
  where id = p_business_id;

  delete from public.account_entitlements where business_id = p_business_id;

  insert into public.account_entitlements (business_id, entitlement_key, value_int, value_bool, plan_key)
  select p_business_id, t.entitlement_key, t.value_int, t.value_bool, p_plan_key
  from public.plan_entitlement_templates t
  where t.plan_key = p_plan_key;

  -- Fill missing keys from starter baseline
  insert into public.account_entitlements (business_id, entitlement_key, value_int, value_bool, plan_key)
  select p_business_id, t.entitlement_key, t.value_int, t.value_bool, p_plan_key
  from public.plan_entitlement_templates t
  where t.plan_key = 'starter'
    and not exists (
      select 1 from public.account_entitlements ae
      where ae.business_id = p_business_id and ae.entitlement_key = t.entitlement_key
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.plan_entitlement_templates enable row level security;
alter table public.account_entitlements enable row level security;
alter table public.feature_usage_counters enable row level security;

create policy "plan_entitlement_templates_read_authenticated"
  on public.plan_entitlement_templates for select to authenticated using (true);

create policy "account_entitlements_owner"
  on public.account_entitlements for all to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );

create policy "feature_usage_counters_owner"
  on public.feature_usage_counters for all to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );

grant select on public.plan_entitlement_templates to authenticated;
grant select, insert, update, delete on public.account_entitlements to authenticated;
grant select, insert, update, delete on public.feature_usage_counters to authenticated;
grant execute on function public.refresh_account_entitlements(uuid, text) to authenticated, service_role;
