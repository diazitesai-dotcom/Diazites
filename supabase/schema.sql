create extension if not exists "pgcrypto";

create type pipeline_status as enum ('new', 'contacted', 'qualified', 'booked', 'won', 'lost');
create type agent_status as enum ('inactive', 'pending', 'active');
create type onboarding_stage as enum ('signup', 'profile', 'build', 'qa', 'live', 'optimize');

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  name text not null,
  website text,
  logo_url text,
  service_area text,
  city_state text,
  services text,
  business_hours text,
  monthly_budget numeric(10,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  business_id uuid references businesses(id) on delete set null,
  full_name text,
  phone text,
  role text default 'owner',
  created_at timestamptz not null default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_type text not null,
  status agent_status not null default 'inactive',
  activated_at timestamptz,
  created_at timestamptz not null default now()
);
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agents_business_agent_type_key'
  ) then
    alter table agents
      add constraint agents_business_agent_type_key unique (business_id, agent_type);
  end if;
end $$;

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null,
  budget numeric(10,2) default 0,
  goal text,
  location text,
  status text default 'draft',
  spend numeric(10,2) default 0,
  leads_count int default 0,
  cpl numeric(10,2) default 0,
  conversion_rate numeric(5,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  name text not null,
  phone text,
  email text,
  address text,
  roofing_need text,
  timeline text,
  notes text,
  source text,
  status pipeline_status not null default 'new',
  conversation_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  channel text not null default 'email',
  message_body text not null,
  model text,
  sent_at timestamptz not null default now(),
  status text not null default 'sent'
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  report_date date not null,
  leads int default 0,
  spend numeric(10,2) default 0,
  cpl numeric(10,2) default 0,
  roi numeric(8,2) default 0,
  conversions int default 0
);

create table if not exists billing (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references businesses(id) on delete cascade,
  plan_name text not null default 'Starter',
  amount numeric(10,2) not null default 497,
  payment_status text not null default 'active',
  stripe_customer_id text,
  updated_at timestamptz not null default now()
);

create table if not exists onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  business_name text,
  owner_name text,
  email text,
  phone text,
  website text,
  logo_url text,
  service_area text,
  city_state text,
  services text,
  business_hours text,
  monthly_budget numeric(10,2) default 0,
  stage onboarding_stage not null default 'signup',
  status text default 'in_progress',
  checklist jsonb not null default '{"profile_complete":false,"agents_assigned":false,"campaign_built":false,"landing_page_ready":false,"ai_active":false}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create index if not exists idx_businesses_owner_user_id on businesses(owner_user_id);
create index if not exists idx_agents_business_id on agents(business_id);
create index if not exists idx_campaigns_business_id on campaigns(business_id);
create index if not exists idx_leads_business_id on leads(business_id);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_ai_messages_lead_id on ai_messages(lead_id);
create index if not exists idx_reports_business_id on reports(business_id);
create index if not exists idx_onboarding_user_id on onboarding(user_id);

alter table users enable row level security;
alter table businesses enable row level security;
alter table profiles enable row level security;
alter table agents enable row level security;
alter table campaigns enable row level security;
alter table leads enable row level security;
alter table ai_messages enable row level security;
alter table reports enable row level security;
alter table billing enable row level security;
alter table onboarding enable row level security;
alter table admin_users enable row level security;

create policy "users select own" on users
for select using (id = auth.uid());

create policy "users insert own" on users
for insert with check (id = auth.uid());

create policy "businesses owner full access" on businesses
for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "profiles owner full access" on profiles
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "agents business owner access" on agents
for all using (
  exists (
    select 1 from businesses b
    where b.id = agents.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = agents.business_id and b.owner_user_id = auth.uid()
  )
);

create policy "campaigns business owner access" on campaigns
for all using (
  exists (
    select 1 from businesses b
    where b.id = campaigns.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = campaigns.business_id and b.owner_user_id = auth.uid()
  )
);

create policy "leads business owner access" on leads
for all using (
  exists (
    select 1 from businesses b
    where b.id = leads.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = leads.business_id and b.owner_user_id = auth.uid()
  )
);

create policy "messages business owner access" on ai_messages
for all using (
  exists (
    select 1 from businesses b
    where b.id = ai_messages.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = ai_messages.business_id and b.owner_user_id = auth.uid()
  )
);

create policy "reports business owner access" on reports
for all using (
  exists (
    select 1 from businesses b
    where b.id = reports.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = reports.business_id and b.owner_user_id = auth.uid()
  )
);

create policy "billing business owner access" on billing
for all using (
  exists (
    select 1 from businesses b
    where b.id = billing.business_id and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = billing.business_id and b.owner_user_id = auth.uid()
  )
);

create policy "onboarding owner access" on onboarding
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admin users read self" on admin_users
for select using (user_id = auth.uid());
