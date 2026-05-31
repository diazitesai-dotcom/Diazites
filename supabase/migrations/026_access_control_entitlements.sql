-- SaaS access control: plans, services, per-user entitlements, admin audit.
-- Apply after 025_pipeline_stage_automations.sql

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table if not exists public.platform_plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_services (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_service_entitlements (
  plan_key text not null references public.platform_plans(key) on delete cascade,
  service_key text not null references public.platform_services(key) on delete cascade,
  enabled_by_default boolean not null default true,
  primary key (plan_key, service_key)
);

-- ---------------------------------------------------------------------------
-- Per-user plan + platform role (distinct from profiles.role business owner)
-- ---------------------------------------------------------------------------

create table if not exists public.user_platform_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_key text not null references public.platform_plans(key) default 'free',
  account_role text not null default 'user'
    check (account_role in ('user', 'owner_admin')),
  status text not null default 'active'
    check (status in ('active', 'pending', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_platform_accounts_plan on public.user_platform_accounts(plan_key, status);

create table if not exists public.user_service_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_key text not null references public.platform_services(key) on delete cascade,
  enabled boolean not null default false,
  enabled_by_admin_id uuid references auth.users(id) on delete set null,
  enabled_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, service_key)
);

create index if not exists idx_user_service_access_user on public.user_service_access(user_id, enabled);

create table if not exists public.access_control_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null
    check (action_type in ('plan_changed', 'service_enabled', 'service_disabled', 'account_suspended', 'account_activated')),
  service_key text,
  plan_key text,
  previous_value jsonb,
  new_value jsonb,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_access_audit_target on public.access_control_audit_logs(target_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Seed catalog
-- ---------------------------------------------------------------------------

insert into public.platform_plans (key, label, description, sort_order) values
  ('free', 'Free / Basic', 'Default plan for new signups — core services only.', 0),
  ('growth', 'Growth', 'Expanded marketing automation for scaling teams.', 10),
  ('pro', 'Pro', 'Full growth stack with premium channels.', 20),
  ('enterprise', 'Enterprise', 'All services — used for Diazites owner/admin accounts.', 30)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.platform_services (key, label, description, sort_order) values
  ('basic_services', 'Basic Services', 'Business profile, onboarding, leads, and core ops.', 0),
  ('mission_control', 'Mission Control', 'Growth command center dashboard home.', 10),
  ('email_campaigns', 'Email Campaigns', 'Email audiences, templates, and sends.', 20),
  ('ai_call', 'AI Call', 'Outbound AI calling and call campaigns.', 30),
  ('agents', 'Agent', 'AI agent workspace and deployments.', 40),
  ('ads_management', 'Ads Management', 'Paid media, campaign ops, and growth engine.', 50),
  ('workflow_reporting', 'Workflow Reporting', 'Workflows, automations reporting, and intelligence reports.', 60)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- Free plan: only default free services enabled for new users
insert into public.plan_service_entitlements (plan_key, service_key, enabled_by_default) values
  ('free', 'basic_services', true),
  ('free', 'mission_control', true),
  ('free', 'email_campaigns', false),
  ('free', 'ai_call', false),
  ('free', 'agents', false),
  ('free', 'ads_management', false),
  ('free', 'workflow_reporting', false)
on conflict (plan_key, service_key) do update set enabled_by_default = excluded.enabled_by_default;

insert into public.plan_service_entitlements (plan_key, service_key, enabled_by_default) values
  ('growth', 'basic_services', true),
  ('growth', 'mission_control', true),
  ('growth', 'email_campaigns', true),
  ('growth', 'agents', true),
  ('growth', 'ai_call', false),
  ('growth', 'ads_management', false),
  ('growth', 'workflow_reporting', false)
on conflict (plan_key, service_key) do update set enabled_by_default = excluded.enabled_by_default;

insert into public.plan_service_entitlements (plan_key, service_key, enabled_by_default) values
  ('pro', 'basic_services', true),
  ('pro', 'mission_control', true),
  ('pro', 'email_campaigns', true),
  ('pro', 'ai_call', true),
  ('pro', 'agents', true),
  ('pro', 'ads_management', true),
  ('pro', 'workflow_reporting', false);

-- Enterprise / owner: all services
insert into public.plan_service_entitlements (plan_key, service_key, enabled_by_default)
select 'enterprise', s.key, true
from public.platform_services s
on conflict (plan_key, service_key) do update set enabled_by_default = true;

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_is_owner_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_platform_accounts upa
    where upa.user_id = auth.uid()
      and upa.account_role = 'owner_admin'
  );
$$;

create or replace function public.user_platform_is_active(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_platform_accounts upa
    where upa.user_id = p_user_id
      and upa.status = 'active'
  );
$$;

create or replace function public.user_has_service(p_service_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.user_is_owner_admin() then true
    when not public.user_platform_is_active(auth.uid()) then false
    else exists (
      select 1
      from public.user_service_access usa
      where usa.user_id = auth.uid()
        and usa.service_key = p_service_key
        and usa.enabled = true
    )
  end;
$$;

-- ---------------------------------------------------------------------------
-- Provisioning (security definer — only callable from triggers / service role)
-- ---------------------------------------------------------------------------

create or replace function public.provision_user_access(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_plan_key text;
  v_role text;
begin
  if p_user_id is null then
    return;
  end if;

  v_is_admin := exists (
    select 1 from public.admin_users a where a.user_id = p_user_id
  );

  v_plan_key := case when v_is_admin then 'enterprise' else 'free' end;
  v_role := case when v_is_admin then 'owner_admin' else 'user' end;

  insert into public.user_platform_accounts (user_id, plan_key, account_role, status)
  values (p_user_id, v_plan_key, v_role, 'active')
  on conflict (user_id) do update set
    plan_key = case
      when excluded.account_role = 'owner_admin' then excluded.plan_key
      else public.user_platform_accounts.plan_key
    end,
    account_role = case
      when v_is_admin then 'owner_admin'
      else public.user_platform_accounts.account_role
    end,
    updated_at = now();

  if v_is_admin then
    insert into public.user_service_access (user_id, service_key, enabled, enabled_at)
    select p_user_id, s.key, true, now()
    from public.platform_services s
    where s.is_active = true
    on conflict (user_id, service_key) do update set
      enabled = true,
      enabled_at = coalesce(public.user_service_access.enabled_at, now()),
      disabled_at = null,
      updated_at = now();
  else
    insert into public.user_service_access (user_id, service_key, enabled, enabled_at, disabled_at)
    select
      p_user_id,
      pse.service_key,
      pse.enabled_by_default,
      case when pse.enabled_by_default then now() else null end,
      case when pse.enabled_by_default then null else now() end
    from public.plan_service_entitlements pse
    where pse.plan_key = v_plan_key
    on conflict (user_id, service_key) do nothing;
  end if;
end;
$$;

create or replace function public.apply_plan_defaults_to_user(
  p_user_id uuid,
  p_plan_key text,
  p_actor_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_platform_accounts
  set plan_key = p_plan_key, updated_at = now()
  where user_id = p_user_id;

  insert into public.user_service_access (user_id, service_key, enabled, enabled_at, disabled_at, enabled_by_admin_id)
  select
    p_user_id,
    pse.service_key,
    pse.enabled_by_default,
    case when pse.enabled_by_default then now() else null end,
    case when pse.enabled_by_default then null else now() end,
    p_actor_id
  from public.plan_service_entitlements pse
  where pse.plan_key = p_plan_key
  on conflict (user_id, service_key) do update set
    enabled = excluded.enabled,
    enabled_at = case when excluded.enabled then coalesce(public.user_service_access.enabled_at, now()) else null end,
    disabled_at = case when excluded.enabled then null else coalesce(public.user_service_access.disabled_at, now()) end,
    enabled_by_admin_id = coalesce(excluded.enabled_by_admin_id, public.user_service_access.enabled_by_admin_id),
    updated_at = now();
end;
$$;

-- Extend auth signup hook
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;

  perform public.provision_user_access(new.id);

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin RPCs (mutations only via security definer)
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_user_service(
  p_target_user_id uuid,
  p_service_key text,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev boolean;
begin
  if not public.user_is_owner_admin() then
    raise exception 'Forbidden: owner_admin required';
  end if;

  if not exists (select 1 from public.platform_services where key = p_service_key and is_active) then
    raise exception 'Unknown service: %', p_service_key;
  end if;

  select usa.enabled into v_prev
  from public.user_service_access usa
  where usa.user_id = p_target_user_id and usa.service_key = p_service_key;

  insert into public.user_service_access (
    user_id, service_key, enabled, enabled_by_admin_id, enabled_at, disabled_at
  )
  values (
    p_target_user_id,
    p_service_key,
    p_enabled,
    auth.uid(),
    case when p_enabled then now() else null end,
    case when p_enabled then null else now() end
  )
  on conflict (user_id, service_key) do update set
    enabled = excluded.enabled,
    enabled_by_admin_id = excluded.enabled_by_admin_id,
    enabled_at = case when excluded.enabled then now() else public.user_service_access.enabled_at end,
    disabled_at = case when excluded.enabled then null else now() end,
    updated_at = now();

  insert into public.access_control_audit_logs (
    actor_user_id, target_user_id, action_type, service_key, previous_value, new_value
  )
  values (
    auth.uid(),
    p_target_user_id,
    case when p_enabled then 'service_enabled' else 'service_disabled' end,
    p_service_key,
    jsonb_build_object('enabled', v_prev),
    jsonb_build_object('enabled', p_enabled)
  );
end;
$$;

create or replace function public.admin_update_user_plan(
  p_target_user_id uuid,
  p_plan_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev text;
begin
  if not public.user_is_owner_admin() then
    raise exception 'Forbidden: owner_admin required';
  end if;

  if not exists (select 1 from public.platform_plans where key = p_plan_key and is_active) then
    raise exception 'Unknown plan: %', p_plan_key;
  end if;

  select plan_key into v_prev
  from public.user_platform_accounts
  where user_id = p_target_user_id;

  perform public.apply_plan_defaults_to_user(p_target_user_id, p_plan_key, auth.uid());

  insert into public.access_control_audit_logs (
    actor_user_id, target_user_id, action_type, plan_key, previous_value, new_value
  )
  values (
    auth.uid(),
    p_target_user_id,
    'plan_changed',
    p_plan_key,
    jsonb_build_object('plan_key', v_prev),
    jsonb_build_object('plan_key', p_plan_key)
  );
end;
$$;

revoke all on function public.admin_set_user_service(uuid, text, boolean) from public;
revoke all on function public.admin_update_user_plan(uuid, text) from public;
grant execute on function public.admin_set_user_service(uuid, text, boolean) to authenticated;
grant execute on function public.admin_update_user_plan(uuid, text) to authenticated;

revoke all on function public.provision_user_access(uuid) from public;
revoke all on function public.apply_plan_defaults_to_user(uuid, text, uuid) from public;
grant execute on function public.provision_user_access(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.platform_plans enable row level security;
alter table public.platform_services enable row level security;
alter table public.plan_service_entitlements enable row level security;
alter table public.user_platform_accounts enable row level security;
alter table public.user_service_access enable row level security;
alter table public.access_control_audit_logs enable row level security;

drop policy if exists "platform_plans read authenticated" on public.platform_plans;
create policy "platform_plans read authenticated" on public.platform_plans
  for select to authenticated using (is_active = true);

drop policy if exists "platform_plans admin write" on public.platform_plans;
create policy "platform_plans admin write" on public.platform_plans
  for all using (public.user_is_owner_admin()) with check (public.user_is_owner_admin());

drop policy if exists "platform_services read authenticated" on public.platform_services;
create policy "platform_services read authenticated" on public.platform_services
  for select to authenticated using (is_active = true);

drop policy if exists "platform_services admin write" on public.platform_services;
create policy "platform_services admin write" on public.platform_services
  for all using (public.user_is_owner_admin()) with check (public.user_is_owner_admin());

drop policy if exists "plan_entitlements read authenticated" on public.plan_service_entitlements;
create policy "plan_entitlements read authenticated" on public.plan_service_entitlements
  for select to authenticated using (true);

drop policy if exists "plan_entitlements admin write" on public.plan_service_entitlements;
create policy "plan_entitlements admin write" on public.plan_service_entitlements
  for all using (public.user_is_owner_admin()) with check (public.user_is_owner_admin());

drop policy if exists "user_platform_accounts select own" on public.user_platform_accounts;
create policy "user_platform_accounts select own" on public.user_platform_accounts
  for select using (user_id = auth.uid() or public.user_is_owner_admin());

drop policy if exists "user_platform_accounts admin write" on public.user_platform_accounts;
create policy "user_platform_accounts admin write" on public.user_platform_accounts
  for all using (public.user_is_owner_admin()) with check (public.user_is_owner_admin());

drop policy if exists "user_service_access select own" on public.user_service_access;
create policy "user_service_access select own" on public.user_service_access
  for select using (user_id = auth.uid() or public.user_is_owner_admin());

-- Users cannot insert/update/delete their own entitlements
drop policy if exists "user_service_access admin write" on public.user_service_access;
create policy "user_service_access admin write" on public.user_service_access
  for all using (public.user_is_owner_admin()) with check (public.user_is_owner_admin());

drop policy if exists "access_audit admin read" on public.access_control_audit_logs;
create policy "access_audit admin read" on public.access_control_audit_logs
  for select using (public.user_is_owner_admin());

drop policy if exists "access_audit admin insert" on public.access_control_audit_logs;
create policy "access_audit admin insert" on public.access_control_audit_logs
  for insert with check (public.user_is_owner_admin());

-- Backfill existing auth users
do $$
declare
  r record;
begin
  for r in select id from auth.users loop
    perform public.provision_user_access(r.id);
  end loop;
end $$;
