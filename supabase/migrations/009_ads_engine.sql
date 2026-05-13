-- Phase 5: Ads Engine.
-- Per-business OAuth-style connections to ad platforms (Meta first; Google /
-- TikTok / Microsoft modeled with the same shape) and a flat record of every
-- campaign the engine pushes plus pulled spend / lead metrics.
-- Apply after 008_landing_page_engine_link.sql.

create table if not exists ad_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google', 'tiktok', 'microsoft')),
  external_account_id text,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'pending', 'connected', 'error')),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, platform)
);

create index if not exists idx_ad_accounts_business on ad_accounts(business_id);

create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  ad_account_id uuid references ad_accounts(id) on delete set null,
  engine_run_id uuid references growth_engine_runs(id) on delete set null,
  winning_asset_id uuid references assets(id) on delete set null,
  platform text not null,
  external_campaign_id text,
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'active', 'paused', 'archived', 'error')),
  daily_budget_usd numeric(10,2) default 0,
  spend_usd numeric(12,2) default 0,
  impressions int default 0,
  clicks int default 0,
  leads int default 0,
  last_synced_at timestamptz,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ad_campaigns_business on ad_campaigns(business_id, created_at desc);
create index if not exists idx_ad_campaigns_account on ad_campaigns(ad_account_id);
create index if not exists idx_ad_campaigns_engine_run on ad_campaigns(engine_run_id)
  where engine_run_id is not null;

create or replace function public.touch_ad_accounts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_ad_accounts_updated_at on ad_accounts;
create trigger trg_touch_ad_accounts_updated_at
  before update on ad_accounts
  for each row execute procedure public.touch_ad_accounts_updated_at();

drop trigger if exists trg_touch_ad_campaigns_updated_at on ad_campaigns;
create trigger trg_touch_ad_campaigns_updated_at
  before update on ad_campaigns
  for each row execute procedure public.touch_ad_accounts_updated_at();

alter table ad_accounts enable row level security;
alter table ad_campaigns enable row level security;

drop policy if exists "ad_accounts owner full" on ad_accounts;
create policy "ad_accounts owner full" on ad_accounts
for all using (
  exists (select 1 from businesses b where b.id = ad_accounts.business_id and b.user_id = auth.uid())
) with check (
  exists (select 1 from businesses b where b.id = ad_accounts.business_id and b.user_id = auth.uid())
);

drop policy if exists "ad_campaigns owner full" on ad_campaigns;
create policy "ad_campaigns owner full" on ad_campaigns
for all using (
  exists (select 1 from businesses b where b.id = ad_campaigns.business_id and b.user_id = auth.uid())
) with check (
  exists (select 1 from businesses b where b.id = ad_campaigns.business_id and b.user_id = auth.uid())
);
