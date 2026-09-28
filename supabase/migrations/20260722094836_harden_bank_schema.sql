-- Harden the bank-only schema and keep all money values as positive integer yuan.

-- Prevent implicit RPC exposure for both existing and future functions.
revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke execute on functions from public, anon;
alter default privileges in schema stefbank_private revoke execute on functions from public, anon, authenticated;

revoke all on schema stefbank_private from public, anon;
grant usage on schema stefbank_private to authenticated;
revoke execute on all functions in schema stefbank_private from public, anon, authenticated;

-- Retired settings/tag/notification RPCs must not remain callable while their
-- data is being archived and removed in the cleanup migration.
revoke execute on function public.add_custom_tag(uuid, text) from public, anon, authenticated;
revoke execute on function public.delete_custom_tag(text) from public, anon, authenticated;
revoke execute on function public.get_user_settings(uuid) from public, anon, authenticated;
revoke execute on function public.log_notification(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.upsert_user_settings(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Remove superseded private overloads left behind by the review-note migration.
drop function if exists stefbank_private.approve_withdraw_request(text);
drop function if exists stefbank_private.reject_request(text);

-- The manager-selected date is now part of manual transaction creation.
drop function if exists public.create_manual_transaction(
  text,
  public.transaction_type,
  integer,
  text,
  text
);
drop function if exists stefbank_private.create_manual_transaction(
  text,
  public.transaction_type,
  integer,
  text,
  text
);

create function stefbank_private.create_manual_transaction(
  p_account_id text,
  p_type public.transaction_type,
  p_amount integer,
  p_category text,
  p_description text,
  p_transaction_date date
)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.accounts%rowtype;
  v_next_balance integer;
  v_transaction public.transactions%rowtype;
begin
  perform stefbank_private.require_manager_for_account(p_account_id);

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be a positive integer yuan value';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id
  for update;

  if not found then
    raise exception 'Account not found';
  end if;

  if p_type = 'deposit' then
    v_next_balance := v_account.current_balance + p_amount;
  else
    if p_amount > v_account.current_balance then
      raise exception 'Insufficient balance';
    end if;
    v_next_balance := v_account.current_balance - p_amount;
  end if;

  insert into public.transactions (
    account_id,
    type,
    amount,
    balance_after,
    category,
    description,
    transaction_date,
    status,
    created_by
  ) values (
    p_account_id,
    p_type,
    p_amount,
    v_next_balance,
    coalesce(nullif(trim(p_category), ''), case when p_type = 'deposit' then '存款' else '其他' end),
    coalesce(nullif(trim(p_description), ''), case when p_type = 'deposit' then '行长手动存入' else '行长手动取出' end),
    coalesce(p_transaction_date, current_date),
    'confirmed',
    auth.uid()
  ) returning * into v_transaction;

  -- A backdated row changes every later running balance. The non-negative
  -- balance constraint atomically rejects an invalid historical withdrawal.
  with recalculated as (
    select
      id,
      sum(case when type = 'deposit' then amount else -amount end)
        over (order by transaction_date, created_at, id) as new_balance
    from public.transactions
    where account_id = p_account_id
  )
  update public.transactions as transaction
  set balance_after = recalculated.new_balance
  from recalculated
  where transaction.id = recalculated.id;

  update public.accounts
  set current_balance = v_next_balance
  where id = p_account_id;

  update public.goals
  set current_amount = v_next_balance
  where account_id = p_account_id;

  select * into v_transaction
  from public.transactions
  where id = v_transaction.id;

  return v_transaction;
end;
$$;

create function public.create_manual_transaction(
  p_account_id text,
  p_type public.transaction_type,
  p_amount integer,
  p_category text,
  p_description text,
  p_transaction_date date
)
returns public.transactions
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.create_manual_transaction(
    p_account_id,
    p_type,
    p_amount,
    p_category,
    p_description,
    p_transaction_date
  );
$$;

-- Bound user-controlled text at the database boundary as well as the API.
alter table public.requests drop constraint if exists requests_category_length;
alter table public.requests add constraint requests_category_length check (char_length(category) between 1 and 100);
alter table public.requests drop constraint if exists requests_urgency_length;
alter table public.requests add constraint requests_urgency_length check (urgency is null or char_length(urgency) <= 50);
alter table public.requests drop constraint if exists requests_payment_method_length;
alter table public.requests add constraint requests_payment_method_length check (char_length(payment_method) between 1 and 100);
alter table public.requests drop constraint if exists requests_note_length;
alter table public.requests add constraint requests_note_length check (char_length(note) between 1 and 500);
alter table public.requests drop constraint if exists requests_review_note_length;
alter table public.requests add constraint requests_review_note_length check (review_note is null or char_length(review_note) <= 120);
alter table public.transactions drop constraint if exists transactions_category_length;
alter table public.transactions add constraint transactions_category_length check (char_length(category) between 1 and 100);
alter table public.transactions drop constraint if exists transactions_description_length;
alter table public.transactions add constraint transactions_description_length check (char_length(description) between 1 and 500);
alter table public.goals drop constraint if exists goals_title_length;
alter table public.goals add constraint goals_title_length check (char_length(title) between 1 and 100);

-- Index every bank foreign key used for authorization and cleanup joins.
create index if not exists requests_requester_id_idx on public.requests(requester_id);
create index if not exists requests_reviewed_by_idx on public.requests(reviewed_by);
create index if not exists requests_completed_by_idx on public.requests(completed_by);
create index if not exists requests_rejected_by_idx on public.requests(rejected_by);
create index if not exists transactions_created_by_idx on public.transactions(created_by);

-- Make the authenticated check explicit and cache stable auth helpers once per
-- statement, as recommended by Supabase for RLS performance.
drop policy if exists "profiles_select_own_or_same_account_manager" on public.profiles;
create policy "profiles_select_own_or_same_account_manager"
on public.profiles for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    id = (select auth.uid())
    or (select stefbank_private.is_manager((select auth.uid())))
  )
);

drop policy if exists "accounts_select_members" on public.accounts;
create policy "accounts_select_members"
on public.accounts for select to authenticated
using (
  (select auth.uid()) is not null
  and (select stefbank_private.is_account_member(id, (select auth.uid())))
);

drop policy if exists "account_members_select_self_or_manager" on public.account_members;
create policy "account_members_select_self_or_manager"
on public.account_members for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select stefbank_private.is_manager((select auth.uid())))
  )
);

drop policy if exists "goals_select_account_members" on public.goals;
create policy "goals_select_account_members"
on public.goals for select to authenticated
using (
  (select auth.uid()) is not null
  and (select stefbank_private.is_account_member(account_id, (select auth.uid())))
);

drop policy if exists "requests_select_account_members" on public.requests;
create policy "requests_select_account_members"
on public.requests for select to authenticated
using (
  (select auth.uid()) is not null
  and (select stefbank_private.is_account_member(account_id, (select auth.uid())))
);

drop policy if exists "requests_insert_depositor_pending" on public.requests;
create policy "requests_insert_depositor_pending"
on public.requests for insert to authenticated
with check (
  (select auth.uid()) is not null
  and requester_id = (select auth.uid())
  and status = 'pending'
  and (select stefbank_private.account_member_role(account_id, (select auth.uid()))) = 'depositor'
);

drop policy if exists "transactions_select_account_members" on public.transactions;
create policy "transactions_select_account_members"
on public.transactions for select to authenticated
using (
  (select auth.uid()) is not null
  and (select stefbank_private.is_account_member(account_id, (select auth.uid())))
);

-- Only the intended public wrappers and their private implementations are callable.
grant execute on function public.submit_request(text, public.transaction_type, integer, text, text, text, text) to authenticated;
grant execute on function public.approve_withdraw_request(text, text) to authenticated;
grant execute on function public.reject_request(text, text) to authenticated;
grant execute on function public.complete_withdraw_request(text) to authenticated;
grant execute on function public.confirm_deposit_request(text) to authenticated;
grant execute on function public.create_manual_transaction(text, public.transaction_type, integer, text, text, date) to authenticated;
grant execute on function public.update_transaction(text, public.transaction_type, integer, text, text, date) to authenticated;
grant execute on function public.delete_transaction(text) to authenticated;
grant execute on function public.delete_request(text) to authenticated;
grant execute on function public.upsert_goal(text, text, integer, text, jsonb) to authenticated;
grant execute on function public.delete_goal(text) to authenticated;

grant execute on function stefbank_private.submit_request(text, public.transaction_type, integer, text, text, text, text) to authenticated;
grant execute on function stefbank_private.approve_withdraw_request(text, text) to authenticated;
grant execute on function stefbank_private.reject_request(text, text) to authenticated;
grant execute on function stefbank_private.complete_withdraw_request(text) to authenticated;
grant execute on function stefbank_private.confirm_deposit_request(text) to authenticated;
grant execute on function stefbank_private.create_manual_transaction(text, public.transaction_type, integer, text, text, date) to authenticated;
grant execute on function stefbank_private.update_transaction(text, public.transaction_type, integer, text, text, date) to authenticated;
grant execute on function stefbank_private.delete_transaction(text) to authenticated;
grant execute on function stefbank_private.delete_request(text) to authenticated;
grant execute on function stefbank_private.upsert_goal(text, text, integer, text, jsonb) to authenticated;
grant execute on function stefbank_private.delete_goal(text) to authenticated;
grant execute on function stefbank_private.is_manager(uuid) to authenticated;
grant execute on function stefbank_private.is_account_member(text, uuid) to authenticated;
grant execute on function stefbank_private.account_member_role(text, uuid) to authenticated;
