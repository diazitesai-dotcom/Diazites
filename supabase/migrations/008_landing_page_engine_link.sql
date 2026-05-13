-- Extends landing_pages (from 002_backend_system.sql) so each published page
-- can be traced back to the growth_engine_run + winning asset that produced it.
-- Apply after 006_growth_engine.sql.

alter table landing_pages
  add column if not exists engine_run_id uuid references growth_engine_runs(id) on delete set null,
  add column if not exists engine_asset_id uuid references assets(id) on delete set null;

create index if not exists idx_landing_pages_engine_run
  on landing_pages(engine_run_id)
  where engine_run_id is not null;

create index if not exists idx_landing_pages_business_published
  on landing_pages(business_id, published, updated_at desc);
