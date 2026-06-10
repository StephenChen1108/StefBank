-- Migration: 002_stefbank_edit_transaction.sql
-- 新增 update_transaction 和 delete_transaction RPC，支持管理员编辑/删除流水
-- 使用全量重算策略：按 (transaction_date, id) 排序，从余额 0 开始重算所有流水

-- ========== stefbank_private.update_transaction ==========
create or replace function stefbank_private.update_transaction(
  p_transaction_id text,
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
  v_old public.transactions%rowtype;
  v_balance integer := 0;
  v_row record;
  v_transaction public.transactions%rowtype;
begin
  select * into v_old
  from public.transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  perform stefbank_private.require_manager_for_account(v_old.account_id);

  -- 1. 更新本条（不写 balance_after，后面全量重算）
  update public.transactions
  set type = p_type,
      amount = p_amount,
      category = coalesce(nullif(trim(p_category), ''), case when p_type = 'deposit' then '存款' else '其他' end),
      description = coalesce(nullif(trim(p_description), ''), case when p_type = 'deposit' then '行长手动存入' else '行长手动取出' end),
      transaction_date = p_transaction_date
  where id = p_transaction_id
  returning * into v_transaction;

  -- 2. 全量重算该账户所有流水的 balance_after
  for v_row in
    select * from public.transactions
    where account_id = v_old.account_id
    order by transaction_date, id
  loop
    if v_row.type = 'deposit' then
      v_balance := v_balance + v_row.amount;
    else
      v_balance := v_balance - v_row.amount;
    end if;

    update public.transactions
    set balance_after = v_balance
    where id = v_row.id;
  end loop;

  -- 3. 更新账户余额
  update public.accounts
  set current_balance = v_balance
  where id = v_old.account_id;

  update public.goals
  set current_amount = v_balance
  where account_id = v_old.account_id;

  return v_transaction;
end;
$$;

-- ========== stefbank_private.delete_transaction ==========
create or replace function stefbank_private.delete_transaction(p_transaction_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.transactions%rowtype;
  v_balance integer := 0;
  v_row record;
begin
  select * into v_old
  from public.transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  perform stefbank_private.require_manager_for_account(v_old.account_id);

  -- 1. 删除
  delete from public.transactions where id = p_transaction_id;

  -- 2. 全量重算该账户所有流水的 balance_after
  for v_row in
    select * from public.transactions
    where account_id = v_old.account_id
    order by transaction_date, id
  loop
    if v_row.type = 'deposit' then
      v_balance := v_balance + v_row.amount;
    else
      v_balance := v_balance - v_row.amount;
    end if;

    update public.transactions
    set balance_after = v_balance
    where id = v_row.id;
  end loop;

  -- 3. 更新账户余额
  update public.accounts
  set current_balance = v_balance
  where id = v_old.account_id;

  update public.goals
  set current_amount = v_balance
  where account_id = v_old.account_id;
end;
$$;

-- ========== public wrappers ==========
create or replace function public.update_transaction(
  p_transaction_id text,
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
  select * from stefbank_private.update_transaction($1, $2, $3, $4, $5, $6);
$$;

create or replace function public.delete_transaction(p_transaction_id text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select stefbank_private.delete_transaction($1);
$$;

-- ========== grants ==========
grant execute on function public.update_transaction(text, public.transaction_type, integer, text, text, date) to authenticated;
revoke execute on function public.update_transaction(text, public.transaction_type, integer, text, text, date) from public, anon;

grant execute on function public.delete_transaction(text) to authenticated;
revoke execute on function public.delete_transaction(text) from public, anon;
