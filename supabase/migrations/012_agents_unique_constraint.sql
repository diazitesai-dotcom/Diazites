-- Restore the (business_id, agent_type) unique constraint on `agents` so the
-- Activate-Agent server action's upsert ON CONFLICT clause has a matching
-- target. schema.sql declared it in a DO block but at least one live
-- database was provisioned without it, surfacing as:
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"
-- Apply after any earlier migration that created the `agents` table.

-- De-dup any pre-existing (business_id, agent_type) collisions so the unique
-- constraint can be added cleanly. Keeps the most recent row per pair.
with ranked as (
  select id,
         row_number() over (
           partition by business_id, agent_type
           order by coalesce(activated_at, created_at) desc, created_at desc
         ) as rn
  from agents
)
delete from agents
where id in (select id from ranked where rn > 1);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'agents_business_agent_type_key'
  ) then
    alter table agents
      add constraint agents_business_agent_type_key
      unique (business_id, agent_type);
  end if;
end $$;
