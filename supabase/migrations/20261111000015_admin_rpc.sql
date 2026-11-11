-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0015) — split verbatim, logic unchanged
-- ---------------------------------------------------------------------
-- 0015  ADMIN RPC (ทุกตัวเรียก _assert_admin ก่อน)
-- ---------------------------------------------------------------------
create or replace function public.admin_verify_payment(p_payment_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare pay public.payments%rowtype; o public.orders%rowtype;
begin
  perform public._assert_admin();
  select * into pay from public.payments where id = p_payment_id for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if pay.status <> 'submitted' then raise exception 'INVALID_PAYMENT_STATUS'; end if;
  select * into o from public.orders where id = pay.order_id for update;
  if o.status <> 'payment_submitted' then raise exception 'INVALID_ORDER_STATUS'; end if;
  if p_approve then
    update public.payments set status = 'verified', verified_at = now(), verified_by = auth.uid() where id = pay.id;
    update public.orders set status = 'paid', paid_at = now() where id = o.id;
    update public.products p set sold_count = p.sold_count + oi.quantity          -- D-07
      from public.order_items oi where oi.order_id = o.id and oi.product_id = p.id;
  else
    if coalesce(btrim(p_reason), '') = '' then raise exception 'REASON_REQUIRED'; end if;
    update public.payments set status = 'rejected', reject_reason = btrim(p_reason),
           verified_at = now(), verified_by = auth.uid() where id = pay.id;
    update public.orders set status = 'pending_payment' where id = o.id;
  end if;
end $$;

create or replace function public.admin_update_order_status(
  p_order_id uuid, p_status public.order_status, p_tracking text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype;
begin
  perform public._assert_admin();
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status = 'paid' and p_status = 'shipped' then
    update public.orders set status = 'shipped', shipped_at = now(),
           tracking_number = coalesce(nullif(btrim(coalesce(p_tracking, '')), ''), tracking_number)
     where id = o.id;
  elsif o.status = 'shipped' and p_status = 'completed' then
    update public.orders set status = 'completed', completed_at = now() where id = o.id;
    perform public._award_order_points(o.id);
  else
    raise exception 'INVALID_TRANSITION';   -- ยกเลิกใช้ cancel_order()
  end if;
end $$;

create or replace function public.admin_update_redemption(
  p_redemption_id uuid, p_status public.redemption_status, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.reward_redemptions%rowtype; v_bal int;
begin
  perform public._assert_admin();
  select * into r from public.reward_redemptions where id = p_redemption_id for update;
  if not found then raise exception 'REDEMPTION_NOT_FOUND'; end if;
  if r.status <> 'requested' then raise exception 'INVALID_REDEMPTION_STATUS'; end if;
  if p_status = 'fulfilled' then
    update public.reward_redemptions set status = 'fulfilled', fulfilled_at = now(), admin_note = p_note where id = r.id;
  elsif p_status = 'cancelled' then
    if coalesce(btrim(p_note), '') = '' then raise exception 'REASON_REQUIRED'; end if;
    update public.reward_redemptions set status = 'cancelled', cancelled_at = now(), admin_note = p_note where id = r.id;
    update public.profiles set points_balance = points_balance + r.points_used where id = r.user_id
    returning points_balance into v_bal;
    insert into public.points_transactions (user_id, type, points, balance_after, redemption_id, note, created_by)
    values (r.user_id, 'reverse', r.points_used, v_bal, r.id, p_note, auth.uid());
    update public.rewards set stock_quantity = stock_quantity + 1 where id = r.reward_id;
  else
    raise exception 'INVALID_TRANSITION';
  end if;
end $$;

create or replace function public.admin_adjust_points(p_user_id uuid, p_points integer, p_note text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_bal int;
begin
  perform public._assert_admin();
  if p_points is null or p_points = 0 then raise exception 'INVALID_POINTS'; end if;
  if coalesce(btrim(p_note), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  select points_balance into v_bal from public.profiles where id = p_user_id for update;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
  if v_bal + p_points < 0 then raise exception 'NEGATIVE_BALANCE'; end if;
  update public.profiles set points_balance = points_balance + p_points where id = p_user_id
  returning points_balance into v_bal;
  insert into public.points_transactions (user_id, type, points, balance_after, note, created_by)
  values (p_user_id, 'adjust', p_points, v_bal, btrim(p_note), auth.uid());
  return v_bal;
end $$;

create or replace function public.admin_adjust_stock(
  p_product_id uuid, p_change integer, p_type public.stock_movement_type, p_note text default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_qty int;
begin
  perform public._assert_admin();
  if p_type not in ('restock', 'adjustment') then raise exception 'INVALID_MOVEMENT_TYPE'; end if;
  if p_change is null or p_change = 0 then raise exception 'INVALID_QUANTITY'; end if;
  if p_type = 'restock' and p_change < 0 then raise exception 'INVALID_QUANTITY'; end if;
  if p_type = 'adjustment' and coalesce(btrim(p_note), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  select stock_quantity into v_qty from public.products where id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if v_qty + p_change < 0 then raise exception 'NEGATIVE_STOCK'; end if;
  update public.products set stock_quantity = stock_quantity + p_change where id = p_product_id
  returning stock_quantity into v_qty;
  insert into public.stock_movements (product_id, movement_type, quantity_change, quantity_after, note, created_by)
  values (p_product_id, p_type, p_change, v_qty, nullif(btrim(coalesce(p_note, '')), ''), auth.uid());
  return v_qty;
end $$;

-- R-25: กันระงับ/ลดสิทธิ์ตนเอง และกัน Admin คนสุดท้าย
create or replace function public.admin_set_account_status(p_user_id uuid, p_status public.account_status)
returns void language plpgsql security definer set search_path = '' as $$
declare v_target public.profiles%rowtype;
begin
  perform public._assert_admin();
  if p_user_id = auth.uid() then raise exception 'CANNOT_CHANGE_SELF'; end if;
  select * into v_target from public.profiles where id = p_user_id for update;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
  if v_target.role = 'admin' and p_status = 'suspended'
     and (select count(*) from public.profiles where role = 'admin' and account_status = 'active') <= 1 then
    raise exception 'LAST_ADMIN';
  end if;
  update public.profiles set account_status = p_status where id = p_user_id;
end $$;

create or replace function public.admin_set_member_birth_date(p_user_id uuid, p_birth_date date)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  if p_birth_date is not null and (p_birth_date > public.th_today() or p_birth_date <= date '1900-01-01') then
    raise exception 'INVALID_BIRTH_DATE';
  end if;
  update public.profiles set birth_date = p_birth_date where id = p_user_id;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
end $$;

create or replace function public.admin_update_booking(
  p_booking_id uuid, p_status public.booking_status default null, p_admin_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare b public.bookings%rowtype;
begin
  perform public._assert_admin();
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if p_status is not null and p_status <> b.status then
    if not ((b.status = 'pending' and p_status in ('confirmed', 'cancelled'))
         or (b.status = 'confirmed' and p_status in ('completed', 'cancelled'))) then
      raise exception 'INVALID_TRANSITION';
    end if;
  end if;
  update public.bookings set status = coalesce(p_status, status),
         admin_note = coalesce(p_admin_note, admin_note) where id = b.id;
end $$;

-- R-28: ตรวจว่าภาพถูกใช้อยู่ที่ใด
create or replace function public.media_usage(p_media_id uuid)
returns table (source text, ref text) language plpgsql stable security definer set search_path = '' as $$
declare v_url text;
begin
  perform public._assert_admin();
  select public_url into v_url from public.media_files where id = p_media_id;
  if v_url is null then return; end if;
  return query
    select 'product_images', pi.product_id::text from public.product_images pi where pi.media_id = p_media_id or pi.image_url = v_url
    union all select 'categories', c.slug from public.categories c where c.image_url = v_url
    union all select 'brands', b.slug from public.brands b where b.logo_url = v_url
    union all select 'promotions', pr.slug from public.promotions pr where v_url in (pr.banner_desktop_url, pr.banner_mobile_url)
    union all select 'services', s.slug from public.services s where s.image_url = v_url
    union all select 'rewards', r.id::text from public.rewards r where r.image_url = v_url
    union all select 'team_members', t.id::text from public.team_members t where t.image_url = v_url
    union all select 'site_settings', ss.key from public.site_settings ss where ss.value::text like '%' || v_url || '%';
end $$;

-- รายงาน (ยอดขายสำเร็จ = paid, shipped, completed · วันที่ตามเวลาไทย)
create or replace function public.admin_dashboard_stats(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_from timestamptz; v_to timestamptz; v jsonb;
begin
  perform public._assert_admin();
  v_from := p_from::timestamp at time zone 'Asia/Bangkok';
  v_to   := (p_to + 1)::timestamp at time zone 'Asia/Bangkok';
  select jsonb_build_object(
    'total_sales', coalesce((select sum(total_amount) from public.orders
                              where status in ('paid','shipped','completed') and created_at >= v_from and created_at < v_to), 0),
    'total_orders', (select count(*) from public.orders where created_at >= v_from and created_at < v_to),
    'total_customers', (select count(*) from public.profiles where role = 'member'),
    'total_products', (select count(*) from public.products),
    'pending_payments', (select count(*) from public.payments where status = 'submitted'),
    'pending_bookings', (select count(*) from public.bookings where status = 'pending'),
    'new_messages', (select count(*) from public.contact_messages where status = 'new'),
    'low_stock', (select count(*) from public.products where status = 'active' and stock_quantity <= low_stock_threshold)
  ) into v;
  return v;
end $$;

create or replace function public.report_sales(p_from date, p_to date, p_group text default 'day')
returns table (period date, order_count bigint, sales numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  if p_group not in ('day', 'month') then raise exception 'INVALID_GROUP'; end if;
  return query
    select date_trunc(p_group, o.created_at at time zone 'Asia/Bangkok')::date, count(*), sum(o.total_amount)
      from public.orders o
     where o.status in ('paid','shipped','completed')
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by 1 order by 1;
end $$;

create or replace function public.report_best_sellers(p_from date, p_to date, p_limit int default 10)
returns table (product_id uuid, sku text, name text, quantity bigint, sales numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  return query
    select oi.product_id, max(oi.product_sku), max(oi.product_name), sum(oi.quantity)::bigint, sum(oi.line_total)
      from public.order_items oi join public.orders o on o.id = oi.order_id
     where o.status in ('paid','shipped','completed')
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by oi.product_id order by 4 desc, 5 desc limit p_limit;
end $$;

create or replace function public.report_category_sales(p_from date, p_to date)
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
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by c.id, c.name order by 4 desc;
end $$;

create or replace function public.report_order_status(p_from date, p_to date)
returns table (status public.order_status, order_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  return query
    select o.status, count(*) from public.orders o
     where o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by o.status order by o.status;
end $$;

-- ข้อมูลส่วนบุคคล (ชื่อ/อีเมล) คืนให้ Admin เท่านั้น
create or replace function public.report_customers(p_from date, p_to date, p_limit int default 10)
returns table (user_id uuid, full_name text, email text, order_count bigint, total_spent numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._assert_admin();
  return query
    select pr.id, pr.full_name, pr.email, count(o.id), coalesce(sum(o.total_amount), 0)
      from public.profiles pr
      join public.orders o on o.user_id = pr.id
     where o.status in ('paid','shipped','completed')
       and o.created_at >= p_from::timestamp at time zone 'Asia/Bangkok'
       and o.created_at <  (p_to + 1)::timestamp at time zone 'Asia/Bangkok'
     group by pr.id order by 5 desc limit p_limit;
end $$;
