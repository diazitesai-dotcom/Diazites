-- Backfill public.users from auth.users (fixes onboarding FK when auth trigger did not run).
insert into public.users (id, email)
select
  au.id,
  coalesce(nullif(trim(au.email), ''), au.id::text || '@users.local')
from auth.users au
on conflict (id) do update
  set email = excluded.email;

-- Re-assert signup hook creates public.users before provisioning access.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (
    new.id,
    coalesce(nullif(trim(new.email), ''), new.id::text || '@users.local')
  )
  on conflict (id) do update set email = excluded.email;

  perform public.provision_user_access(new.id);

  return new;
end;
$$;
