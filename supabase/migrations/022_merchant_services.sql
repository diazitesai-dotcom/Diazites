-- Merchant Services Activation — agencies, sub-accounts, processor abstraction, transactions.
-- Apply after 021_billing_trial_promo_usage.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.payment_processor as enum (
    'stripe', 'square', 'paypal', 'authorize_net', 'clover', 'external'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.merchant_account_status as enum (
    'pending', 'pending_approval', 'onboarding', 'active', 'suspended', 'deactivated', 'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.merchant_connection_type as enum (
    'stripe_connect', 'external_api', 'manual'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Agency hierarchy
-- ---------------------------------------------------------------------------

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  merchant_services_enabled boolean not null default false,
  allowed_processors public.payment_processor[] not null default array['stripe']::public.payment_processor[],
  stripe_required boolean not null default true,
  external_processors_allowed boolean not null default false,
  platform_fees_enabled boolean not null default true,
  merchant_included_in_plan boolean not null default false,
  merchant_addon_price numeric(10,2) default 49.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id)
);

create index if not exists idx_agencies_business on public.agencies(business_id);

create table if not exists public.agency_managed_businesses (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  label text,
  merchant_services_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique(agency_id, business_id),
  unique(business_id)
);

create index if not exists idx_agency_managed_agency on public.agency_managed_businesses(agency_id);
create index if not exists idx_agency_managed_business on public.agency_managed_businesses(business_id);

-- ---------------------------------------------------------------------------
-- Merchant accounts & fee config
-- ---------------------------------------------------------------------------

create table if not exists public.merchant_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  connection_type public.merchant_connection_type not null default 'stripe_connect',
  status public.merchant_account_status not null default 'pending',
  processor_account_id text,
  processor_customer_id text,
  onboarding_complete boolean not null default false,
  capabilities jsonb not null default '{"card": true, "ach": true, "invoices": true, "subscriptions": true, "payment_links": true, "refunds": true}'::jsonb,
  permissions jsonb not null default '{"create_payments": true, "issue_refunds": true, "manage_subscriptions": true, "view_payouts": true}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  deactivated_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id)
);

create index if not exists idx_merchant_accounts_business on public.merchant_accounts(business_id);
create index if not exists idx_merchant_accounts_agency on public.merchant_accounts(agency_id);
create index if not exists idx_merchant_accounts_processor on public.merchant_accounts(processor, processor_account_id);

create table if not exists public.merchant_fee_configs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  is_global_default boolean not null default false,
  platform_fee_percent numeric(6,4) not null default 1.0000,
  platform_fee_flat numeric(10,2) not null default 0,
  agency_revenue_share_percent numeric(6,4) not null default 0.2500,
  sub_account_markup_percent numeric(6,4) not null default 0,
  processor_fee_tracking boolean not null default true,
  payout_delay_days int not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (business_id is not null or agency_id is not null or is_global_default = true)
);

create unique index if not exists idx_merchant_fee_global on public.merchant_fee_configs(is_global_default)
  where is_global_default = true;
create index if not exists idx_merchant_fee_business on public.merchant_fee_configs(business_id);
create index if not exists idx_merchant_fee_agency on public.merchant_fee_configs(agency_id);

insert into public.merchant_fee_configs (is_global_default, platform_fee_percent, agency_revenue_share_percent)
select true, 1.0000, 0.2500
where not exists (select 1 from public.merchant_fee_configs where is_global_default = true);

create table if not exists public.merchant_activation_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  connection_type public.merchant_connection_type not null default 'stripe_connect',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied', 'cancelled')),
  notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_activation_business on public.merchant_activation_requests(business_id, status);

-- ---------------------------------------------------------------------------
-- Customer billing profiles (tokenized — no raw card data)
-- ---------------------------------------------------------------------------

create table if not exists public.merchant_customer_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  email text,
  name text,
  processor public.payment_processor not null default 'stripe',
  processor_customer_id text not null,
  default_payment_method_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_merchant_customer_profiles_business on public.merchant_customer_profiles(business_id);
create index if not exists idx_merchant_customer_profiles_contact on public.merchant_customer_profiles(contact_id);

-- ---------------------------------------------------------------------------
-- Transactions, invoices, links, subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.merchant_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  merchant_account_id uuid references public.merchant_accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  customer_profile_id uuid references public.merchant_customer_profiles(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  processor_transaction_id text,
  transaction_type text not null default 'payment'
    check (transaction_type in ('payment', 'deposit', 'installment', 'refund', 'chargeback', 'payout')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'disputed')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'usd',
  platform_fee numeric(12,2) not null default 0,
  agency_share numeric(12,2) not null default 0,
  processor_fee numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,
  payment_method_type text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_merchant_tx_business on public.merchant_transactions(business_id, created_at desc);
create index if not exists idx_merchant_tx_processor on public.merchant_transactions(processor, processor_transaction_id);
create index if not exists idx_merchant_tx_status on public.merchant_transactions(business_id, status);

create table if not exists public.merchant_invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  merchant_account_id uuid references public.merchant_accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  customer_profile_id uuid references public.merchant_customer_profiles(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  processor_invoice_id text,
  invoice_number text,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'paid', 'void', 'uncollectible', 'overdue')),
  amount_due numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  currency text not null default 'usd',
  due_date timestamptz,
  hosted_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_merchant_invoices_business on public.merchant_invoices(business_id, created_at desc);

create table if not exists public.merchant_payment_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  merchant_account_id uuid references public.merchant_accounts(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  processor_link_id text,
  name text not null,
  amount numeric(12,2),
  currency text not null default 'usd',
  url text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_payment_links_business on public.merchant_payment_links(business_id);

create table if not exists public.merchant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  merchant_account_id uuid references public.merchant_accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  customer_profile_id uuid references public.merchant_customer_profiles(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  processor_subscription_id text,
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'paused', 'incomplete')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'usd',
  interval text not null default 'month',
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_merchant_subscriptions_business on public.merchant_subscriptions(business_id);

create table if not exists public.merchant_refunds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  transaction_id uuid references public.merchant_transactions(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  processor_refund_id text,
  amount numeric(12,2) not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_refunds_business on public.merchant_refunds(business_id);

create table if not exists public.merchant_disputes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  transaction_id uuid references public.merchant_transactions(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  processor_dispute_id text,
  amount numeric(12,2) not null,
  currency text not null default 'usd',
  status text not null default 'needs_response',
  reason text,
  evidence_due_by timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_merchant_disputes_business on public.merchant_disputes(business_id);

create table if not exists public.merchant_payouts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  merchant_account_id uuid references public.merchant_accounts(id) on delete set null,
  processor public.payment_processor not null default 'stripe',
  processor_payout_id text,
  amount numeric(12,2) not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  arrival_date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_payouts_business on public.merchant_payouts(business_id, created_at desc);

create table if not exists public.merchant_audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  agency_id uuid references public.agencies(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_audit_business on public.merchant_audit_logs(business_id, created_at desc);
create index if not exists idx_merchant_audit_created on public.merchant_audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.agencies enable row level security;
alter table public.agency_managed_businesses enable row level security;
alter table public.merchant_accounts enable row level security;
alter table public.merchant_fee_configs enable row level security;
alter table public.merchant_activation_requests enable row level security;
alter table public.merchant_customer_profiles enable row level security;
alter table public.merchant_transactions enable row level security;
alter table public.merchant_invoices enable row level security;
alter table public.merchant_payment_links enable row level security;
alter table public.merchant_subscriptions enable row level security;
alter table public.merchant_refunds enable row level security;
alter table public.merchant_disputes enable row level security;
alter table public.merchant_payouts enable row level security;
alter table public.merchant_audit_logs enable row level security;

create or replace function public.user_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users a where a.user_id = auth.uid());
$$;

create or replace function public.user_owns_agency(p_agency_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from agencies ag
    join businesses b on b.id = ag.business_id
    where ag.id = p_agency_id and b.user_id = auth.uid()
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'merchant_accounts','merchant_activation_requests','merchant_customer_profiles',
    'merchant_transactions','merchant_invoices','merchant_payment_links',
    'merchant_subscriptions','merchant_refunds','merchant_disputes','merchant_payouts'
  ]
  loop
    execute format('drop policy if exists "%s owner" on public.%s', t, t);
    execute format(
      'create policy "%s owner" on public.%s for all using (user_owns_business(business_id)) with check (user_owns_business(business_id))',
      t, t
    );
    execute format('drop policy if exists "%s admin" on public.%s', t, t);
    execute format(
      'create policy "%s admin" on public.%s for all using (user_is_admin()) with check (user_is_admin())',
      t, t
    );
  end loop;
end $$;

drop policy if exists "agencies owner" on public.agencies;
create policy "agencies owner" on public.agencies for all
  using (user_owns_business(business_id)) with check (user_owns_business(business_id));
drop policy if exists "agencies admin" on public.agencies;
create policy "agencies admin" on public.agencies for all
  using (user_is_admin()) with check (user_is_admin());

drop policy if exists "agency_managed owner" on public.agency_managed_businesses;
create policy "agency_managed owner" on public.agency_managed_businesses for all using (
  user_owns_agency(agency_id) or user_owns_business(business_id)
) with check (
  user_owns_agency(agency_id) or user_owns_business(business_id)
);
drop policy if exists "agency_managed admin" on public.agency_managed_businesses;
create policy "agency_managed admin" on public.agency_managed_businesses for all
  using (user_is_admin()) with check (user_is_admin());

drop policy if exists "merchant_fee_configs read" on public.merchant_fee_configs;
create policy "merchant_fee_configs read" on public.merchant_fee_configs for select using (
  user_is_admin()
  or (business_id is not null and user_owns_business(business_id))
  or (agency_id is not null and user_owns_agency(agency_id))
  or is_global_default = true
);
drop policy if exists "merchant_fee_configs admin write" on public.merchant_fee_configs;
create policy "merchant_fee_configs admin write" on public.merchant_fee_configs for all
  using (user_is_admin()) with check (user_is_admin());

drop policy if exists "merchant_audit owner read" on public.merchant_audit_logs;
create policy "merchant_audit owner read" on public.merchant_audit_logs for select using (
  (business_id is not null and user_owns_business(business_id))
  or (agency_id is not null and user_owns_agency(agency_id))
);
drop policy if exists "merchant_audit admin" on public.merchant_audit_logs;
create policy "merchant_audit admin" on public.merchant_audit_logs for all
  using (user_is_admin()) with check (user_is_admin());
