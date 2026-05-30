-- Native trial, promo codes, usage metering, and billing extensions.

alter table public.billing
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'expired', 'unpaid')),
  add column if not exists billing_cycle text not null default 'monthly'
    check (billing_cycle in ('monthly', 'annual', 'custom')),
  add column if not exists promo_code text,
  add column if not exists promo_source text,
  add column if not exists converted_at timestamptz,
  add column if not exists canceled_at timestamptz;

create index if not exists idx_billing_subscription_status on public.billing(subscription_status);
create index if not exists idx_billing_trial_ends on public.billing(trial_ends_at);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  trial_days int not null default 14 check (trial_days in (14, 30, 60, 120)),
  max_uses int,
  use_count int not null default 0,
  single_use_per_user boolean not null default true,
  expires_at timestamptz,
  active boolean not null default true,
  affiliate_id text,
  source text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_promo_codes_active on public.promo_codes(active, code);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  trial_days_granted int not null,
  redeemed_at timestamptz not null default now(),
  converted_at timestamptz,
  unique(promo_code_id, user_id)
);

create index if not exists idx_promo_redemptions_user on public.promo_code_redemptions(user_id);

create table if not exists public.signup_promo_pending (
  user_id uuid primary key references auth.users(id) on delete cascade,
  promo_code text not null,
  trial_days int not null default 14,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  metric_key text not null,
  quantity numeric(14,4) not null default 0,
  period_start date not null,
  period_end date not null,
  included_limit numeric(14,4),
  overage_quantity numeric(14,4) not null default 0,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(business_id, metric_key, period_start, period_end)
);

create index if not exists idx_usage_records_business_period on public.usage_records(business_id, period_start desc);

alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;
alter table public.signup_promo_pending enable row level security;
alter table public.usage_records enable row level security;

drop policy if exists "promo_codes admin read" on public.promo_codes;
create policy "promo_codes admin read" on public.promo_codes for select using (true);

drop policy if exists "promo_codes admin write" on public.promo_codes;
create policy "promo_codes admin write" on public.promo_codes for all using (
  exists (select 1 from admin_users au where au.user_id = auth.uid())
) with check (
  exists (select 1 from admin_users au where au.user_id = auth.uid())
);

drop policy if exists "promo_redemptions owner" on public.promo_code_redemptions;
create policy "promo_redemptions owner" on public.promo_code_redemptions for select using (
  user_id = auth.uid()
  or exists (select 1 from admin_users au where au.user_id = auth.uid())
);

drop policy if exists "signup_promo_pending owner" on public.signup_promo_pending;
create policy "signup_promo_pending owner" on public.signup_promo_pending for all using (
  user_id = auth.uid()
) with check (user_id = auth.uid());

drop policy if exists "usage_records owner" on public.usage_records;
create policy "usage_records owner" on public.usage_records for all using (
  exists (select 1 from businesses b where b.id = business_id and b.user_id = auth.uid())
) with check (
  exists (select 1 from businesses b where b.id = business_id and b.user_id = auth.uid())
);

insert into public.promo_codes (code, trial_days, max_uses, source, admin_notes)
values
  ('DIAZ30', 30, null, 'marketing', '30-day trial promo'),
  ('DIAZ60', 60, null, 'marketing', '60-day trial promo'),
  ('DIAZ120', 120, null, 'marketing', '120-day trial promo'),
  ('FOUNDERS30', 30, 500, 'founders', 'Founders 30-day trial'),
  ('PARTNER60', 60, null, 'partner', 'Partner 60-day trial'),
  ('VIP120', 120, 100, 'vip', 'VIP 120-day trial'),
  ('BETA120', 120, null, 'beta', 'Beta program 120-day trial')
on conflict (code) do nothing;
