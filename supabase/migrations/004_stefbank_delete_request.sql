-- Migration: 004_stefbank_delete_request.sql
-- 新增 delete_request RPC，允许行长删除审批记录

-- ========== stefbank_private.delete_request ==========
create or replace function stefbank_private.delete_request(p_request_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests%rowtype;
  v_has_transaction boolean;
begin
  select * into v_request
  from public.requests
  where id = p_request_id;

  if not found then
    raise exception 'Request not found';
  end if;

  perform stefbank_private.require_manager_for_account(v_request.account_id);

  -- 检查是否有关联流水，有则不允许删除
  select exists(
    select 1 from public.transactions where request_id = p_request_id
  ) into v_has_transaction;

  if v_has_transaction then
    raise exception '该申请已产生流水记录，无法删除。请先删除对应流水';
  end if;

  delete from public.requests where id = p_request_id;
end;
$$;

-- ========== public wrapper ==========
create or replace function public.delete_request(p_request_id text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select stefbank_private.delete_request(p_request_id);
$$;

-- ========== grants ==========
grant execute on function public.delete_request(text) to authenticated;
revoke execute on function public.delete_request(text) from public, anon;
