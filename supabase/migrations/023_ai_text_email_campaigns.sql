-- AI Text Command Center + Email Campaign Building Center
-- Apply after 022_merchant_services.sql

-- ---------------------------------------------------------------------------
-- AI Text / SMS
-- ---------------------------------------------------------------------------

create table if not exists public.ai_text_agents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  objective text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  persona_config jsonb not null default '{}'::jsonb,
  script_config jsonb not null default '{}'::jsonb,
  routing_config jsonb not null default '{}'::jsonb,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  workflow_id uuid references public.diazites_workflows(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_text_agents_business on public.ai_text_agents(business_id);

create table if not exists public.sms_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  ai_text_agent_id uuid references public.ai_text_agents(id) on delete set null,
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'paused', 'archived')),
  message_body text not null,
  audience_type text not null default 'all_contacts'
    check (audience_type in ('all_contacts', 'pipeline_stage', 'tag', 'manual_list')),
  audience_filter jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  sent_at timestamptz,
  stats jsonb not null default '{"sent": 0, "delivered": 0, "failed": 0, "replied": 0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sms_campaigns_business on public.sms_campaigns(business_id, created_at desc);

create table if not exists public.sms_campaign_sends (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  campaign_id uuid not null references public.sms_campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  phone text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'delivered', 'failed', 'replied')),
  provider_message_id text,
  error_detail text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_sms_campaign_sends_campaign on public.sms_campaign_sends(campaign_id);

create table if not exists public.sms_sequences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  ai_text_agent_id uuid references public.ai_text_agents(id) on delete set null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  steps jsonb not null default '[]'::jsonb,
  trigger_type text not null default 'lead_created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sms_sequences_business on public.sms_sequences(business_id);

-- ---------------------------------------------------------------------------
-- Email campaigns (Mailchimp-style)
-- ---------------------------------------------------------------------------

create table if not exists public.email_audiences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  contact_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, name)
);

create index if not exists idx_email_audiences_business on public.email_audiences(business_id);

create table if not exists public.email_audience_members (
  id uuid primary key default gen_random_uuid(),
  audience_id uuid not null references public.email_audiences(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  email text not null,
  name text,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed', 'bounced', 'cleaned')),
  metadata jsonb not null default '{}'::jsonb,
  subscribed_at timestamptz not null default now(),
  unique(audience_id, email)
);

create index if not exists idx_email_audience_members_audience on public.email_audience_members(audience_id);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  subject text not null,
  preview_text text,
  html_body text not null default '',
  plain_text_body text,
  category text default 'general',
  is_ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_templates_business on public.email_templates(business_id);

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  audience_id uuid references public.email_audiences(id) on delete set null,
  template_id uuid references public.email_templates(id) on delete set null,
  name text not null,
  subject text not null,
  preview_text text,
  from_name text,
  reply_to text,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'paused', 'archived')),
  html_body text not null default '',
  plain_text_body text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  stats jsonb not null default '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "unsubscribed": 0}'::jsonb,
  ab_test_enabled boolean not null default false,
  ab_test_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_campaigns_business on public.email_campaigns(business_id, created_at desc);

create table if not exists public.email_campaign_sends (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  audience_member_id uuid references public.email_audience_members(id) on delete set null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
  provider_message_id text,
  error_detail text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_campaign_sends_campaign on public.email_campaign_sends(campaign_id);

create table if not exists public.email_automations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  trigger_type text not null default 'signup',
  steps jsonb not null default '[]'::jsonb,
  audience_id uuid references public.email_audiences(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_automations_business on public.email_automations(business_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.ai_text_agents enable row level security;
alter table public.sms_campaigns enable row level security;
alter table public.sms_campaign_sends enable row level security;
alter table public.sms_sequences enable row level security;
alter table public.email_audiences enable row level security;
alter table public.email_audience_members enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.email_campaign_sends enable row level security;
alter table public.email_automations enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ai_text_agents','sms_campaigns','sms_campaign_sends','sms_sequences',
    'email_audiences','email_audience_members','email_templates',
    'email_campaigns','email_campaign_sends','email_automations'
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
