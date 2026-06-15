-- Production upgrades for the native Diazites Website Builder.
-- Adds AI generation diagnostics, media folders, CRM form settings, and restore tracking.

alter table public.website_assets
  add column if not exists folder_path text default '/',
  add column if not exists deleted_at timestamptz;

alter table public.website_forms
  add column if not exists assigned_agent_id uuid references public.agents(id) on delete set null,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists source_tracking jsonb not null default '{}'::jsonb;

alter table public.website_versions
  add column if not exists restored_from_version_id uuid references public.website_versions(id) on delete set null,
  add column if not exists restored_at timestamptz,
  add column if not exists diff_summary jsonb not null default '{}'::jsonb;

create table if not exists public.website_ai_generations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid references public.websites(id) on delete cascade,
  page_id uuid references public.website_pages(id) on delete cascade,
  prompt text not null,
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'repaired')),
  attempts int not null default 0,
  schema_version text not null default 'website_page_plan_v1',
  generated_json jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  repaired_json jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_website_ai_generations_business
  on public.website_ai_generations(business_id, created_at desc);

create table if not exists public.website_media_folders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid references public.websites(id) on delete cascade,
  name text not null,
  path text not null,
  parent_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(business_id, path)
);

alter table public.website_ai_generations enable row level security;
alter table public.website_media_folders enable row level security;

drop policy if exists "website_ai_generations owner access" on public.website_ai_generations;
create policy "website_ai_generations owner access" on public.website_ai_generations
for all using (public.user_owns_business(business_id))
with check (public.user_owns_business(business_id));

drop policy if exists "website_media_folders owner access" on public.website_media_folders;
create policy "website_media_folders owner access" on public.website_media_folders
for all using (public.user_owns_business(business_id))
with check (public.user_owns_business(business_id));
