-- 007: Settings tables (user_settings, custom_tags, notification_logs)

-- ===== user_settings =====
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ===== custom_tags =====
create table if not exists public.custom_tags (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);
create index if not exists custom_tags_user_idx on public.custom_tags(user_id);

-- ===== notification_logs =====
create table if not exists public.notification_logs (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);
create index if not exists notification_logs_user_idx on public.notification_logs(user_id, created_at desc);

-- ===== RLS =====
alter table public.user_settings enable row level security;
alter table public.custom_tags enable row level security;
alter table public.notification_logs enable row level security;

-- user_settings: own only
drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own on public.user_settings
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own on public.user_settings
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own on public.user_settings
  for update to authenticated using (auth.uid() = user_id);

-- custom_tags: own only
drop policy if exists custom_tags_select_own on public.custom_tags;
create policy custom_tags_select_own on public.custom_tags
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists custom_tags_insert_own on public.custom_tags;
create policy custom_tags_insert_own on public.custom_tags
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists custom_tags_delete_own on public.custom_tags;
create policy custom_tags_delete_own on public.custom_tags
  for delete to authenticated using (auth.uid() = user_id);

-- notification_logs: own only
drop policy if exists notification_logs_select_own on public.notification_logs;
create policy notification_logs_select_own on public.notification_logs
  for select to authenticated using (auth.uid() = user_id);

-- ===== RPC Functions =====

-- upsert_user_settings: merge new settings into existing
drop function if exists public.upsert_user_settings(uuid, jsonb);
create or replace function public.upsert_user_settings(
  p_user_id uuid,
  p_settings jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing jsonb;
  v_merged jsonb;
begin
  if auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  select settings into v_existing from public.user_settings where user_id = p_user_id;

  if v_existing is null then
    v_merged = p_settings;
    insert into public.user_settings (user_id, settings) values (p_user_id, v_merged);
  else
    v_merged = v_existing || p_settings;
    update public.user_settings set settings = v_merged, updated_at = now() where user_id = p_user_id;
  end if;

  return v_merged;
end;
$$;

-- get_user_settings
drop function if exists public.get_user_settings(uuid);
create or replace function public.get_user_settings(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select settings from public.user_settings where user_id = p_user_id;
$$;

-- add_custom_tag
drop function if exists public.add_custom_tag(uuid, text);
create or replace function public.add_custom_tag(
  p_user_id uuid,
  p_name text
)
returns public.custom_tags
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tag public.custom_tags;
begin
  if auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  if trim(p_name) = '' then
    raise exception 'Tag name cannot be empty';
  end if;

  insert into public.custom_tags (user_id, name)
  values (p_user_id, trim(p_name))
  returning * into v_tag;

  return v_tag;
end;
$$;

-- delete_custom_tag
drop function if exists public.delete_custom_tag(text);
create or replace function public.delete_custom_tag(p_tag_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from public.custom_tags where id = p_tag_id;

  if v_user_id is null then
    raise exception 'Tag not found';
  end if;

  if auth.uid() <> v_user_id then
    raise exception 'Not authorized';
  end if;

  delete from public.custom_tags where id = p_tag_id;
end;
$$;

-- log_notification: security definer, for Cloudflare Function use
drop function if exists public.log_notification(uuid, text, text, text, text);
create or replace function public.log_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_logs (user_id, type, title, body, status)
  values (p_user_id, p_type, p_title, p_body, p_status);
end;
$$;

-- ===== Grants =====
revoke all on function public.upsert_user_settings(uuid, jsonb) from anon;
grant execute on function public.upsert_user_settings(uuid, jsonb) to authenticated;

revoke all on function public.get_user_settings(uuid) from anon;
grant execute on function public.get_user_settings(uuid) to authenticated;

revoke all on function public.add_custom_tag(uuid, text) from anon;
grant execute on function public.add_custom_tag(uuid, text) to authenticated;

revoke all on function public.delete_custom_tag(text) from anon;
grant execute on function public.delete_custom_tag(text) to authenticated;

revoke all on function public.log_notification(uuid, text, text, text, text) from anon;
grant execute on function public.log_notification(uuid, text, text, text, text) to authenticated;
