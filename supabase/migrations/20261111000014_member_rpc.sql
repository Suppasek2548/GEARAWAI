-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0014) — split verbatim, logic unchanged
-- ---------------------------------------------------------------------
-- 0014  MEMBER RPC
-- ---------------------------------------------------------------------
-- R-04: ตะกร้า/Wishlist แสดงสินค้าที่ถูกปิดขายได้ (เฉพาะของตนเอง, ข้อมูลสินค้าขั้นต่ำ)
create or replace function public.get_my_cart()
returns table (cart_item_id uuid, product_id uuid, sku text, name text, slug text, image_url text,
               price numeric, sale_price numeric, effective_price numeric, stock_quantity integer,
               product_status public.product_status, quantity integer, line_total numeric, is_purchasable boolean)
language sql stable security definer set search_path = '' as $$
  select ci.id, p.id, p.sku, p.name, p.slug,
         (select pi.image_url from public.product_images pi where pi.product_id = p.id and pi.is_primary limit 1),
         p.price, p.sale_price, e.price, p.stock_quantity, p.status, ci.quantity, e.price * ci.quantity,
         (p.status = 'active' and p.stock_quantity >= ci.quantity)
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    join public.products p on p.id = ci.product_id
    cross join lateral (select public.calc_effective_price(p.price, p.sale_price, p.id) as price) e
   where c.user_id = auth.uid()
   order by ci.created_at
$$;

create or replace function public.get_my_wishlist()
returns table (wishlist_item_id uuid, product_id uuid, sku text, name text, slug text, image_url text,
               price numeric, sale_price numeric, effective_price numeric, stock_quantity integer,
               product_status public.product_status, is_purchasable boolean)
language sql stable security definer set search_path = '' as $$
  select wi.id, p.id, p.sku, p.name, p.slug,
         (select pi.image_url from public.product_images pi where pi.product_id = p.id and pi.is_primary limit 1),
         p.price, p.sale_price, public.calc_effective_price(p.price, p.sale_price, p.id), p.stock_quantity, p.status,
         (p.status = 'active' and p.stock_quantity > 0)
    from public.wishlist_items wi
    join public.wishlists w on w.id = wi.wishlist_id
    join public.products p on p.id = wi.product_id
   where w.user_id = auth.uid()
   order by wi.created_at desc
$$;

-- R-01: แก้วันเกิดผ่าน RPC (ไม่มี Trigger เขียนทับค่า)
create or replace function public.set_my_birth_date(p_birth_date date) returns void
language plpgsql security definer set search_path = '' as $$
declare pr public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_birth_date is null or p_birth_date > public.th_today() or p_birth_date <= date '1900-01-01' then
    raise exception 'INVALID_BIRTH_DATE';
  end if;
  select * into pr from public.profiles where id = auth.uid() for update;
  if pr.birth_date is null then
    update public.profiles set birth_date = p_birth_date where id = pr.id;           -- ตั้งครั้งแรก
  elsif pr.birth_date = p_birth_date then
    return;
  elsif pr.birth_date_change_count >= 1 then
    raise exception 'BIRTH_DATE_LOCKED';
  else
    update public.profiles set birth_date = p_birth_date,
           birth_date_change_count = birth_date_change_count + 1 where id = pr.id;    -- แก้ได้ 1 ครั้ง
  end if;
end $$;

create or replace function public.validate_coupon(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_sub numeric; ev record;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  v_sub := public._cart_subtotal(auth.uid());
  select * into ev from public._evaluate_coupon(auth.uid(), p_code, v_sub);
  return jsonb_build_object('valid', ev.reason is null, 'reason', ev.reason,
                            'code', ev.code, 'subtotal', v_sub, 'discount', ev.discount);
end $$;

create or replace function public.place_order(
  p_recipient_name text, p_recipient_phone text, p_shipping_address text,
  p_note text default null, p_coupon_code text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_cart uuid;
  v_sub numeric;
  v_ship numeric;
  v_rule jsonb;
  v_disc numeric := 0;
  v_coupon_id uuid;
  v_mc_id uuid;
  v_code text;
  v_order_id uuid;
  v_no text;
  v_bad text;
  ev record;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  perform 1 from public.profiles where id = v_uid and account_status = 'active';
  if not found then raise exception 'ACCOUNT_SUSPENDED'; end if;

  select id into v_cart from public.carts where user_id = v_uid;
  if not exists (select 1 from public.cart_items where cart_id = v_cart) then
    raise exception 'CART_EMPTY';
  end if;

  -- ล็อกแถวสินค้าในตะกร้า กันขายเกินสต็อกเมื่อสั่งพร้อมกัน
  perform 1 from public.products p
    where p.id in (select product_id from public.cart_items where cart_id = v_cart)
    order by p.id for update;

  select p.sku into v_bad
    from public.cart_items ci join public.products p on p.id = ci.product_id
   where ci.cart_id = v_cart and (p.status <> 'active' or p.stock_quantity < ci.quantity)
   limit 1;
  if v_bad is not null then raise exception 'OUT_OF_STOCK:%', v_bad; end if;

  v_sub := public._cart_subtotal(v_uid);

  -- D-04: ส่งฟรีเทียบยอดก่อนหักคูปอง
  v_rule := public.get_setting('shipping_rule');
  v_ship := case when v_sub >= coalesce((v_rule ->> 'free_shipping_min')::numeric, 0) then 0
                 else coalesce((v_rule ->> 'flat_fee')::numeric, 0) end;

  if coalesce(btrim(p_coupon_code), '') <> '' then
    select * into ev from public._evaluate_coupon(v_uid, p_coupon_code, v_sub);
    if ev.reason is not null then raise exception 'COUPON_%', ev.reason; end if;
    v_disc := ev.discount; v_coupon_id := ev.coupon_id; v_mc_id := ev.member_coupon_id; v_code := ev.code;
  end if;

  v_no := public.next_order_number();
  insert into public.orders (order_number, user_id, subtotal, discount_amount, shipping_fee, total_amount,
                             coupon_id, coupon_code, recipient_name, recipient_phone, shipping_address, note)
  values (v_no, v_uid, v_sub, v_disc, v_ship, v_sub - v_disc + v_ship,
          v_coupon_id, v_code, btrim(p_recipient_name), btrim(p_recipient_phone), btrim(p_shipping_address),
          nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_sku, product_name, product_image_url,
                                  unit_price, quantity, line_total)
  select v_order_id, p.id, p.sku, p.name,
         (select pi.image_url from public.product_images pi where pi.product_id = p.id and pi.is_primary limit 1),
         e.price, ci.quantity, e.price * ci.quantity
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    cross join lateral (select public.calc_effective_price(p.price, p.sale_price, p.id) as price) e
   where ci.cart_id = v_cart;

  -- ตัดสต็อก + บันทึกประวัติ (sold_count นับตอนชำระแล้ว — D-07)
  with upd as (
    update public.products p set stock_quantity = p.stock_quantity - ci.quantity
      from public.cart_items ci
     where ci.cart_id = v_cart and ci.product_id = p.id
    returning p.id as pid, ci.quantity as qty, p.stock_quantity as after_qty
  )
  insert into public.stock_movements (product_id, movement_type, quantity_change, quantity_after, order_id, created_by)
  select pid, 'order', -qty, after_qty, v_order_id, v_uid from upd;

  -- ผูกคูปอง
  if v_mc_id is not null then
    update public.member_coupons set used_at = now(), order_id = v_order_id
     where id = v_mc_id and used_at is null;
    if not found then raise exception 'COUPON_ALREADY_USED'; end if;
  elsif v_coupon_id is not null then
    update public.coupons set used_count = used_count + 1
     where id = v_coupon_id and (usage_limit is null or used_count < usage_limit);
    if not found then raise exception 'COUPON_USAGE_LIMIT_REACHED'; end if;
  end if;

  delete from public.cart_items where cart_id = v_cart;
  return v_no;
end $$;

create or replace function public.submit_payment(
  p_order_id uuid, p_method public.payment_method, p_slip_path text default null, p_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; v_id uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into o from public.orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status <> 'pending_payment' then raise exception 'INVALID_ORDER_STATUS'; end if;
  if p_slip_path is not null and p_slip_path not like auth.uid()::text || '/' || o.id::text || '/%' then
    raise exception 'INVALID_SLIP_PATH';
  end if;
  insert into public.payments (order_id, method, amount, status, slip_path, payer_note, is_demo, submitted_at)
  values (o.id, p_method, o.total_amount, 'submitted', p_slip_path, nullif(btrim(coalesce(p_note, '')), ''), true, now())
  returning id into v_id;
  update public.orders set status = 'payment_submitted' where id = o.id;
  return v_id;
end $$;

-- สมาชิกยกเลิกได้เมื่อ pending_payment · Admin ยกเลิกได้ก่อน shipped
create or replace function public.cancel_order(p_order_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; v_admin boolean := public.is_admin();
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found or (not v_admin and o.user_id <> auth.uid()) then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_admin then
    if o.status not in ('pending_payment', 'payment_submitted', 'paid') then raise exception 'INVALID_ORDER_STATUS'; end if;
  elsif o.status <> 'pending_payment' then
    raise exception 'INVALID_ORDER_STATUS';
  end if;

  with upd as (
    update public.products p
       set stock_quantity = p.stock_quantity + oi.quantity,
           sold_count = case when o.status = 'paid' then greatest(p.sold_count - oi.quantity, 0) else p.sold_count end
      from public.order_items oi
     where oi.order_id = o.id and oi.product_id = p.id
    returning p.id as pid, oi.quantity as qty, p.stock_quantity as after_qty
  )
  insert into public.stock_movements (product_id, movement_type, quantity_change, quantity_after, order_id, note, created_by)
  select pid, 'cancel_return', qty, after_qty, o.id, 'Order cancelled', auth.uid() from upd;

  if exists (select 1 from public.member_coupons where order_id = o.id) then
    update public.member_coupons set used_at = null, order_id = null where order_id = o.id;
  elsif o.coupon_id is not null then
    update public.coupons set used_count = greatest(used_count - 1, 0) where id = o.coupon_id;
  end if;

  update public.payments set status = 'voided'
   where order_id = o.id and status in ('submitted', 'verified');   -- R-20

  update public.orders set status = 'cancelled', cancelled_reason = btrim(p_reason), cancelled_at = now()
   where id = o.id;
end $$;

-- R-01 regression: หักคะแนนจริง เพราะไม่มี Trigger เขียนทับ points_balance
create or replace function public.redeem_reward(p_reward_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare pr public.profiles%rowtype; rw public.rewards%rowtype; v_rid uuid; v_bal int;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into pr from public.profiles where id = auth.uid() for update;
  if pr.account_status <> 'active' then raise exception 'ACCOUNT_SUSPENDED'; end if;
  select * into rw from public.rewards where id = p_reward_id for update;
  if not found or not rw.is_active then raise exception 'REWARD_UNAVAILABLE'; end if;
  if rw.stock_quantity <= 0 then raise exception 'REWARD_OUT_OF_STOCK'; end if;
  if pr.points_balance < rw.points_required then raise exception 'INSUFFICIENT_POINTS'; end if;

  insert into public.reward_redemptions (user_id, reward_id, reward_name, points_used)
  values (pr.id, rw.id, rw.name, rw.points_required) returning id into v_rid;
  update public.profiles set points_balance = points_balance - rw.points_required where id = pr.id
  returning points_balance into v_bal;
  insert into public.points_transactions (user_id, type, points, balance_after, redemption_id, note)
  values (pr.id, 'redeem', -rw.points_required, v_bal, v_rid, rw.name);
  update public.rewards set stock_quantity = stock_quantity - 1 where id = rw.id;
  return v_rid;
end $$;

create or replace function public.claim_birthday_coupon() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pr public.profiles%rowtype; c public.coupons%rowtype; v_coupon uuid; v_exp timestamptz; v_id uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into pr from public.profiles where id = auth.uid();
  if pr.account_status <> 'active' then raise exception 'ACCOUNT_SUSPENDED'; end if;
  if pr.birth_date is null then raise exception 'BIRTH_DATE_REQUIRED'; end if;
  if extract(month from pr.birth_date) <> extract(month from public.th_today()) then
    raise exception 'NOT_BIRTHDAY_MONTH';
  end if;
  v_coupon := (public.get_setting('birthday_rule') ->> 'coupon_id')::uuid;
  select * into c from public.coupons where id = v_coupon and coupon_type = 'birthday' and is_active;
  if not found then raise exception 'BIRTHDAY_COUPON_UNAVAILABLE'; end if;

  -- หมดอายุ = เริ่มต้นเดือนถัดไปตามเวลาไทย (หรือ N วันหลังรับ ถ้ากำหนด)
  v_exp := (date_trunc('month', public.th_now()) + interval '1 month') at time zone 'Asia/Bangkok';
  if c.valid_days_after_claim is not null then
    v_exp := now() + make_interval(days => c.valid_days_after_claim);
  end if;
  v_code := 'BDAY' || to_char(public.th_today(), 'YY') || '-' ||
            upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  insert into public.member_coupons (user_id, coupon_id, code, cycle_year, expires_at)
  values (pr.id, c.id, v_code, extract(year from public.th_today())::int, v_exp)
  on conflict (user_id, coupon_id, cycle_year) do nothing
  returning id into v_id;
  if v_id is null then raise exception 'ALREADY_CLAIMED'; end if;
  return jsonb_build_object('member_coupon_id', v_id, 'code', v_code, 'expires_at', v_exp);
end $$;

-- R-03: คืนเฉพาะเวลาที่ถูกจอง ไม่มีข้อมูลผู้จอง
create or replace function public.get_booked_slots(p_service_id uuid, p_date date)
returns table (time_slot time) language sql stable security definer set search_path = '' as $$
  select b.time_slot from public.bookings b
   where b.service_id = p_service_id and b.booking_date = p_date and b.status in ('pending', 'confirmed')
   order by b.time_slot
$$;

-- R-02 / R-11: สร้างการจองผ่าน RPC เท่านั้น
create or replace function public.create_booking(
  p_service_id uuid, p_date date, p_time_slot time,
  p_contact_name text, p_contact_phone text, p_contact_email text, p_note text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  s public.services%rowtype; v_rule jsonb; v_no text;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  perform 1 from public.profiles where id = auth.uid() and account_status = 'active';
  if not found then raise exception 'ACCOUNT_SUSPENDED'; end if;
  select * into s from public.services where id = p_service_id and is_active;
  if not found then raise exception 'SERVICE_UNAVAILABLE'; end if;
  v_rule := public.get_setting('booking_rule');
  if p_date < public.th_today() then raise exception 'DATE_IN_PAST'; end if;
  if p_date > public.th_today() + coalesce((v_rule ->> 'max_days_ahead')::int, 30) then
    raise exception 'DATE_TOO_FAR';
  end if;
  if coalesce(v_rule -> 'closed_weekdays', '[]'::jsonb) @> to_jsonb(extract(isodow from p_date)::int) then
    raise exception 'CLOSED_DAY';
  end if;
  if not (coalesce(v_rule -> 'time_slots', '[]'::jsonb) ? to_char(p_time_slot, 'HH24:MI')) then
    raise exception 'INVALID_TIME_SLOT';
  end if;
  if p_date = public.th_today() and p_time_slot <= public.th_now()::time then
    raise exception 'SLOT_IN_PAST';
  end if;
  v_no := public.next_booking_number();
  begin
    insert into public.bookings (booking_number, user_id, service_id, booking_date, time_slot,
                                 contact_name, contact_phone, contact_email, note, price_snapshot)
    values (v_no, auth.uid(), s.id, p_date, p_time_slot, btrim(p_contact_name), btrim(p_contact_phone),
            btrim(p_contact_email), nullif(btrim(coalesce(p_note, '')), ''), s.price);
  exception when unique_violation then
    raise exception 'SLOT_TAKEN';
  end;
  return v_no;
end $$;

create or replace function public.cancel_booking(p_booking_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.bookings set status = 'cancelled'
   where id = p_booking_id and user_id = auth.uid() and status = 'pending';
  if not found then raise exception 'BOOKING_NOT_CANCELLABLE'; end if;
end $$;

-- R-14: ส่งข้อความผ่าน RPC พร้อมจำกัดความถี่
create or replace function public.submit_contact_message(
  p_name text, p_email text, p_subject text, p_message text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if (select count(*) from public.contact_messages
       where lower(email) = lower(btrim(p_email)) and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'RATE_LIMITED';
  end if;
  if (select count(*) from public.contact_messages where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'RATE_LIMITED';
  end if;
  insert into public.contact_messages (user_id, name, email, subject, message)
  values (auth.uid(), btrim(p_name), btrim(p_email), btrim(p_subject), btrim(p_message))
  returning id into v_id;
  return v_id;
end $$;

-- R-09: Gallery สาธารณะ — คืนเฉพาะข้อมูลภาพ (ไม่มี uploaded_by)
create or replace function public.get_public_gallery()
returns table (id uuid, public_url text, alt_text text, width integer, height integer)
language sql stable security definer set search_path = '' as $$
  select m.id, m.public_url, m.alt_text, m.width, m.height
    from public.media_files m where m.category = 'gallery' order by m.created_at
$$;
