-- Live affiliate metrics for dashboard tier progression
-- Provides SQL-backed counts/earnings in one RPC call.

create or replace function public.get_affiliate_live_metrics(
  p_affiliate_id bigint,
  p_affiliate_code text
)
returns table (
  total_recruits integer,
  active_traders integer,
  pending_traders integer,
  lifetime_lots numeric,
  this_month_earnings numeric,
  last_month_earnings numeric,
  pending_earnings numeric,
  paid_earnings numeric,
  total_earnings numeric,
  link_clicks integer,
  current_tier text,
  next_tier text,
  traders_to_next integer,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_recruits integer := 0;
  v_active_traders integer := 0;
  v_pending_traders integer := 0;
  v_lifetime_lots numeric := 0;
  v_link_clicks integer := 0;
  v_total_earnings numeric := 0;
  v_pending_earnings numeric := 0;
  v_paid_earnings numeric := 0;
  v_this_month_earnings numeric := 0;
  v_last_month_earnings numeric := 0;
  v_current_tier text := 'Starter';
  v_next_tier text := null;
  v_traders_to_next integer := 0;
begin
  select
    count(*)::int,
    count(*) filter (where coalesce(task_broker_verified, false) = true or length(coalesce(mt5_id::text, '')) > 3)::int,
    count(*) filter (where not (coalesce(task_broker_verified, false) = true or length(coalesce(mt5_id::text, '')) > 3))::int,
    coalesce(sum(coalesce(total_lots_traded, 0)), 0)
  into
    v_total_recruits,
    v_active_traders,
    v_pending_traders,
    v_lifetime_lots
  from public.recruits
  where referred_by_code = p_affiliate_code;

  select
    coalesce(link_clicks, 0),
    coalesce(total_earnings, 0),
    coalesce(pending_earnings, 0),
    coalesce(paid_earnings, 0),
    coalesce(affiliate_tier, 'Starter')
  into
    v_link_clicks,
    v_total_earnings,
    v_pending_earnings,
    v_paid_earnings,
    v_current_tier
  from public.recruits
  where id = p_affiliate_id
  limit 1;

  -- Use earnings ledger when available.
  if to_regclass('public.affiliate_earnings') is not null then
    execute $q$
      select coalesce(sum(amount), 0)
      from public.affiliate_earnings
      where affiliate_id = $1
        and transaction_type in ('commission', 'bonus')
        and created_at >= date_trunc('month', now())
    $q$ into v_this_month_earnings using p_affiliate_id;

    execute $q$
      select coalesce(sum(amount), 0)
      from public.affiliate_earnings
      where affiliate_id = $1
        and transaction_type in ('commission', 'bonus')
        and created_at >= date_trunc('month', now() - interval '1 month')
        and created_at < date_trunc('month', now())
    $q$ into v_last_month_earnings using p_affiliate_id;
  end if;

  if v_current_tier is null or v_current_tier = '' then
    select calculate_affiliate_tier(v_active_traders) into v_current_tier;
  end if;

  select name,
         greatest(min_traders - v_active_traders, 0)
  into v_next_tier, v_traders_to_next
  from public.affiliate_tiers
  where min_traders > v_active_traders
  order by min_traders asc
  limit 1;

  return query
  select
    v_total_recruits,
    v_active_traders,
    v_pending_traders,
    v_lifetime_lots,
    coalesce(v_this_month_earnings, 0),
    coalesce(v_last_month_earnings, 0),
    v_pending_earnings,
    v_paid_earnings,
    v_total_earnings,
    v_link_clicks,
    v_current_tier,
    v_next_tier,
    coalesce(v_traders_to_next, 0),
    now();
end;
$$;

grant execute on function public.get_affiliate_live_metrics(bigint, text) to anon;
grant execute on function public.get_affiliate_live_metrics(bigint, text) to authenticated;
grant execute on function public.get_affiliate_live_metrics(bigint, text) to service_role;
