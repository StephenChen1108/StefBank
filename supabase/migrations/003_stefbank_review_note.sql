-- Migration: 003_stefbank_review_note.sql
-- 新增 review_note 字段，行长审批时必须填写留言

-- ========== 1. 新增 review_note 列 ==========
alter table public.requests
  add column if not exists review_note text;

-- ========== 2. 更新 approve_withdraw_request 接受留言 ==========
create or replace function stefbank_private.approve_withdraw_request(
  p_request_id text,
  p_review_note text
)
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
      review_note = coalesce(nullif(trim(p_review_note), ''), '行长已批准'),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

-- ========== 3. 更新 reject_request 接受留言 ==========
create or replace function stefbank_private.reject_request(
  p_request_id text,
  p_review_note text
)
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
      review_note = coalesce(nullif(trim(p_review_note), ''), '行长已驳回'),
      rejected_by = auth.uid(),
      rejected_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

-- ========== 4. 更新 public wrapper ==========
drop function if exists public.approve_withdraw_request(text);
create or replace function public.approve_withdraw_request(
  p_request_id text,
  p_review_note text
)
returns public.requests
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.approve_withdraw_request(p_request_id, p_review_note);
$$;

drop function if exists public.reject_request(text);
create or replace function public.reject_request(
  p_request_id text,
  p_review_note text
)
returns public.requests
language sql
security invoker
set search_path = ''
as $$
  select * from stefbank_private.reject_request(p_request_id, p_review_note);
$$;

-- ========== 5. grants ==========
grant execute on function public.approve_withdraw_request(text, text) to authenticated;
revoke execute on function public.approve_withdraw_request(text, text) from public, anon;

grant execute on function public.reject_request(text, text) to authenticated;
revoke execute on function public.reject_request(text, text) from public, anon;
