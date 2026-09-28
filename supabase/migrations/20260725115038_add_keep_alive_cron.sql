-- The live project already schedules `stefbank-keep-alive` three times daily.
-- This repository migration preserves the callable object without scheduling a
-- duplicate cron job when the migration is replayed on an existing project.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.keep_alive()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'project', 'Stefbank',
    'checked_at', now()
  );
$$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
