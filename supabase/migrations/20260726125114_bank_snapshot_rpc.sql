-- Authenticated single-call bank snapshot.

create function stefbank_private.get_bank_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_account_id text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select member.account_id
  into v_account_id
  from public.account_members as member
  where member.user_id = v_user_id
  order by member.account_id
  limit 1;

  if v_account_id is null then
    raise exception 'Account membership required';
  end if;

  return jsonb_build_object(
    'user', (
      select to_jsonb(profile_row)
      from (
        select id, username, full_name, display_name, role, avatar_url
        from public.profiles
        where id = v_user_id
      ) as profile_row
    ),
    'accountId', v_account_id,
    'account', (
      select to_jsonb(account_row)
      from (
        select id, name, current_balance, updated_at
        from public.accounts
        where id = v_account_id
      ) as account_row
    ),
    'goal', (
      select to_jsonb(goal_row)
      from (
        select id, title, target_amount, current_amount, goal_type, metadata
        from public.goals
        where account_id = v_account_id
        limit 1
      ) as goal_row
    ),
    'transactions', coalesce(
      (
        select jsonb_agg(
          to_jsonb(transaction_row)
          order by transaction_row.transaction_date desc,
                   transaction_row.created_at desc
        )
        from (
          select id, type, amount, balance_after, category, description,
                 transaction_date, status, created_at
          from public.transactions
          where account_id = v_account_id
        ) as transaction_row
      ),
      '[]'::jsonb
    ),
    'requests', coalesce(
      (
        select jsonb_agg(
          to_jsonb(request_row)
          order by request_row.created_at desc
        )
        from (
          select id, request_type, amount, category, urgency, payment_method,
                 note, review_note, status, created_at
          from public.requests
          where account_id = v_account_id
        ) as request_row
      ),
      '[]'::jsonb
    )
  );
end;
$$;

create function public.get_bank_snapshot()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select stefbank_private.get_bank_snapshot();
$$;

revoke all on function stefbank_private.get_bank_snapshot() from public, anon;
revoke all on function public.get_bank_snapshot() from public, anon;
grant execute on function stefbank_private.get_bank_snapshot() to authenticated, service_role;
grant execute on function public.get_bank_snapshot() to authenticated, service_role;
