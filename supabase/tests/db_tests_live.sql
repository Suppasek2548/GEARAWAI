-- =====================================================================
-- GEARAWAI — TC-DB on the real Supabase project, ROLLBACK-ONLY (Phase 6, D-18)
--
-- Port of docs/GEARAWAI_DB_TESTS.sql (TC-DB-01 … TC-DB-50, 80 assertions). The original needs a
-- psql shim + 01_seed_test.sql (missing, gap G1) and a blank database. This version:
--   * runs as ONE DO block, so it is a single statement / single transaction;
--   * creates its own throw-away users in auth.users (fixed UUIDs …a1/b1/c1/d1/e1) — the real
--     sign-up trigger builds their profiles/carts/wishlists;
--   * looks products/rewards/services up by SKU/name and computes expected values relative to the
--     current data (e.g. stock before − 1) instead of assuming a blank seed;
--   * ALWAYS ends with RAISE EXCEPTION 'DBTEST_RESULTS …' → Postgres rolls back every change.
--     The exception message carries the JSON results (t = test id, ok = pass, m = detail).
--
-- Run (needs the user's consent — it executes writes that are then rolled back):
--   npx supabase db query --remote --yes -f supabase/tests/db_tests_live.sql
-- Users are simulated like Supabase does: role anon/authenticated + request.jwt.claim.sub.
-- =====================================================================
do $dbtest$
declare
  res   jsonb := '[]'::jsonb;
  u_a   constant uuid := '00000000-0000-0000-0000-0000000000a1';  -- member A (invalid birth_date metadata)
  u_b   constant uuid := '00000000-0000-0000-0000-0000000000b1';  -- member B (no full_name)
  u_c   constant uuid := '00000000-0000-0000-0000-0000000000c1';  -- birthday this month
  u_d   constant uuid := '00000000-0000-0000-0000-0000000000d1';  -- admin
  u_e   constant uuid := '00000000-0000-0000-0000-0000000000e1';  -- metadata role=admin + future birth date
  p1 uuid; p2 uuid; p5 uuid; p10 uuid; p11 uuid; p12 uuid; p14 uuid; p17 uuid;
  r_keyring uuid; r_cup uuid; svc uuid; bk_day date; bk_a uuid; bk_b uuid;
  cat_acc uuid; brand_any uuid; media_g uuid; media_c uuid;
  s1_before int; s14_before int; s5_before int; s12_before int; sold1_before int; sold14_before int; sold5_before int;
  key_stock_before int; sales_base numeric; dash_base numeric;
  v_cart uuid; v_no text; v_oid uuid; v_pay uuid; v_rid uuid; v_code text; v_after int; v_exp timestamptz;
  o public.orders%rowtype; j jsonb; n int; d1 date; d2 date; r record;
begin
  begin  -- main body; any unexpected error is recorded as ABORT instead of hiding earlier results
    -- ---------- fixtures (as owner) ----------
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    select id into p1  from public.products where sku = 'GA-MS-001';   -- #1 DeathAdder V3 Pro (sale 4,990)
    select id into p2  from public.products where sku = 'GA-MS-002';   -- #2 Superlight 2 (5,290)
    select id into p5  from public.products where sku = 'GA-MS-005';   -- #5 Aerox 3
    select id into p10 from public.products where sku = 'GA-KB-005';   -- #10 Keychron K8 Pro
    select id into p11 from public.products where sku = 'GA-HS-001';   -- #11 G733 (sale 4,590)
    select id into p12 from public.products where sku = 'GA-HS-002';   -- #12 BlackShark V2 Pro
    select id into p14 from public.products where sku = 'GA-HS-004';   -- #14 Cloud III (3,490)
    select id into p17 from public.products where sku = 'GA-CH-002';   -- #17 TITAN Evo
    select id into r_keyring from public.rewards where name like 'พวงกุญแจ%';
    select id into r_cup from public.rewards where points_required > 31 and points_required <> 50 order by points_required limit 1;
    select id into svc from public.services where price = 200 and is_active limit 1;
    select id into cat_acc from public.categories where slug = 'computer-accessories';
    select id into brand_any from public.brands order by name limit 1;
    -- precondition from TEST_CASES §2.2: Headset Week off until the promotion tests
    update public.promotions set is_active = false where slug = 'headset-week';
    -- the stock test needs #17 to have exactly 2 in stock (as in PRODUCT_DATA)
    if (select stock_quantity from public.products where id = p17) <> 2 then
      raise exception 'PRECONDITION: GA-CH-002 stock is not 2';
    end if;

    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
      ('00000000-0000-0000-0000-000000000000', u_a, 'authenticated', 'authenticated', 'dbtest.a@example.com', '', '{}',
       jsonb_build_object('full_name', 'Member A', 'birth_date', '15/05/2008'), now(), now()),
      ('00000000-0000-0000-0000-000000000000', u_b, 'authenticated', 'authenticated', 'dbtest.b@example.com', '', '{}',
       '{}'::jsonb, now(), now()),
      ('00000000-0000-0000-0000-000000000000', u_c, 'authenticated', 'authenticated', 'dbtest.c@example.com', '', '{}',
       jsonb_build_object('full_name', 'Birthday C',
                          'birth_date', to_char(make_date(2000, extract(month from public.th_today())::int, 10), 'YYYY-MM-DD')), now(), now()),
      ('00000000-0000-0000-0000-000000000000', u_d, 'authenticated', 'authenticated', 'dbtest.d@example.com', '', '{}',
       jsonb_build_object('full_name', 'Admin D'), now(), now()),
      ('00000000-0000-0000-0000-000000000000', u_e, 'authenticated', 'authenticated', 'dbtest.e@example.com', '', '{}',
       jsonb_build_object('full_name', 'Member E', 'role', 'admin', 'birth_date', to_char(public.th_today() + 30, 'YYYY-MM-DD')), now(), now());
    update public.profiles set role = 'admin' where id = u_d;

    s1_before := (select stock_quantity from public.products where id = p1);
    s14_before := (select stock_quantity from public.products where id = p14);
    s5_before := (select stock_quantity from public.products where id = p5);
    s12_before := (select stock_quantity from public.products where id = p12);
    sold1_before := (select sold_count from public.products where id = p1);
    sold14_before := (select sold_count from public.products where id = p14);
    sold5_before := (select sold_count from public.products where id = p5);
    key_stock_before := (select stock_quantity from public.rewards where id = r_keyring);

    -- ===================== สมัครสมาชิก (R-07) =====================
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-01','ok',
      (select full_name = 'dbtest.b' from public.profiles where id = u_b)
      and exists (select 1 from public.carts where user_id = u_b) and exists (select 1 from public.wishlists where user_id = u_b),
      'm','no full_name → email prefix + cart/wishlist'));
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-02','ok',(select birth_date is null from public.profiles where id = u_a),'m','birth_date 15/05/2008 → NULL'));
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-03','ok',(select birth_date is null from public.profiles where id = u_e),'m','future birth_date → NULL'));
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-04','ok',(select role = 'member' from public.profiles where id = u_e),'m','metadata role=admin ignored'));

    -- ===================== สิทธิ์แก้ไขโปรไฟล์ (R-01) — as A =====================
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_a::text, true);
    update public.profiles set full_name = 'Member A Updated' where id = u_a;
    get diagnostics n = row_count;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-05','ok',n = 1,'m','member updates own name'));
    begin
      update public.profiles set role = 'admin' where id = u_a;
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-06','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-06','ok',sqlstate = '42501','m',sqlerrm)); end;
    begin
      update public.profiles set points_balance = 99999 where id = u_a;
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-07','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-07','ok',sqlstate = '42501','m',sqlerrm)); end;
    update public.profiles set full_name = 'Hacked' where id = u_b;
    get diagnostics n = row_count;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-08','ok',n = 0,'m','other profile: ' || n || ' rows'));
    d1 := make_date(1995, ((extract(month from public.th_today())::int + 5) % 12) + 1, 10);
    d2 := make_date(1995, ((extract(month from public.th_today())::int + 6) % 12) + 1, 10);
    perform public.set_my_birth_date(d1);
    perform public.set_my_birth_date(d2);
    begin
      perform public.set_my_birth_date(date '1996-01-01');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-09','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-09','ok',sqlerrm = 'BIRTH_DATE_LOCKED','m',sqlerrm)); end;
    begin
      perform public.set_my_birth_date(public.th_today() + 1);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-09b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-09b','ok',sqlerrm = 'INVALID_BIRTH_DATE','m',sqlerrm)); end;

    -- ===================== แคตตาล็อกและสิทธิ์ =====================
    begin
      insert into public.products (sku, name, slug, brand_id, category_id, price) values ('GA-MS-900','x','x-900',brand_any,cat_acc,1);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-10','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-10','ok',sqlstate = '42501','m',sqlerrm)); end;
    perform set_config('role', 'anon', true); perform set_config('request.jwt.claim.sub', '', true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-11','ok',
      (select count(*) from public.products where status = 'inactive') = 0
      and (select count(*) from public.v_product_catalog) = (select count(*) from public.products),
      'm','guest sees only active products'));

    -- ===================== ตะกร้าและการสั่งซื้อ — as A =====================
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_a::text, true);
    select id into v_cart from public.carts where user_id = auth.uid();
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p1, 1), (v_cart, p14, 1);
    perform set_config('role', 'none', true);
    update public.products set status = 'inactive' where id = p12;       -- an inactive product for TC-DB-12
    perform set_config('role', 'authenticated', true);
    begin
      insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p12, 1);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-12','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-12','ok',sqlstate = '42501','m',sqlerrm)); end;
    perform set_config('role', 'none', true);
    update public.products set status = 'active' where id = p12;
    perform set_config('role', 'authenticated', true);
    begin
      insert into public.orders (order_number, user_id, subtotal, total_amount, recipient_name, recipient_phone, shipping_address)
      values ('X', auth.uid(), 1, 1, 'x', '0800000000', '1234567890 address');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-13','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-13','ok',sqlstate = '42501','m',sqlerrm)); end;
    v_no := public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
    select * into o from public.orders where order_number = v_no;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-14a','ok',
      o.subtotal = 8480 and o.shipping_fee = 0 and o.total_amount = 8480 and o.status = 'pending_payment'
      and v_no like 'GA-' || to_char(public.th_today(), 'YYYYMMDD') || '-%'
      and not exists (select 1 from public.cart_items ci join public.carts c on c.id = ci.cart_id where c.user_id = auth.uid()),
      'm', v_no || ' subtotal ' || o.subtotal || ' total ' || o.total_amount));
    v_oid := o.id;
    perform set_config('role', 'none', true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-14b','ok',
      (select stock_quantity from public.products where id = p1) = s1_before - 1
      and (select stock_quantity from public.products where id = p14) = s14_before - 1
      and (select sold_count from public.products where id = p1) = sold1_before
      and (select sold_count from public.products where id = p14) = sold14_before
      and (select count(*) from public.stock_movements where order_id = v_oid and movement_type = 'order') = 2,
      'm','stock −1 each · sold_count unchanged · 2 movements'));
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_b::text, true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-15','ok',
      (select count(*) from public.orders) = 0 and (select count(*) from public.order_items) = 0,'m','B sees no orders of A'));
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    select id into v_cart from public.carts where user_id = auth.uid();
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p1, 1), (v_cart, p14, 1);
    v_no := public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, 'welcome10');
    select * into o from public.orders where order_number = v_no;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-16','ok',
      o.discount_amount = 300 and o.total_amount = 8180 and o.coupon_code = 'WELCOME10','m','discount ' || o.discount_amount || ' total ' || o.total_amount));
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p2, 1);
    j := public.validate_coupon('WELCOME10');
    begin
      perform public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, 'WELCOME10');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-17','ok',false,'m','no error'));
    exception when others then
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-17','ok',
        j ->> 'reason' = 'PER_USER_LIMIT_REACHED' and sqlerrm = 'COUPON_PER_USER_LIMIT_REACHED'
        and (select count(*) from public.cart_items where cart_id = v_cart) = 1,'m',sqlerrm));
    end;
    delete from public.cart_items where cart_id = v_cart;
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p17, 2);
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    perform public.admin_adjust_stock(p17, -1, 'adjustment', 'ทดสอบสต็อกไม่พอ');
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    n := (select count(*) from public.orders);
    begin
      perform public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-18','ok',false,'m','no error'));
    exception when others then
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-18','ok',
        sqlerrm = 'OUT_OF_STOCK:GA-CH-002' and (select count(*) from public.orders) = n,'m',sqlerrm));
    end;
    delete from public.cart_items where product_id = p17 and cart_id = v_cart;

    -- ===================== ชำระเงิน Demo =====================
    select * into o from public.orders where user_id = u_a and discount_amount = 300;
    begin
      perform public.submit_payment(o.id, 'promptpay_demo', 'someone-else/slip.jpg', null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-19a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-19a','ok',sqlerrm = 'INVALID_SLIP_PATH','m',sqlerrm)); end;
    v_pay := public.submit_payment(o.id, 'promptpay_demo', auth.uid()::text || '/' || o.id::text || '/slip.jpg', null);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-19b','ok',
      (select status from public.orders where id = o.id) = 'payment_submitted'
      and (select amount = 8180 and is_demo and status = 'submitted' from public.payments where id = v_pay),'m','payment_submitted 8,180 demo'));
    begin
      perform public.admin_verify_payment(v_pay, true, null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-20','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-20','ok',sqlerrm = 'FORBIDDEN','m',sqlerrm)); end;
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    perform public.admin_verify_payment(v_pay, true, null);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-21','ok',
      (select status from public.orders where id = o.id) = 'paid'
      and (select sold_count from public.products where id = p1) = sold1_before + 1
      and (select sold_count from public.products where id = p14) = sold14_before + 1,'m','paid · sold_count +1'));
    begin
      perform public.admin_update_order_status(o.id, 'completed', null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-22a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-22a','ok',sqlerrm = 'INVALID_TRANSITION','m',sqlerrm)); end;
    perform public.admin_update_order_status(o.id, 'shipped', 'TRACK-DEMO-001');
    perform public.admin_update_order_status(o.id, 'completed', null);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-22b','ok',
      (select points_balance from public.profiles where id = u_a) = 81,'m','points ' || (select points_balance from public.profiles where id = u_a)));
    begin
      perform public.admin_update_order_status(o.id, 'completed', null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-23','ok',false,'m','no error'));
    exception when others then
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-23','ok',
        sqlerrm = 'INVALID_TRANSITION' and (select count(*) from public.points_transactions where order_id = o.id and type = 'earn') = 1,'m',sqlerrm));
    end;

    -- ===================== แลกรางวัล (R-01 regression) =====================
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    v_rid := public.redeem_reward(r_keyring);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-24','ok',
      (select points_balance from public.profiles where id = auth.uid()) = 31
      and (select stock_quantity from public.rewards where id = r_keyring) = key_stock_before - 1
      and (select points = -50 and balance_after = 31 from public.points_transactions where redemption_id = v_rid and type = 'redeem'),
      'm','balance 31 · reward stock −1'));
    begin
      perform public.redeem_reward(r_cup);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-25','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-25','ok',sqlerrm = 'INSUFFICIENT_POINTS','m',sqlerrm)); end;
    perform set_config('role', 'none', true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-26','ok', not exists (
      select 1 from public.profiles p
       where p.points_balance <> coalesce((select sum(points) from public.points_transactions t where t.user_id = p.id), 0)),
      'm','ledger sum = balance for every account (real + test)'));
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_d::text, true);
    perform public.admin_update_redemption(v_rid, 'cancelled', 'ทดสอบยกเลิก');
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-27','ok',
      (select points_balance from public.profiles where id = u_a) = 81
      and (select stock_quantity from public.rewards where id = r_keyring) = key_stock_before,'m','refund 50 · reward stock back'));

    -- ===================== ยกเลิกคำสั่งซื้อ =====================
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    select * into o from public.orders where status = 'pending_payment' and user_id = auth.uid() order by created_at limit 1;
    perform public.cancel_order(o.id, 'เปลี่ยนใจ');
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-28','ok',
      (select status from public.orders where id = o.id) = 'cancelled'
      and (select stock_quantity from public.products where id = p1) = s1_before - 1,'m','cancelled · stock returned'));
    perform set_config('request.jwt.claim.sub', u_b::text, true);
    select id into v_cart from public.carts where user_id = auth.uid();
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p5, 1);
    v_no := public.place_order('Member B', '0811111111', '456 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
    select id into v_oid from public.orders where order_number = v_no;
    v_pay := public.submit_payment(v_oid, 'bank_transfer_demo', null, null);
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    perform public.admin_verify_payment(v_pay, true, null);
    perform set_config('request.jwt.claim.sub', u_b::text, true);
    begin
      perform public.cancel_order(v_oid, 'ขอยกเลิก');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-29a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-29a','ok',sqlerrm = 'INVALID_ORDER_STATUS','m',sqlerrm)); end;
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    perform public.cancel_order(v_oid, 'Admin ยกเลิก (ทดสอบ)');
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-29b','ok',
      (select stock_quantity from public.products where id = p5) = s5_before
      and (select sold_count from public.products where id = p5) = sold5_before
      and (select status from public.payments where order_id = v_oid) = 'voided','m','stock back · sold −1 · voided'));
    perform set_config('request.jwt.claim.sub', u_b::text, true);
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p2, 1);
    v_no := public.place_order('Member B', '0811111111', '456 ถนนตัวอย่าง เขตตัวอย่าง', null, 'WELCOME10');
    select id into v_oid from public.orders where order_number = v_no;
    perform public.cancel_order(v_oid, 'ทดสอบคืนคูปอง');
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p2, 1);
    j := public.validate_coupon('WELCOME10');
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-30','ok',
      (j ->> 'valid')::boolean and (j ->> 'discount')::numeric = 300,'m',j::text));
    delete from public.cart_items where cart_id = v_cart;

    -- ===================== วันเกิด / คูปอง (R-05, R-06) =====================
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    begin
      perform public.claim_birthday_coupon();
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-31a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-31a','ok',sqlerrm = 'NOT_BIRTHDAY_MONTH','m',sqlerrm)); end;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-32a','ok',(select count(*) from public.coupons) = 0,'m','member without coupons sees 0'));
    perform set_config('request.jwt.claim.sub', u_e::text, true);
    begin
      perform public.claim_birthday_coupon();
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-31b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-31b','ok',sqlerrm = 'BIRTH_DATE_REQUIRED','m',sqlerrm)); end;
    perform set_config('request.jwt.claim.sub', u_c::text, true);
    j := public.claim_birthday_coupon();
    v_exp := (j ->> 'expires_at')::timestamptz;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-31c','ok',
      j ->> 'code' like 'BDAY%' and (v_exp at time zone 'Asia/Bangkok') = date_trunc('month', public.th_now()) + interval '1 month',
      'm',(j ->> 'code') || ' expires ' || (v_exp at time zone 'Asia/Bangkok')));
    begin
      perform public.claim_birthday_coupon();
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-31d','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-31d','ok',sqlerrm = 'ALREADY_CLAIMED','m',sqlerrm)); end;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-32b','ok',
      (select count(*) from public.coupons) = 1 and (select coupon_type from public.coupons limit 1) = 'birthday'
      and (select discount_value from public.coupons limit 1) = 10,'m','sees only own birthday template'));
    select id into v_cart from public.carts where user_id = auth.uid();
    select code into v_code from public.member_coupons where user_id = auth.uid();
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p2, 1);
    v_no := public.place_order('Birthday C', '0822222222', '789 ถนนตัวอย่าง เขตตัวอย่าง', null, v_code);
    select * into o from public.orders where order_number = v_no;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-33a','ok',
      o.discount_amount = 500 and o.total_amount = 4790
      and (select used_at is not null and order_id = o.id from public.member_coupons where code = v_code),'m','discount ' || o.discount_amount || ' total ' || o.total_amount));
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p2, 1);
    begin
      perform public.place_order('Birthday C', '0822222222', '789 ถนนตัวอย่าง เขตตัวอย่าง', null, v_code);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-33b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-33b','ok',sqlerrm = 'COUPON_ALREADY_USED','m',sqlerrm)); end;
    delete from public.cart_items where cart_id = v_cart;
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    select id into v_cart from public.carts where user_id = auth.uid();
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p2, 1);
    j := public.validate_coupon(v_code);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-34','ok',j ->> 'reason' = 'INVALID_CODE','m',j::text));
    delete from public.cart_items where cart_id = v_cart;

    -- ===================== สินค้าถูกปิดขายในตะกร้า (R-04) =====================
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p10, 1);
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    update public.products set status = 'inactive' where id = p10;
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    select * into r from public.get_my_cart() where sku = 'GA-KB-005';
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-35a','ok',
      r.name = 'Keychron K8 Pro' and r.product_status = 'inactive' and not r.is_purchasable
      and (select count(*) from public.v_product_catalog where sku = 'GA-KB-005') = 0,'m','inactive item still listed, not purchasable'));
    begin
      perform public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-35b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-35b','ok',sqlerrm = 'OUT_OF_STOCK:GA-KB-005','m',sqlerrm)); end;
    delete from public.cart_items where product_id = p10 and cart_id = v_cart;
    perform set_config('request.jwt.claim.sub', u_b::text, true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-50','ok',
      (select count(*) from public.get_my_cart()) = 0 and (select count(*) from public.cart_items) = 0,'m','B cannot see A cart'));

    -- ===================== การจองบริการ (R-02, R-03, R-11) =====================
    perform set_config('role', 'none', true);
    select d into bk_day from generate_series(1, 25) g, lateral (select public.th_today() + g as d) x
     where not exists (select 1 from public.bookings b where b.service_id = svc and b.booking_date = x.d and b.status <> 'cancelled')
     order by g limit 1;
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_a::text, true);
    v_no := public.create_booking(svc, bk_day, '10:00', 'Member A', '0800000000', 'dbtest.a@example.com', null);
    select id into bk_a from public.bookings where booking_number = v_no;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-36a','ok',
      v_no like 'BK-' || to_char(public.th_today(), 'YYYYMMDD') || '-%'
      and (select price_snapshot = 200 and status = 'pending' from public.bookings where booking_number = v_no),'m',v_no || ' on ' || bk_day));
    perform set_config('role', 'anon', true); perform set_config('request.jwt.claim.sub', '', true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-36b','ok',
      (select array_agg(time_slot) from public.get_booked_slots(svc, bk_day)) = array['10:00'::time]
      and not exists (select 1 from public.get_booked_slots(svc, bk_day) g where to_jsonb(g) ?| array['user_id','contact_name','contact_phone','contact_email']),
      'm','guest gets time_slot only'));
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_b::text, true);
    begin
      perform public.create_booking(svc, bk_day, '10:00', 'B', '0811111111', 'dbtest.b@example.com', null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-36c','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-36c','ok',sqlerrm = 'SLOT_TAKEN','m',sqlerrm)); end;
    begin
      perform public.create_booking(svc, public.th_today() - 1, '10:00', 'B', '0811111111', 'dbtest.b@example.com', null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-36d','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-36d','ok',sqlerrm = 'DATE_IN_PAST','m',sqlerrm)); end;
    begin
      perform public.create_booking(svc, bk_day, '11:00', 'B', '0811111111', 'dbtest.b@example.com', null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-36e','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-36e','ok',sqlerrm = 'INVALID_TIME_SLOT','m',sqlerrm)); end;
    begin
      perform public.cancel_booking(bk_a);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-37a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-37a','ok',sqlerrm = 'BOOKING_NOT_CANCELLABLE','m',sqlerrm)); end;
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    begin
      update public.bookings set status = 'confirmed' where id = bk_a;
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-37b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-37b','ok',sqlstate = '42501','m',sqlerrm)); end;
    perform public.cancel_booking(bk_a);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-37c','ok',(select status from public.bookings where id = bk_a) = 'cancelled','m','own pending booking cancelled'));
    perform set_config('request.jwt.claim.sub', u_b::text, true);
    v_no := public.create_booking(svc, bk_day, '10:00', 'Member B', '0811111111', 'dbtest.b@example.com', null);
    select id into bk_b from public.bookings where booking_number = v_no;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-37d','ok',v_no is not null,'m','freed slot re-booked ' || v_no));
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    begin
      perform public.admin_update_booking(bk_b, 'completed', null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-38a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-38a','ok',sqlerrm = 'INVALID_TRANSITION','m',sqlerrm)); end;
    perform public.admin_update_booking(bk_b, 'confirmed', 'ยืนยันแล้ว');
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-38b','ok',(select status from public.bookings where id = bk_b) = 'confirmed','m','confirmed'));

    -- ===================== ติดต่อร้าน (R-14) =====================
    perform set_config('role', 'anon', true); perform set_config('request.jwt.claim.sub', '', true);
    perform public.submit_contact_message('Guest', 'dbtest.guest@example.com', 'สอบถาม', 'ข้อความทดสอบครั้งที่ 1');
    perform public.submit_contact_message('Guest', 'dbtest.guest@example.com', 'สอบถาม', 'ข้อความทดสอบครั้งที่ 2');
    perform public.submit_contact_message('Guest', 'dbtest.guest@example.com', 'สอบถาม', 'ข้อความทดสอบครั้งที่ 3');
    begin
      perform public.submit_contact_message('Guest', 'DBTEST.GUEST@example.com', 'สอบถาม', 'ข้อความทดสอบครั้งที่ 4');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-39a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-39a','ok',sqlerrm = 'RATE_LIMITED','m',sqlerrm)); end;
    begin
      perform count(*) from public.contact_messages;
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-39b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-39b','ok',sqlstate = '42501','m',sqlerrm)); end;
    begin
      insert into public.contact_messages (name, email, subject, message) values ('x','x@example.com','x','xxxxxxxxxxxx');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-39c','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-39c','ok',sqlstate = '42501','m',sqlerrm)); end;

    -- ===================== Gallery (R-09) =====================
    perform set_config('role', 'none', true);
    insert into public.media_files (bucket, storage_path, public_url, file_name, mime_type, size_bytes, category, uploaded_by)
    values ('site-media', 'gallery/dbtest-g1.webp', 'https://example.invalid/site-media/gallery/dbtest-g1.webp', 'dbtest-g1.webp', 'image/webp', 1000, 'gallery', u_d)
    returning id into media_g;
    perform set_config('role', 'anon', true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-40a','ok',
      exists (select 1 from public.get_public_gallery() g where g.public_url like '%gallery/dbtest-g1.webp')
      and not exists (select 1 from public.get_public_gallery() g where to_jsonb(g) ? 'uploaded_by'),
      'm','gallery via RPC, no uploaded_by'));
    begin
      perform count(*) from public.media_files;
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-40b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-40b','ok',sqlstate = '42501','m',sqlerrm)); end;

    -- ===================== Admin: บัญชี/สต็อก/สินค้า =====================
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_d::text, true);
    begin
      perform public.admin_set_account_status(auth.uid(), 'suspended');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-41a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-41a','ok',sqlerrm = 'CANNOT_CHANGE_SELF','m',sqlerrm)); end;
    perform public.admin_set_account_status(u_e, 'suspended');
    perform set_config('request.jwt.claim.sub', u_e::text, true);
    select id into v_cart from public.carts where user_id = auth.uid();
    perform set_config('role', 'none', true);
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, p2, 1);   -- owner: RLS may block suspended users
    perform set_config('role', 'authenticated', true);
    begin
      perform public.place_order('E', '0833333333', '1010 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-41b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-41b','ok',sqlerrm = 'ACCOUNT_SUSPENDED','m',sqlerrm)); end;
    begin
      perform public.create_booking(svc, bk_day, '13:00', 'E', '0833333333', 'dbtest.e@example.com', null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-41c','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-41c','ok',sqlerrm = 'ACCOUNT_SUSPENDED','m',sqlerrm)); end;
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    begin
      perform public.admin_adjust_stock(p17, -5, 'adjustment', 'ทดสอบ');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-42a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-42a','ok',sqlerrm = 'NEGATIVE_STOCK','m',sqlerrm)); end;
    v_after := public.admin_adjust_stock(p12, 5, 'restock', null);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-42b','ok',
      v_after = s12_before + 5
      and exists (select 1 from public.stock_movements where product_id = p12 and movement_type = 'restock' and quantity_change = 5),
      'm','restock +5 → ' || v_after));
    begin
      delete from public.products where id = p1;
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-43a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-43a','ok',sqlstate = '23503','m',sqlerrm)); end;
    insert into public.products (sku, name, slug, brand_id, category_id, price) values ('GA-AC-099', 'DB test item', 'db-test-item-099', brand_any, cat_acc, 100);
    delete from public.products where sku = 'GA-AC-099';
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-43b','ok',not exists (select 1 from public.products where sku = 'GA-AC-099'),'m','unsold product deleted'));
    begin
      update public.products set stock_quantity = 999 where id = p2;
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-44a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-44a','ok',sqlstate = '42501','m',sqlerrm)); end;
    update public.products set price = 5390 where id = p2;
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-44b','ok',(select price from public.products where id = p2) = 5390,'m','admin price update'));
    update public.products set price = 5290 where id = p2;

    -- ===================== ราคา/โปรโมชั่น (R-12) =====================
    update public.promotions set is_active = true where slug = 'headset-week';
    insert into public.promotions (name, slug, discount_type, discount_value, start_at, end_at, is_active)
    values ('Test 5%', 'dbtest-5', 'percentage', 5, now() - interval '1 hour', now() + interval '1 day', true);
    insert into public.promotion_products (promotion_id, product_id) select id, p11 from public.promotions where slug = 'dbtest-5';
    perform set_config('role', 'anon', true); perform set_config('request.jwt.claim.sub', '', true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-45a','ok',
      (select effective_price from public.v_product_catalog where sku = 'GA-HS-004') = 3141.00
      and (select effective_price from public.v_product_catalog where sku = 'GA-HS-003') = 6291.00,'m','headset week 10%'));
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-45b','ok',
      (select effective_price from public.v_product_catalog where sku = 'GA-HS-001') = 4590.00,'m','lowest price, no stacking'));
    begin
      perform public.place_order('x','0800000000','xxxxxxxxxxxx',null,null);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-46a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-46a','ok',sqlstate = '42501','m',sqlerrm)); end;
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_a::text, true);
    begin
      perform * from public._evaluate_coupon(auth.uid(), 'WELCOME10', 10000);
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-46b','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-46b','ok',sqlstate = '42501','m',sqlerrm)); end;
    begin
      perform * from public.report_sales(public.th_today(), public.th_today(), 'day');
      res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-47a','ok',false,'m','no error'));
    exception when others then res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-47a','ok',sqlerrm = 'FORBIDDEN','m',sqlerrm)); end;
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    -- baseline = completed sales from real data in the same window, excluding the test users' orders
    perform set_config('role', 'none', true);
    sales_base := coalesce((select sum(total_amount) from public.orders
                             where status in ('paid','shipped','completed') and user_id not in (u_a,u_b,u_c,u_d,u_e)
                               and created_at >= (public.th_today() - 1)::timestamp at time zone 'Asia/Bangkok'
                               and created_at <  (public.th_today() + 2)::timestamp at time zone 'Asia/Bangkok'), 0);
    perform set_config('role', 'authenticated', true);
    j := public.admin_dashboard_stats(public.th_today() - 1, public.th_today() + 1);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-47b','ok',
      (select sum(sales) from public.report_sales(public.th_today() - 1, public.th_today() + 1, 'day')) = sales_base + 8180
      and (j ->> 'total_sales')::numeric = sales_base + 8180
      and (select sum(sales) from public.report_sales(public.th_today() - 1, public.th_today() + 1, 'day', false))
          = coalesce((select sum(total_amount) from public.orders where status in ('paid','shipped','completed') and not is_demo
                        and created_at >= (public.th_today() - 1)::timestamp at time zone 'Asia/Bangkok'
                        and created_at <  (public.th_today() + 2)::timestamp at time zone 'Asia/Bangkok'), 0),
      'm','report = dashboard = baseline ' || sales_base || ' + 8,180; demo filter matches orders.is_demo'));

    -- ===================== เขตเวลา (R-06) =====================
    perform set_config('role', 'none', true);
    perform set_config('timezone', 'America/Los_Angeles', true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-48','ok',public.th_today() = (now() at time zone 'Asia/Bangkok')::date,'m','th_today under LA session tz'));
    perform set_config('timezone', 'UTC', true);

    -- ===================== ภาพที่ถูกใช้อยู่ (R-28) =====================
    insert into public.media_files (bucket, storage_path, public_url, file_name, mime_type, size_bytes, category)
    values ('site-media', 'category/dbtest-c1.webp', 'https://example.invalid/site-media/category/dbtest-c1.webp', 'dbtest-c1.webp', 'image/webp', 1000, 'category')
    returning id into media_c;
    update public.categories set image_url = 'https://example.invalid/site-media/category/dbtest-c1.webp' where slug = 'gaming-mouse';
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_d::text, true);
    res := res || jsonb_build_array(jsonb_build_object('t','TC-DB-49','ok',
      exists (select 1 from public.media_usage(media_c) where source = 'categories' and ref = 'gaming-mouse'),'m','media_usage finds category gaming-mouse'));
  exception when others then
    res := res || jsonb_build_array(jsonb_build_object('t','ABORT','ok',false,'m',sqlstate || ' ' || sqlerrm));
  end;
  -- Always roll back: the exception aborts the statement, so nothing above is kept.
  -- Compact summary (the Management API truncates long error messages): counts, failures with detail, passed ids.
  raise exception 'DBTEST_RESULTS total=% pass=% fail=% || FAILED: % || PASSED: %',
    jsonb_array_length(res),
    (select count(*) from jsonb_array_elements(res) e where (e ->> 'ok')::boolean),
    (select count(*) from jsonb_array_elements(res) e where not (e ->> 'ok')::boolean),
    coalesce((select string_agg((e ->> 't') || ' [' || left(e ->> 'm', 160) || ']', ' ; ')
                from jsonb_array_elements(res) e where not (e ->> 'ok')::boolean), 'none'),
    (select string_agg(replace(e ->> 't', 'TC-DB-', ''), ',') from jsonb_array_elements(res) e where (e ->> 'ok')::boolean);
end
$dbtest$;
