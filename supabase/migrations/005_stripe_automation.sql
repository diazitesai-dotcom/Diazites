-- Stripe billing columns + event-driven automation (Zapier-style rules).

alter table billing
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text;

create index if not exists idx_billing_stripe_customer on billing(stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists idx_billing_stripe_subscription on billing(stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null default 'Automation',
  trigger_event text not null,
  enabled boolean not null default true,
  action_type text not null check (action_type in ('webhook', 'sms')),
  action_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_automation_rules_business on automation_rules(business_id);
create index if not exists idx_automation_rules_trigger on automation_rules(business_id, trigger_event)
  where enabled = true;

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references automation_rules(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  event_type text not null,
  status text not null check (status in ('success', 'error', 'skipped')),
  detail text,
  http_status int,
  created_at timestamptz not null default now()
);

create index if not exists idx_automation_runs_business on automation_runs(business_id, created_at desc);

alter table automation_rules enable row level security;
alter table automation_runs enable row level security;

create policy "automation_rules business owner full" on automation_rules
for all using (
  exists (
    select 1 from businesses b
    where b.id = automation_rules.business_id and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from businesses b
    where b.id = automation_rules.business_id and b.user_id = auth.uid()
  )
);

create policy "automation_runs business owner select" on automation_runs
for select using (
  exists (
    select 1 from businesses b
    where b.id = automation_runs.business_id and b.user_id = auth.uid()
  )
);

create policy "automation_runs business owner insert" on automation_runs
for insert with check (
  exists (
    select 1 from businesses b
    where b.id = automation_runs.business_id and b.user_id = auth.uid()
  )
);
