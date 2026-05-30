-- Pipeline stage automations (GHL-style): attach workflows & actions when contacts enter a stage.

create table if not exists public.pipeline_stage_automations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  pipeline_stage_id uuid not null references public.pipeline_stages(id) on delete cascade,
  name text not null,
  automation_type text not null
    check (automation_type in (
      'enroll_workflow',
      'send_sms',
      'send_email',
      'add_tag',
      'create_task',
      'move_pipeline_stage',
      'trigger_webhook',
      'wait'
    )),
  workflow_id uuid references public.diazites_workflows(id) on delete set null,
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pipeline_stage_auto_stage
  on public.pipeline_stage_automations(pipeline_stage_id, sort_order);
create index if not exists idx_pipeline_stage_auto_pipeline
  on public.pipeline_stage_automations(pipeline_id);

alter table public.pipeline_stage_automations enable row level security;

drop policy if exists "pipeline_stage_automations owner" on public.pipeline_stage_automations;
create policy "pipeline_stage_automations owner" on public.pipeline_stage_automations
  for all using (user_owns_business(business_id)) with check (user_owns_business(business_id));
