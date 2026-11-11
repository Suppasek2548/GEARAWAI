-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0013) — split verbatim, logic unchanged
-- ---------------------------------------------------------------------
-- 0013  INTERNAL HELPERS (ไม่ GRANT ให้ผู้ใช้)
-- ---------------------------------------------------------------------
create or replace function public.next_order_number() returns text
language sql volatile security definer set search_path = '' as $$
  select 'GA-' || to_char(public.th_today(), 'YYYYMMDD') || '-'
         || lpad(nextval('public.order_number_seq')::text, 4, '0')
$$;

create or replace function public.next_booking_number() returns text
language sql volatile security definer set search_path = '' as $$
  select 'BK-' || to_char(public.th_today(), 'YYYYMMDD') || '-'
         || lpad(nextval('public.booking_number_seq')::text, 4, '0')
$$;

create or replace function public.products_initial_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.stock_quantity > 0 then
    insert into public.stock_movements (product_id, movement_type, quantity_change, quantity_after, note, created_by)
    values (new.id, 'initial', new.stock_quantity, new.stock_quantity, 'Initial stock', auth.uid());
  end if;
  return new;
end $$;
create trigger products_initial_stock_trg after insert on public.products
  for each row execute function public.products_initial_stock();

-- ยอดรวมตะกร้า (เฉพาะสินค้าที่ซื้อได้)
create or replace function public._cart_subtotal(p_uid uuid) returns numeric
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(public.calc_effective_price(p.price, p.sale_price, p.id) * ci.quantity), 0)
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    join public.products p on p.id = ci.product_id
   where c.user_id = p_uid and p.status = 'active'
$$;

-- ประเมินคูปอง (R-23: นับเฉพาะ Order ที่ไม่ถูกยกเลิก)
create or replace function public._evaluate_coupon(p_uid uuid, p_code text, p_subtotal numeric)
returns table (coupon_id uuid, member_coupon_id uuid, code text, discount numeric, reason text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  c  public.coupons%rowtype;
  mc public.member_coupons%rowtype;
  v_is_member boolean := false;
  v_used int;
  v_disc numeric;
begin
  if v_code = '' then
    return query select null::uuid, null::uuid, null::text, 0::numeric, 'NO_CODE'::text; return;
  end if;

  select * into mc from public.member_coupons m where m.code = v_code;
  if found then
    if mc.user_id <> p_uid then
      return query select null::uuid, null::uuid, null::text, 0::numeric, 'INVALID_CODE'::text; return;
    end if;
    v_is_member := true;
    if mc.used_at is not null then
      return query select null::uuid, null::uuid, null::text, 0::numeric, 'ALREADY_USED'::text; return;
    end if;
    if mc.expires_at <= now() then
      return query select null::uuid, null::uuid, null::text, 0::numeric, 'EXPIRED'::text; return;
    end if;
    select * into c from public.coupons x where x.id = mc.coupon_id;
  else
    select * into c from public.coupons x where x.code = v_code and x.coupon_type = 'general';
    if not found then
      return query select null::uuid, null::uuid, null::text, 0::numeric, 'INVALID_CODE'::text; return;
    end if;
  end if;

  if not c.is_active then
    return query select null::uuid, null::uuid, null::text, 0::numeric, 'INACTIVE'::text; return; end if;
  if c.start_at is not null and now() < c.start_at then
    return query select null::uuid, null::uuid, null::text, 0::numeric, 'NOT_STARTED'::text; return; end if;
  if c.end_at is not null and now() >= c.end_at then
    return query select null::uuid, null::uuid, null::text, 0::numeric, 'EXPIRED'::text; return; end if;
  if p_subtotal < c.min_order_amount then
    return query select null::uuid, null::uuid, null::text, 0::numeric, 'BELOW_MIN_ORDER'::text; return; end if;

  if not v_is_member then
    if c.usage_limit is not null and c.used_count >= c.usage_limit then
      return query select null::uuid, null::uuid, null::text, 0::numeric, 'USAGE_LIMIT_REACHED'::text; return; end if;
    select count(*) into v_used from public.orders o
     where o.user_id = p_uid and o.coupon_id = c.id and o.status <> 'cancelled';
    if v_used >= c.per_user_limit then
      return query select null::uuid, null::uuid, null::text, 0::numeric, 'PER_USER_LIMIT_REACHED'::text; return; end if;
  end if;

  v_disc := case when c.discount_type = 'percentage'
                 then round(p_subtotal * c.discount_value / 100.0, 2)
                 else c.discount_value end;
  if c.max_discount_amount is not null then v_disc := least(v_disc, c.max_discount_amount); end if;
  v_disc := least(v_disc, p_subtotal);

  return query select c.id, case when v_is_member then mc.id else null::uuid end, v_code, v_disc, null::text;
end $$;

-- ให้คะแนน (D-04: ไม่รวมค่าส่ง)
create or replace function public._award_order_points(p_order_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders%rowtype;
  v_rate numeric;
  v_pts int;
  v_bal int;
begin
  select * into o from public.orders where id = p_order_id;
  if not found or o.status <> 'completed' then return 0; end if;
  if exists (select 1 from public.points_transactions where order_id = o.id and type = 'earn') then return 0; end if;
  v_rate := coalesce((public.get_setting('points_rule') ->> 'baht_per_point')::numeric, 100);
  v_pts := floor((o.subtotal - o.discount_amount) / v_rate)::int;
  if v_pts <= 0 then return 0; end if;
  update public.profiles set points_balance = points_balance + v_pts where id = o.user_id
  returning points_balance into v_bal;
  insert into public.points_transactions (user_id, type, points, balance_after, order_id, note)
  values (o.user_id, 'earn', v_pts, v_bal, o.id, 'Order ' || o.order_number);
  return v_pts;
end $$;
