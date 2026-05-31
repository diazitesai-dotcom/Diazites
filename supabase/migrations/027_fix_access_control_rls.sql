-- Fix owner-admin check: use admin_users only (avoids RLS edge cases on user_platform_accounts).

create or replace function public.user_is_owner_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  );
$$;
