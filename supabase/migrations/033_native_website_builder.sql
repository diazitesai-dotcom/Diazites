-- Native Diazites website + funnel builder (GrapesJS-backed V1).
-- Additive and safe to re-run: all schema uses IF NOT EXISTS / idempotent policies.

do $$ begin
  create type public.website_status as enum ('draft', 'published', 'unpublished', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.website_domain_status as enum ('pending', 'verified', 'active', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.website_member_role as enum ('agency_owner', 'admin', 'staff', 'client');
exception when duplicate_object then null;
end $$;

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  default_domain text,
  subdomain text,
  status public.website_status not null default 'draft',
  brand_config jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, name)
);

create index if not exists idx_websites_business on public.websites(business_id, updated_at desc);
create unique index if not exists idx_websites_subdomain_unique
  on public.websites(lower(subdomain))
  where subdomain is not null;

create table if not exists public.website_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null,
  preview_image_url text,
  grapesjs_data jsonb not null default '{}'::jsonb,
  html text not null default '',
  css text not null default '',
  seo_defaults jsonb not null default '{}'::jsonb,
  form_schema jsonb not null default '[]'::jsonb,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_website_templates_category on public.website_templates(category);

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  template_id uuid references public.website_templates(id) on delete set null,
  title text not null,
  slug text not null,
  page_type text not null default 'landing',
  status public.website_status not null default 'draft',
  grapesjs_data jsonb not null default '{}'::jsonb,
  html text not null default '',
  css text not null default '',
  custom_html text,
  custom_css text,
  published_html text,
  published_css text,
  sort_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(website_id, slug)
);

create index if not exists idx_website_pages_business on public.website_pages(business_id, updated_at desc);
create index if not exists idx_website_pages_website on public.website_pages(website_id, sort_order);
create index if not exists idx_website_pages_public
  on public.website_pages(website_id, slug)
  where status = 'published';

create table if not exists public.website_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  page_id uuid not null references public.website_pages(id) on delete cascade,
  version_number int not null,
  label text,
  change_summary text,
  grapesjs_data jsonb not null default '{}'::jsonb,
  html text not null default '',
  css text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique(page_id, version_number)
);

create index if not exists idx_website_versions_page on public.website_versions(page_id, version_number desc);

create table if not exists public.website_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  hostname text not null,
  domain_type text not null default 'custom' check (domain_type in ('custom', 'subdomain')),
  status public.website_domain_status not null default 'pending',
  verification_token text not null default encode(gen_random_bytes(16), 'hex'),
  dns_instructions jsonb not null default '{}'::jsonb,
  ssl_status text not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(hostname)
);

create index if not exists idx_website_domains_website on public.website_domains(website_id);

create table if not exists public.website_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid references public.websites(id) on delete cascade,
  page_id uuid references public.website_pages(id) on delete set null,
  asset_type text not null check (asset_type in ('image', 'video', 'pdf', 'logo', 'font', 'other')),
  bucket text not null default 'website-assets',
  storage_path text not null,
  public_url text,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_website_assets_business on public.website_assets(business_id, created_at desc);
create index if not exists idx_website_assets_website on public.website_assets(website_id);

create table if not exists public.website_forms (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  page_id uuid references public.website_pages(id) on delete cascade,
  name text not null,
  slug text not null,
  fields jsonb not null default '[]'::jsonb,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  pipeline_stage_id uuid references public.pipeline_stages(id) on delete set null,
  workflow_id uuid references public.diazites_workflows(id) on delete set null,
  notification_config jsonb not null default '{}'::jsonb,
  ai_follow_up_config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(website_id, slug)
);

create index if not exists idx_website_forms_business on public.website_forms(business_id);
create index if not exists idx_website_forms_page on public.website_forms(page_id);

create table if not exists public.website_submissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  page_id uuid references public.website_pages(id) on delete set null,
  form_id uuid references public.website_forms(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_website_submissions_business on public.website_submissions(business_id, created_at desc);
create index if not exists idx_website_submissions_form on public.website_submissions(form_id, created_at desc);

create table if not exists public.website_seo (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  page_id uuid not null references public.website_pages(id) on delete cascade,
  meta_title text,
  meta_description text,
  og_image_url text,
  canonical_url text,
  schema_markup jsonb not null default '{}'::jsonb,
  sitemap_enabled boolean not null default true,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page_id)
);

create index if not exists idx_website_seo_website on public.website_seo(website_id);

create table if not exists public.website_analytics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  page_id uuid references public.website_pages(id) on delete cascade,
  analytics_date date not null default current_date,
  visitors int not null default 0,
  leads int not null default 0,
  form_submissions int not null default 0,
  conversion_rate numeric(6,4) not null default 0,
  source text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_website_analytics_unique
  on public.website_analytics(
    website_id,
    coalesce(page_id, '00000000-0000-0000-0000-000000000000'::uuid),
    analytics_date,
    coalesce(source, ''),
    coalesce(utm_source, ''),
    coalesce(utm_campaign, '')
  );

create table if not exists public.website_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.website_member_role not null default 'client',
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(website_id, user_id)
);

create index if not exists idx_website_permissions_user on public.website_permissions(user_id, website_id);

insert into storage.buckets (id, name, public)
values ('website-assets', 'website-assets', true)
on conflict (id) do nothing;

create or replace function public.user_can_access_website(p_website_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.websites w
    where w.id = p_website_id
      and public.user_owns_business(w.business_id)
  )
  or exists (
    select 1
    from public.website_permissions wp
    where wp.website_id = p_website_id
      and wp.user_id = auth.uid()
  );
$$;

alter table public.websites enable row level security;
alter table public.website_pages enable row level security;
alter table public.website_templates enable row level security;
alter table public.website_domains enable row level security;
alter table public.website_assets enable row level security;
alter table public.website_forms enable row level security;
alter table public.website_submissions enable row level security;
alter table public.website_versions enable row level security;
alter table public.website_seo enable row level security;
alter table public.website_analytics enable row level security;
alter table public.website_permissions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'websites',
    'website_pages',
    'website_domains',
    'website_assets',
    'website_forms',
    'website_submissions',
    'website_versions',
    'website_seo',
    'website_analytics',
    'website_permissions'
  ]
  loop
    execute format('drop policy if exists "%s owner access" on public.%I', t, t);
    execute format(
      'create policy "%s owner access" on public.%I for all using (public.user_owns_business(business_id)) with check (public.user_owns_business(business_id))',
      t,
      t
    );
  end loop;
end $$;

drop policy if exists "website_templates public read" on public.website_templates;
create policy "website_templates public read" on public.website_templates
for select using (is_system = true);

drop policy if exists "website_pages public read published" on public.website_pages;
create policy "website_pages public read published" on public.website_pages
for select using (status = 'published');

drop policy if exists "website_seo public read published" on public.website_seo;
create policy "website_seo public read published" on public.website_seo
for select using (
  exists (
    select 1 from public.website_pages p
    where p.id = website_seo.page_id and p.status = 'published'
  )
);

drop policy if exists "website_forms public read active published" on public.website_forms;
create policy "website_forms public read active published" on public.website_forms
for select using (
  active = true
  and exists (
    select 1 from public.website_pages p
    where p.id = website_forms.page_id and p.status = 'published'
  )
);

drop policy if exists "website_submissions public insert active form" on public.website_submissions;
create policy "website_submissions public insert active form" on public.website_submissions
for insert with check (
  exists (
    select 1
    from public.website_forms f
    where f.id = website_submissions.form_id
      and f.business_id = website_submissions.business_id
      and f.active = true
  )
);

drop policy if exists "website assets owner read" on storage.objects;
create policy "website assets owner read" on storage.objects
for select using (
  bucket_id = 'website-assets'
  and (
    true
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
      and public.user_owns_business(((storage.foldername(name))[1])::uuid)
    )
  )
);

drop policy if exists "website assets owner upload" on storage.objects;
create policy "website assets owner upload" on storage.objects
for insert with check (
  bucket_id = 'website-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.user_owns_business(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "website assets owner update" on storage.objects;
create policy "website assets owner update" on storage.objects
for update using (
  bucket_id = 'website-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.user_owns_business(((storage.foldername(name))[1])::uuid)
) with check (
  bucket_id = 'website-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.user_owns_business(((storage.foldername(name))[1])::uuid)
);

insert into public.website_templates (
  slug,
  name,
  category,
  description,
  grapesjs_data,
  html,
  css,
  seo_defaults,
  form_schema
)
values
  ('local-business', 'Local Business', 'local_business', 'A trust-first homepage for local service companies.', '{"pages":[{"frames":[{"component":{"type":"wrapper","components":[]}}]}]}'::jsonb, '<section><h1>Grow your local business with Diazites</h1><p>Book more qualified customers with AI-powered follow-up.</p></section>', 'body{font-family:Inter,sans-serif}', '{"title":"Local Business Services","description":"Book trusted local services in your area."}'::jsonb, '[{"name":"name","label":"Name","type":"text","required":true},{"name":"phone","label":"Phone","type":"tel","required":true},{"name":"email","label":"Email","type":"email","required":false}]'::jsonb),
  ('contractor', 'Contractor', 'contractor', 'Lead-generation layout for contractors and home improvement pros.', '{}'::jsonb, '<section><h1>Reliable contracting services built around your project</h1></section>', '', '{"title":"Contractor Services","description":"Request a contractor estimate today."}'::jsonb, '[]'::jsonb),
  ('roofing', 'Roofing', 'roofing', 'Storm damage, repair, and roof replacement landing page.', '{}'::jsonb, '<section><h1>Roof repair and replacement estimates</h1></section>', '', '{"title":"Roofing Estimates","description":"Get a fast roofing estimate from a trusted local team."}'::jsonb, '[]'::jsonb),
  ('plumbing', 'Plumbing', 'plumbing', 'Emergency and scheduled plumbing service page.', '{}'::jsonb, '<section><h1>Fast plumbing help when you need it</h1></section>', '', '{"title":"Plumbing Services","description":"Schedule plumbing repair or emergency service."}'::jsonb, '[]'::jsonb),
  ('hvac', 'HVAC', 'hvac', 'Heating and cooling service, tune-up, and replacement layout.', '{}'::jsonb, '<section><h1>Comfort-focused HVAC service</h1></section>', '', '{"title":"HVAC Service","description":"Book HVAC repair, maintenance, or installation."}'::jsonb, '[]'::jsonb),
  ('restaurant', 'Restaurant', 'restaurant', 'Restaurant website for reservations, menus, and catering leads.', '{}'::jsonb, '<section><h1>Bring more guests to your table</h1></section>', '', '{"title":"Restaurant Reservations","description":"View menu, reserve a table, or book catering."}'::jsonb, '[]'::jsonb),
  ('real-estate', 'Real Estate', 'real_estate', 'Property lead capture for agents and brokerages.', '{}'::jsonb, '<section><h1>Find your next home with a local expert</h1></section>', '', '{"title":"Real Estate Services","description":"Connect with a local real estate expert."}'::jsonb, '[]'::jsonb),
  ('attorney', 'Attorney', 'attorney', 'Compliance-aware legal consultation landing page.', '{}'::jsonb, '<section><h1>Request a confidential legal consultation</h1></section>', '', '{"title":"Legal Consultation","description":"Schedule a consultation with a local attorney."}'::jsonb, '[]'::jsonb),
  ('medical-practice', 'Medical Practice', 'medical_practice', 'Patient acquisition page for clinics and practices.', '{}'::jsonb, '<section><h1>Patient-first care made simple</h1></section>', '', '{"title":"Medical Practice","description":"Schedule an appointment with our care team."}'::jsonb, '[]'::jsonb),
  ('nonprofit', 'Nonprofit', 'nonprofit', 'Mission-driven page for donors, volunteers, and program participants.', '{}'::jsonb, '<section><h1>Support a mission that changes lives</h1></section>', '', '{"title":"Support Our Nonprofit","description":"Donate, volunteer, or join our nonprofit programs."}'::jsonb, '[]'::jsonb),
  ('e-commerce', 'E-commerce', 'ecommerce', 'Product and offer page for online sales.', '{}'::jsonb, '<section><h1>Shop the offer built for you</h1></section>', '', '{"title":"Shop Online","description":"Discover products and offers from our store."}'::jsonb, '[]'::jsonb),
  ('marketing-agency', 'Marketing Agency', 'marketing_agency', 'Agency funnel for audits, consultations, and retainers.', '{}'::jsonb, '<section><h1>Scale campaigns with a smarter agency partner</h1></section>', '', '{"title":"Marketing Agency","description":"Book a growth audit with our marketing team."}'::jsonb, '[]'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  seo_defaults = excluded.seo_defaults,
  form_schema = excluded.form_schema,
  updated_at = now();
