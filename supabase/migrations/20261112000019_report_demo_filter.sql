-- 0019 report_demo_filter (D-14)
-- ADMIN §4.16 requires a "ไม่รวม Demo Data" option on every report (orders.is_demo = false).
-- The draft report_* RPCs had no such parameter. Same logic as 0015, plus an optional
-- p_include_demo (default true = previous behaviour). Old signatures are dropped first so
-- named-argument calls stay unambiguous.

drop function if exists public.report_sales(date, date, text);
drop function if exists public.report_best_sellers(date, date, int);
drop function if exists public.report_category_sales(date, date);
drop function if exists public.report_order_status(date, date);
drop function if exists public.report_customers(date, date, int);

create function public.report_sales(p_from date, p_to date, p_group text default 'day', p_include_demo boolean default true)
returns table (period date, order_count bigint, sales numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  if p_group not in ('day', 'month') then raise exception 'INVALID_GROUP'; end if;
  return query
    select date_trunc(p_group, o.created_at at time zone 'Asia/Bangkok')::date, count(*), sum(o.total_amount)
      from public.orders o
     where o.status in ('paid','shipped','completed')
       and (p_include_demo or not o.is_demo)
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by 1 order by 1;
end $$;

create function public.report_best_sellers(p_from date, p_to date, p_limit int default 10, p_include_demo boolean default true)
returns table (product_id uuid, sku text, name text, quantity bigint, sales numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  return query
    select oi.product_id, max(oi.product_sku), max(oi.product_name), sum(oi.quantity)::bigint, sum(oi.line_total)
      from public.order_items oi join public.orders o on o.id = oi.order_id
     where o.status in ('paid','shipped','completed')
       and (p_include_demo or not o.is_demo)
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by oi.product_id order by 4 desc, 5 desc limit p_limit;
end $$;

create function public.report_category_sales(p_from date, p_to date, p_include_demo boolean default true)
returns table (category_id uuid, category_name text, quantity bigint, sales numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  return query
    select c.id, c.name, sum(oi.quantity)::bigint, sum(oi.line_total)
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      join public.products p on p.id = oi.product_id
      join public.categories c on c.id = p.category_id
     where o.status in ('paid','shipped','completed')
       and (p_include_demo or not o.is_demo)
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by c.id, c.name order by 4 desc;
end $$;

create function public.report_order_status(p_from date, p_to date, p_include_demo boolean default true)
returns table (status public.order_status, order_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  return query
    select o.status, count(*) from public.orders o
     where (p_include_demo or not o.is_demo)
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by o.status order by o.status;
end $$;

-- ข้อมูลส่วนบุคคล (ชื่อ/อีเมล) คืนให้ Admin เท่านั้น
create function public.report_customers(p_from date, p_to date, p_limit int default 10, p_include_demo boolean default true)
returns table (user_id uuid, full_name text, email text, order_count bigint, total_spent numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  return query
    select pr.id, pr.full_name, pr.email, count(o.id), coalesce(sum(o.total_amount), 0)
      from public.profiles pr
      join public.orders o on o.user_id = pr.id
     where o.status in ('paid','shipped','completed')
       and (p_include_demo or not o.is_demo)
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by pr.id order by 5 desc limit p_limit;
end $$;

revoke all on function public.report_sales(date, date, text, boolean),
                       public.report_best_sellers(date, date, int, boolean),
                       public.report_category_sales(date, date, boolean),
                       public.report_order_status(date, date, boolean),
                       public.report_customers(date, date, int, boolean)
  from public, anon;
grant execute on function public.report_sales(date, date, text, boolean),
                          public.report_best_sellers(date, date, int, boolean),
                          public.report_category_sales(date, date, boolean),
                          public.report_order_status(date, date, boolean),
                          public.report_customers(date, date, int, boolean)
  to authenticated;
