-- Platform Owner/Admin dashboard — account hierarchy, entitlements, overrides, audit.
-- Apply after 023_ai_text_email_campaigns.sql

create table if not exists public.platform_account_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  account_type text not null default 'direct'
    check (account_type in ('direct', 'agency', 'sub_account')),
  status text not null default 'active'
    check (status in ('active', 'pending', 'suspended', 'approved')),
  parent_business_id uuid references public.businesses(id) on delete set null,
  feature_flags jsonb not null default '{
    "merchant_services": true,
    "ai_calls": true,
    "sms": true,
    "email_campaigns": true,
    "workflows": true,
    "ai_agents": true,
    "ad_accounts": true,
    "white_label": false,
    "funnel_studio": true,
    "integrations": true
  }'::jsonb,
  usage_limit_overrides jsonb not null default '{}'::jsonb,
  white_label_enabled boolean not null default false,
  admin_notes text,
  last_login_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_account_type on public.platform_account_settings(account_type, status);
create index if not exists idx_platform_account_parent on public.platform_account_settings(parent_business_id);

create table if not exists public.platform_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  business_id uuid references public.businesses(id) on delete set null,
  agency_id uuid references public.agencies(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_admin_audit_created on public.platform_admin_audit_logs(created_at desc);
create index if not exists idx_platform_admin_audit_business on public.platform_admin_audit_logs(business_id);

alter table public.platform_account_settings enable row level security;
alter table public.platform_admin_audit_logs enable row level security;

drop policy if exists "platform_account_settings admin" on public.platform_account_settings;
create policy "platform_account_settings admin" on public.platform_account_settings for all
  using (user_is_admin()) with check (user_is_admin());

drop policy if exists "platform_admin_audit admin" on public.platform_admin_audit_logs;
create policy "platform_admin_audit admin" on public.platform_admin_audit_logs for all
  using (user_is_admin()) with check (user_is_admin());
