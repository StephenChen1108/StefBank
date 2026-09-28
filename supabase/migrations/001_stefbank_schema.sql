create extension if not exists pgcrypto;

create schema if not exists stefbank_private;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('manager', 'depositor');
  end if;

  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('deposit', 'withdraw');
  end if;

  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type public.request_status as enum ('pending', 'approved', 'completed', 'rejected');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username in ('admin', 'depositor')),
  display_name text not null,
  full_name text not null,
  role public.user_role not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  current_balance integer not null default 0 check (current_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_members (
  account_id text not null references public.accounts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);

create table if not exists public.goals (
  id text primary key default gen_random_uuid()::text,
  account_id text not null references public.accounts(id) on delete cascade,
  title text not null,
  target_amount integer not null check (target_amount > 0),
  current_amount integer not null default 0 check (current_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.requests (
  id text primary key default gen_random_uuid()::text,
  account_id text not null references public.accounts(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete restrict,
  request_type public.transaction_type not null,
  amount integer not null check (amount > 0),
  category text not null,
  urgency text,
  payment_method text not null,
  note text not null,
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete set null,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key default gen_random_uuid()::text,
  account_id text not null references public.accounts(id) on delete cascade,
  request_id text references public.requests(id) on delete restrict,
  type public.transaction_type not null,
  amount integer not null check (amount > 0),
  balance_after integer not null check (balance_after >= 0),
  category text not null,
  description text not null,
  transaction_date date not null default current_date,
  status text not null default 'confirmed' check (status in ('confirmed', 'pending')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists transactions_request_id_unique
  on public.transactions(request_id)
  where request_id is not null;

create unique index if not exists goals_account_id_unique on public.goals(account_id);
create index if not exists requests_account_created_idx on public.requests(account_id, created_at desc);
create index if not exists transactions_account_date_idx on public.transactions(account_id, transaction_date desc, created_at desc);
create index if not exists account_members_user_idx on public.account_members(user_id);

create or replace function stefbank_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function stefbank_private.set_updated_at();

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function stefbank_private.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function stefbank_private.set_updated_at();

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
before update on public.requests
for each row execute function stefbank_private.set_updated_at();

create or replace function stefbank_private.is_manager(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'manager'
  );
$$;

create or replace function stefbank_private.is_account_member(p_account_id text, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.account_members
    where account_id = p_account_id
      and user_id = p_user_id
  );
$$;

create or replace function stefbank_private.account_member_role(p_account_id text, p_user_id uuid)
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.account_members
  where account_id = p_account_id
    and user_id = p_user_id
  limit 1;
$$;

create or replace function stefbank_private.require_manager_for_account(p_account_id text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or stefbank_private.account_member_role(p_account_id, auth.uid()) <> 'manager'
  then
    raise exception 'Only the bank manager can do this';
  end if;
end;
$$;

create or replace function stefbank_private.submit_request(
  p_account_id text,
  p_request_type public.transaction_type,
  p_amount integer,
  p_category text,
  p_urgency text,
  p_payment_method text,
  p_note text
)
returns public.requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_account public.accounts%rowtype;
  v_request public.requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first';
  end if;

  select stefbank_private.account_member_role(p_account_id, auth.uid()) into v_role;

  if v_role <> 'depositor' then
    raise exception 'Only the depositor can submit requests';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id;

  if not found then
    raise exception 'Account not found';
  end if;

  if p_request_type = 'withdraw' and p_amount > v_account.current_balance then
    raise exception 'Insufficient balance';
  end if;

  insert into public.requests (
    account_id,
    requester_id,
    request_type,
    amount,
    category,
    urgency,
    payment_method,
    note,
    status
  )
  values (
    p_account_id,
    auth.uid(),
    p_request_type,
    p_amount,
    coalesce(nullif(trim(p_category), ''), case when p_request_type = 'deposit' then '存款' else '其他' end),
    nullif(trim(coalesce(p_urgency, '')), ''),
    coalesce(nullif(trim(p_payment_method), ''), '微信'),
    coalesce(nullif(trim(p_note), ''), '未填写备注'),
    'pending'
  )
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function stefbank_private.approve_withdraw_request(p_request_id text)
returns public.requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests%rowtype;
begin
  select * into v_request
  from public.requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  perform stefbank_private.require_manager_for_account(v_request.account_id);

  if v_request.request_type <> 'withdraw' then
    raise exception 'Only withdrawal requests can be approved';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request has already been handled';
  end if;

  update public.requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function stefbank_private.reject_request(p_request_id text)
returns public.requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests%rowtype;
begin
  select * into v_request
  from public.requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  perform stefbank_private.require_manager_for_account(v_request.account_id);

  if v_request.status <> 'pending' then
    raise exception 'Only pending requests can be rejected';
  end if;

  update public.requests
  set status = 'rejected',
      rejected_by = auth.uid(),
      rejected_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function stefbank_private.confirm_deposit_request(p_request_id text)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests%rowtype;
  v_account public.accounts%rowtype;
  v_next_balance integer;
  v_transaction public.transactions%rowtype;
begin
  select * into v_request
  from public.requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  perform stefbank_private.require_manager_for_account(v_request.account_id);

  if v_request.request_type <> 'deposit' then
    raise exception 'Only deposit requests can be confirmed here';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Deposit request has already been handled';
  end if;

  select * into v_account
  from public.accounts
  where id = v_request.account_id
  for update;

  v_next_balance := v_account.current_balance + v_request.amount;

  update public.accounts
  set current_balance = v_next_balance
  where id = v_account.id;

  update public.goals
  set current_amount = v_next_balance
  where account_id = v_account.id;

  insert into public.transactions (
    account_id,
    request_id,
    type,
    amount,
    balance_after,
    category,
    description,
    transaction_date,
    status,
    created_by
  )
  values (
    v_request.account_id,
    v_request.id,
    'deposit',
    v_request.amount,
    v_next_balance,
    v_request.category,
    '储户存款已确认到账',
    current_date,
    'confirmed',
    auth.uid()
  )
  returning * into v_transaction;

  update public.requests
  set status = 'completed',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      completed_by = auth.uid(),
      completed_at = now()
  where id = v_request.id;

  return v_transaction;
exception
  when unique_violation then
    raise exception 'Request has already created a transaction';
end;
$$;

create or replace function stefbank_private.complete_withdraw_request(p_request_id text)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests%rowtype;
  v_account public.accounts%rowtype;
  v_next_balance integer;
  v_transaction public.transactions%rowtype;
begin
  select * into v_request
  from public.requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  perform stefbank_private.require_manager_for_account(v_request.account_id);

  if v_request.request_type <> 'withdraw' then
    raise exception 'Only withdrawal requests can be completed here';
  end if;

  if v_request.status <> 'approved' then
    raise exception 'Withdrawal must be approved before completion';
  end if;

  select * into v_account
  from public.accounts
  where id = v_request.account_id
  for update;

  if v_request.amount > v_account.current_balance then
    raise exception 'Insufficient balance';
  end if;

  v_next_balance := v_account.current_balance - v_request.amount;

  update public.accounts
  set current_balance = v_next_balance
  where id = v_account.id;

  update public.goals
  set current_amount = v_next_balance
  where account_id = v_account.id;

  insert into public.transactions (
    account_id,
    request_id,
    type,
    amount,
    balance_after,
    category,
    description,
    transaction_date,
    status,
    created_by
  )
  values (
    v_request.account_id,
    v_request.id,
    'withdraw',
    v_request.amount,
    v_next_balance,
    v_request.category,
    '取款申请已打款',
    current_date,
    'confirmed',
    auth.uid()
  )
  returning * into v_transaction;

  update public.requests
  set status = 'completed',
      completed_by = auth.uid(),
      completed_at = now()
  where id = v_request.id;

  return v_transaction;
exception
  when unique_violation then
    raise exception 'Request has already created a transaction';
end;
$$;

create or replace function stefbank_private.create_manual_transaction(
  p_account_id text,
  p_type public.transaction_type,
  p_amount integer,
  p_category text,
  p_description text
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
    raise exception 'Amount must be greater than zero';
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

  update public.accounts
  set current_balance = v_next_balance
  where id = p_account_id;

  update public.goals
  set current_amount = v_next_balance
  where account_id = p_account_id;

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
  )
  values (
    p_account_id,
    p_type,
    p_amount,
    v_next_balance,
    coalesce(nullif(trim(p_category), ''), case when p_type = 'deposit' then '存款' else '其他' end),
    coalesce(nullif(trim(p_description), ''), case when p_type = 'deposit' then '行长手动存入' else '行长手动取出' end),
    current_date,
    'confirmed',
    auth.uid()
  )
  returning * into v_transaction;

  return v_transaction;
end;
$$;

create or replace function public.submit_request(
  p_account_id text,
  p_request_type public.transaction_type,
  p_amount integer,
  p_category text,
  p_urgency text,
  p_payment_method text,
  p_note text
)
returns public.requests
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.submit_request(
    p_account_id,
    p_request_type,
    p_amount,
    p_category,
    p_urgency,
    p_payment_method,
    p_note
  );
$$;

create or replace function public.approve_withdraw_request(p_request_id text)
returns public.requests
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.approve_withdraw_request(p_request_id);
$$;

create or replace function public.reject_request(p_request_id text)
returns public.requests
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.reject_request(p_request_id);
$$;

create or replace function public.complete_withdraw_request(p_request_id text)
returns public.transactions
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.complete_withdraw_request(p_request_id);
$$;

create or replace function public.confirm_deposit_request(p_request_id text)
returns public.transactions
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.confirm_deposit_request(p_request_id);
$$;

create or replace function public.create_manual_transaction(
  p_account_id text,
  p_type public.transaction_type,
  p_amount integer,
  p_category text,
  p_description text
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
    p_description
  );
$$;

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.account_members enable row level security;
alter table public.goals enable row level security;
alter table public.requests enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles_select_own_or_same_account_manager" on public.profiles;
create policy "profiles_select_own_or_same_account_manager"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or stefbank_private.is_manager(auth.uid())
);

drop policy if exists "accounts_select_members" on public.accounts;
create policy "accounts_select_members"
on public.accounts
for select
to authenticated
using (stefbank_private.is_account_member(id, auth.uid()));

drop policy if exists "account_members_select_self_or_manager" on public.account_members;
create policy "account_members_select_self_or_manager"
on public.account_members
for select
to authenticated
using (user_id = auth.uid() or stefbank_private.is_manager(auth.uid()));

drop policy if exists "goals_select_account_members" on public.goals;
create policy "goals_select_account_members"
on public.goals
for select
to authenticated
using (stefbank_private.is_account_member(account_id, auth.uid()));

drop policy if exists "requests_select_account_members" on public.requests;
create policy "requests_select_account_members"
on public.requests
for select
to authenticated
using (stefbank_private.is_account_member(account_id, auth.uid()));

drop policy if exists "requests_insert_depositor_pending" on public.requests;
create policy "requests_insert_depositor_pending"
on public.requests
for insert
to authenticated
with check (
  requester_id = auth.uid()
  and status = 'pending'
  and stefbank_private.account_member_role(account_id, auth.uid()) = 'depositor'
);

drop policy if exists "transactions_select_account_members" on public.transactions;
create policy "transactions_select_account_members"
on public.transactions
for select
to authenticated
using (stefbank_private.is_account_member(account_id, auth.uid()));

revoke all on schema stefbank_private from public;
grant usage on schema stefbank_private to authenticated;

grant usage on schema public to authenticated;
grant select on public.profiles, public.accounts, public.account_members, public.goals, public.requests, public.transactions to authenticated;
grant insert on public.requests to authenticated;

revoke insert, update, delete on public.accounts from authenticated;
revoke insert, update, delete on public.account_members from authenticated;
revoke insert, update, delete on public.goals from authenticated;
revoke insert, update, delete on public.transactions from authenticated;
revoke update, delete on public.requests from authenticated;

revoke all on public.profiles from anon;
revoke all on public.accounts from anon;
revoke all on public.account_members from anon;
revoke all on public.goals from anon;
revoke all on public.requests from anon;
revoke all on public.transactions from anon;

revoke execute on function public.submit_request(text, public.transaction_type, integer, text, text, text, text) from public, anon;
revoke execute on function public.approve_withdraw_request(text) from public, anon;
revoke execute on function public.reject_request(text) from public, anon;
revoke execute on function public.complete_withdraw_request(text) from public, anon;
revoke execute on function public.confirm_deposit_request(text) from public, anon;
revoke execute on function public.create_manual_transaction(text, public.transaction_type, integer, text, text) from public, anon;

grant execute on function public.submit_request(text, public.transaction_type, integer, text, text, text, text) to authenticated;
grant execute on function public.approve_withdraw_request(text) to authenticated;
grant execute on function public.reject_request(text) to authenticated;
grant execute on function public.complete_withdraw_request(text) to authenticated;
grant execute on function public.confirm_deposit_request(text) to authenticated;
grant execute on function public.create_manual_transaction(text, public.transaction_type, integer, text, text) to authenticated;

grant execute on function stefbank_private.is_manager(uuid) to authenticated;
grant execute on function stefbank_private.is_account_member(text, uuid) to authenticated;
grant execute on function stefbank_private.account_member_role(text, uuid) to authenticated;
