-- Idempotent revenue entries from Stripe / Shopify webhooks

alter table public.revenue_entries
  add column if not exists external_id text;

create unique index if not exists idx_revenue_entries_business_external
  on public.revenue_entries (business_id, external_id)
  where external_id is not null;
