-- Migration: 003_optimize_balance_recalc.sql
-- 优化：用窗口函数替代 PL/pgSQL FOR 循环重算 balance_after
-- 原 002 迁移中的 update_transaction / delete_transaction 使用逐行 UPDATE，
-- 改为单条 UPDATE ... FROM 子查询，性能从 O(n^2) 降到 O(n log n)

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
  v_final_balance integer;
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

  -- 2. 窗口函数一次性重算该账户所有流水的 balance_after
  with recalculated as (
    select
      id,
      sum(case when type = 'deposit' then amount else -amount end)
        over (order by transaction_date, id) as new_balance
    from public.transactions
    where account_id = v_old.account_id
  )
  update public.transactions t
  set balance_after = r.new_balance
  from recalculated r
  where t.id = r.id;

  -- 3. 取最终余额更新账户和目标
  select sum(case when type = 'deposit' then amount else -amount end)
  into v_final_balance
  from public.transactions
  where account_id = v_old.account_id;

  update public.accounts
  set current_balance = coalesce(v_final_balance, 0)
  where id = v_old.account_id;

  update public.goals
  set current_amount = coalesce(v_final_balance, 0)
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
  v_final_balance integer;
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

  -- 2. 窗口函数一次性重算该账户所有流水的 balance_after
  with recalculated as (
    select
      id,
      sum(case when type = 'deposit' then amount else -amount end)
        over (order by transaction_date, id) as new_balance
    from public.transactions
    where account_id = v_old.account_id
  )
  update public.transactions t
  set balance_after = r.new_balance
  from recalculated r
  where t.id = r.id;

  -- 3. 取最终余额更新账户和目标
  select sum(case when type = 'deposit' then amount else -amount end)
  into v_final_balance
  from public.transactions
  where account_id = v_old.account_id;

  update public.accounts
  set current_balance = coalesce(v_final_balance, 0)
  where id = v_old.account_id;

  update public.goals
  set current_amount = coalesce(v_final_balance, 0)
  where account_id = v_old.account_id;
end;
$$;
