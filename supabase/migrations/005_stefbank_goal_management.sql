-- 005: Goal management — add goal_type, metadata; upsert/delete goal RPCs
-- Goals are managed by the depositor (not the manager)

alter table public.goals
  add column if not exists goal_type text not null default 'custom',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create or replace function stefbank_private.require_depositor_for_account(p_account_id text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or stefbank_private.account_member_role(p_account_id, auth.uid()) <> 'depositor'
  then
    raise exception 'Only the depositor can manage savings goals';
  end if;
end;
$$;

create or replace function stefbank_private.upsert_goal(
  p_account_id text,
  p_title text,
  p_target_amount integer,
  p_goal_type text,
  p_metadata jsonb
)
returns public.goals
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_goal public.goals%rowtype;
  v_current_balance integer;
begin
  perform stefbank_private.require_depositor_for_account(p_account_id);

  if p_title is null or trim(p_title) = '' then
    raise exception 'Goal title is required';
  end if;

  if p_target_amount is null or p_target_amount <= 0 then
    raise exception 'Target amount must be greater than zero';
  end if;

  select current_balance into v_current_balance
  from public.accounts
  where id = p_account_id;

  if not found then
    raise exception 'Account not found';
  end if;

  insert into public.goals (account_id, title, target_amount, current_amount, goal_type, metadata)
  values (
    p_account_id,
    trim(p_title),
    p_target_amount,
    v_current_balance,
    coalesce(nullif(trim(p_goal_type), ''), 'custom'),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (account_id) do update
    set title = excluded.title,
        target_amount = excluded.target_amount,
        goal_type = excluded.goal_type,
        metadata = excluded.metadata
  returning * into v_goal;

  return v_goal;
end;
$$;

create or replace function stefbank_private.delete_goal(p_account_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform stefbank_private.require_depositor_for_account(p_account_id);

  delete from public.goals where account_id = p_account_id;
end;
$$;

create or replace function public.upsert_goal(
  p_account_id text,
  p_title text,
  p_target_amount integer,
  p_goal_type text,
  p_metadata jsonb
)
returns public.goals
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.upsert_goal(
    p_account_id,
    p_title,
    p_target_amount,
    p_goal_type,
    p_metadata
  );
$$;

create or replace function public.delete_goal(p_account_id text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select stefbank_private.delete_goal(p_account_id);
$$;

revoke execute on function public.upsert_goal(text, text, integer, text, jsonb) from public, anon;
revoke execute on function public.delete_goal(text) from public, anon;

grant execute on function public.upsert_goal(text, text, integer, text, jsonb) to authenticated;
grant execute on function public.delete_goal(text) to authenticated;
