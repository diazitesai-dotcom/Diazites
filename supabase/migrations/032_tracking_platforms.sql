-- Allow analytics / pixel connectors as first-class ad_accounts.platform values.

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.ad_accounts'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%platform%';

  if cname is not null then
    execute format('alter table ad_accounts drop constraint %I', cname);
  end if;
end $$;

alter table ad_accounts
  add constraint ad_accounts_platform_check
  check (
    platform in (
      'meta',
      'google',
      'tiktok',
      'microsoft',
      'zernio',
      'ga4',
      'meta_pixel',
      'gtm'
    )
  );
