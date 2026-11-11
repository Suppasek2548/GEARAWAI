-- =====================================================================
-- GEARAWAI_DB_TESTS.sql — ชุดทดสอบ SQL (TC-DB-01 ถึง TC-DB-50)
-- รันหลัง 00_supabase_shim.sql → GEARAWAI_DB_SCHEMA_DRAFT.sql → 01_seed_test.sql
-- จำลองผู้ใช้ด้วย SET ROLE (anon/authenticated) + request.jwt.claim.sub แบบเดียวกับ Supabase
-- ผลลัพธ์: NOTICE "PASS ..." หรือ "FAIL ..."
-- =====================================================================
\set ON_ERROR_STOP off
\set as_admin 'set role authenticated; select set_config(''request.jwt.claim.sub'',''00000000-0000-0000-0000-0000000000d1'',false);'
\set as_a 'set role authenticated; select set_config(''request.jwt.claim.sub'',''00000000-0000-0000-0000-0000000000a1'',false);'
\set as_b 'set role authenticated; select set_config(''request.jwt.claim.sub'',''00000000-0000-0000-0000-0000000000b1'',false);'
\set as_c 'set role authenticated; select set_config(''request.jwt.claim.sub'',''00000000-0000-0000-0000-0000000000c1'',false);'
\set as_e 'set role authenticated; select set_config(''request.jwt.claim.sub'',''00000000-0000-0000-0000-0000000000e1'',false);'
\set as_anon 'set role anon; select set_config(''request.jwt.claim.sub'','''',false);'
\set as_owner 'reset role; select set_config(''request.jwt.claim.sub'','''',false);'
\pset tuples_only on
\pset format unaligned

-- ===================== สมัครสมาชิก (R-07) =====================
:as_owner
do $$ begin
  perform test.ok((select full_name = 'member.b' from public.profiles where id = '00000000-0000-0000-0000-0000000000b1')
     and exists (select 1 from public.carts where user_id = '00000000-0000-0000-0000-0000000000b1')
     and exists (select 1 from public.wishlists where user_id = '00000000-0000-0000-0000-0000000000b1'),
     'TC-DB-01 สมัครโดยไม่ส่งชื่อ → ใช้ชื่อสำรอง + สร้าง cart/wishlist');
  perform test.ok((select birth_date is null from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
     'TC-DB-02 วันเกิดรูปแบบผิด (15/05/2008) → สมัครสำเร็จ birth_date = NULL');
  perform test.ok((select birth_date is null from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'),
     'TC-DB-03 วันเกิดในอนาคต → birth_date = NULL');
  perform test.ok((select role = 'member' from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'),
     'TC-DB-04 metadata role=admin ถูกละเลย → role = member');
end $$;

-- ===================== สิทธิ์แก้ไขโปรไฟล์ (R-01) =====================
:as_a
do $$ declare n int; begin
  update public.profiles set full_name = 'Member A Updated' where id = '00000000-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  perform test.ok(n = 1, 'TC-DB-05 สมาชิกแก้ชื่อตนเองได้');
end $$;
do $$ begin
  begin
    update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
    perform test.ok(false, 'TC-DB-06 สมาชิกแก้ role ไม่ได้ (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-06 สมาชิกแก้ role ไม่ได้ → ' || sqlerrm); end;
end $$;
do $$ begin
  begin
    update public.profiles set points_balance = 99999 where id = '00000000-0000-0000-0000-0000000000a1';
    perform test.ok(false, 'TC-DB-07 สมาชิกแก้คะแนนไม่ได้ (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-07 สมาชิกแก้คะแนนไม่ได้ → ' || sqlerrm); end;
end $$;
do $$ declare n int; begin
  update public.profiles set full_name = 'Hacked' where id = '00000000-0000-0000-0000-0000000000b1';
  get diagnostics n = row_count;
  perform test.ok(n = 0, 'TC-DB-08 สมาชิกแก้โปรไฟล์คนอื่นไม่ได้ (0 แถว)');
end $$;
do $$ declare d1 date := make_date(1995, ((extract(month from public.th_today())::int + 5) % 12) + 1, 10);
                d2 date := make_date(1995, ((extract(month from public.th_today())::int + 6) % 12) + 1, 10);
begin
  perform public.set_my_birth_date(d1);
  perform public.set_my_birth_date(d2);
  begin
    perform public.set_my_birth_date(date '1996-01-01');
    perform test.ok(false, 'TC-DB-09 แก้วันเกิดครั้งที่ 2 ถูกล็อก (ไม่มี error)');
  exception when others then
    perform test.ok(sqlerrm = 'BIRTH_DATE_LOCKED', 'TC-DB-09 ตั้งครั้งแรก + แก้ 1 ครั้งได้ / ครั้งต่อไป → ' || sqlerrm);
  end;
  begin
    perform public.set_my_birth_date(public.th_today() + 1);
    perform test.ok(false, 'TC-DB-09b วันเกิดอนาคต (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'INVALID_BIRTH_DATE', 'TC-DB-09b วันเกิดอนาคต → ' || sqlerrm); end;
end $$;

-- ===================== แคตตาล็อกและสิทธิ์ =====================
do $$ begin
  begin
    insert into public.products (sku, name, slug, brand_id, category_id, price)
    values ('GA-MS-900','x','x-900','70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',1);
    perform test.ok(false, 'TC-DB-10 สมาชิกเพิ่มสินค้าไม่ได้ (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-10 สมาชิกเพิ่มสินค้าไม่ได้ → ' || sqlerrm); end;
end $$;
:as_anon
do $$ begin
  perform test.ok((select count(*) from public.products where status = 'inactive') = 0
              and (select count(*) from public.v_product_catalog) = 10,
     'TC-DB-11 Guest เห็นเฉพาะสินค้า active (10 รายการ)');
end $$;

-- ===================== ตะกร้าและการสั่งซื้อ =====================
:as_a
do $$ declare v_cart uuid; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000001', 1);
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000014', 1);
  begin
    insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000099', 1);
    perform test.ok(false, 'TC-DB-12 เพิ่มสินค้าปิดขายลงตะกร้าไม่ได้ (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-12 เพิ่มสินค้าปกติได้ / สินค้าปิดขายไม่ได้ → ' || sqlerrm); end;
end $$;
do $$ begin
  begin
    insert into public.orders (order_number, user_id, subtotal, total_amount, recipient_name, recipient_phone, shipping_address)
    values ('X', auth.uid(), 1, 1, 'x', '0800000000', '1234567890 address');
    perform test.ok(false, 'TC-DB-13 Insert orders ตรงไม่ได้ (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-13 Insert orders ตรงไม่ได้ → ' || sqlerrm); end;
end $$;
do $$ declare v_no text; o public.orders%rowtype; begin
  v_no := public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
  select * into o from public.orders where order_number = v_no;
  perform test.ok(o.subtotal = 8480 and o.shipping_fee = 0 and o.total_amount = 8480 and o.status = 'pending_payment'
              and v_no like 'GA-' || to_char(public.th_today(), 'YYYYMMDD') || '-%'
              and not exists (select 1 from public.cart_items ci join public.carts c on c.id = ci.cart_id where c.user_id = auth.uid()),
     'TC-DB-14a place_order: ยอด 8,480 ส่งฟรี เลขที่ตามวันไทย ล้างตะกร้า (' || v_no || ')');
end $$;
:as_owner
do $$ begin
  perform test.ok((select stock_quantity from public.products where sku = 'GA-MS-001') = 11
              and (select stock_quantity from public.products where sku = 'GA-HS-004') = 24
              and (select sum(sold_count) from public.products) = 0
              and (select count(*) from public.stock_movements where movement_type = 'order') = 2,
     'TC-DB-14b ตัดสต็อก 12→11, 25→24 · sold_count ยังเป็น 0 (D-07) · stock_movements 2 แถว');
end $$;
:as_b
do $$ begin
  perform test.ok((select count(*) from public.orders) = 0 and (select count(*) from public.order_items) = 0,
     'TC-DB-15 สมาชิก B มองไม่เห็นคำสั่งซื้อของ A');
end $$;
:as_a
do $$ declare v_cart uuid; v_no text; o public.orders%rowtype; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000001', 1), (v_cart, '10000000-0000-0000-0000-000000000014', 1);
  v_no := public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, 'welcome10');
  select * into o from public.orders where order_number = v_no;
  perform test.ok(o.discount_amount = 300 and o.total_amount = 8180 and o.coupon_code = 'WELCOME10',
     'TC-DB-16 คูปอง WELCOME10 (ตัวพิมพ์เล็ก) ลด 300 → 8,180');
end $$;
do $$ declare v_cart uuid; j jsonb; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000002', 1);
  j := public.validate_coupon('WELCOME10');
  begin
    perform public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, 'WELCOME10');
    perform test.ok(false, 'TC-DB-17 ใช้คูปองเกินสิทธิ์ (ไม่มี error)');
  exception when others then
    perform test.ok(j ->> 'reason' = 'PER_USER_LIMIT_REACHED' and sqlerrm = 'COUPON_PER_USER_LIMIT_REACHED'
                and (select count(*) from public.cart_items where cart_id = v_cart) = 1,
       'TC-DB-17 ใช้ WELCOME10 ซ้ำ → ' || sqlerrm || ' · ตะกร้าไม่เปลี่ยน');
  end;
  delete from public.cart_items where cart_id = v_cart;
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000017', 2);
end $$;
:as_admin
select public.admin_adjust_stock('10000000-0000-0000-0000-000000000017', -1, 'adjustment', 'ทดสอบสต็อกไม่พอ') is not null;
:as_a
do $$ declare n_before int; begin
  select count(*) into n_before from public.orders;
  begin
    perform public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
    perform test.ok(false, 'TC-DB-18 สต็อกไม่พอ (ไม่มี error)');
  exception when others then
    perform test.ok(sqlerrm = 'OUT_OF_STOCK:GA-CH-002' and (select count(*) from public.orders) = n_before,
       'TC-DB-18 สต็อกไม่พอ → ' || sqlerrm || ' · ไม่สร้าง Order');
  end;
  delete from public.cart_items where product_id = '10000000-0000-0000-0000-000000000017';
end $$;

-- ===================== ชำระเงิน Demo =====================
do $$ declare o public.orders%rowtype; v_pay uuid; begin
  select * into o from public.orders where discount_amount = 300;
  begin
    perform public.submit_payment(o.id, 'promptpay_demo', 'someone-else/slip.jpg', null);
    perform test.ok(false, 'TC-DB-19a path สลิปผิด (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'INVALID_SLIP_PATH', 'TC-DB-19a path สลิปของคนอื่น → ' || sqlerrm); end;
  v_pay := public.submit_payment(o.id, 'promptpay_demo', auth.uid()::text || '/' || o.id::text || '/slip.jpg', null);
  perform test.ok((select status from public.orders where id = o.id) = 'payment_submitted'
              and (select amount = 8180 and is_demo and status = 'submitted' from public.payments where id = v_pay),
     'TC-DB-19b แจ้งชำระ (Demo) → payment_submitted, amount 8,180, is_demo');
  begin
    perform public.admin_verify_payment(v_pay, true, null);
    perform test.ok(false, 'TC-DB-20 สมาชิกเรียก admin_verify_payment (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'FORBIDDEN', 'TC-DB-20 สมาชิกเรียก RPC Admin → ' || sqlerrm); end;
end $$;
:as_admin
do $$ declare o public.orders%rowtype; begin
  select * into o from public.orders where discount_amount = 300;
  perform public.admin_verify_payment((select id from public.payments where order_id = o.id), true, null);
  perform test.ok((select status from public.orders where id = o.id) = 'paid'
              and (select sold_count from public.products where sku = 'GA-MS-001') = 1
              and (select sold_count from public.products where sku = 'GA-HS-004') = 1,
     'TC-DB-21 Admin ยืนยัน → paid · sold_count +1 (D-07)');
  begin
    perform public.admin_update_order_status(o.id, 'completed', null);
    perform test.ok(false, 'TC-DB-22a paid→completed ข้ามขั้น (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'INVALID_TRANSITION', 'TC-DB-22a ข้ามขั้น paid→completed → ' || sqlerrm); end;
  perform public.admin_update_order_status(o.id, 'shipped', 'TRACK-DEMO-001');
  perform public.admin_update_order_status(o.id, 'completed', null);
  perform test.ok((select points_balance from public.profiles where id = o.user_id) = 81,
     'TC-DB-22b completed → ได้ 81 คะแนน ((8,480−300)/100 ไม่รวมค่าส่ง)');
  begin
    perform public.admin_update_order_status(o.id, 'completed', null);
    perform test.ok(false, 'TC-DB-23 ให้คะแนนซ้ำ (ไม่มี error)');
  exception when others then
    perform test.ok(sqlerrm = 'INVALID_TRANSITION'
                and (select count(*) from public.points_transactions where order_id = o.id and type = 'earn') = 1,
       'TC-DB-23 ปิดงานซ้ำไม่ได้ · มี earn เพียง 1 แถว');
  end;
end $$;

-- ===================== แลกรางวัล (R-01 regression) =====================
:as_a
do $$ declare v_rid uuid; begin
  v_rid := public.redeem_reward('30000000-0000-0000-0000-000000000002');
  perform test.ok((select points_balance from public.profiles where id = auth.uid()) = 31
              and (select stock_quantity from public.rewards where id = '30000000-0000-0000-0000-000000000002') = 49
              and (select points = -50 and balance_after = 31 from public.points_transactions where redemption_id = v_rid and type = 'redeem'),
     'TC-DB-24 แลกพวงกุญแจ 50 คะแนน → คงเหลือ 31 จริง · รางวัลเหลือ 49 (R-01)');
  begin
    perform public.redeem_reward('30000000-0000-0000-0000-000000000003');
    perform test.ok(false, 'TC-DB-25 คะแนนไม่พอ (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'INSUFFICIENT_POINTS', 'TC-DB-25 คะแนนไม่พอ → ' || sqlerrm); end;
end $$;
:as_owner
do $$ begin
  perform test.ok(not exists (
      select 1 from public.profiles p
       where p.points_balance <> coalesce((select sum(points) from public.points_transactions t where t.user_id = p.id), 0)),
     'TC-DB-26 ผลรวมประวัติคะแนน = คะแนนคงเหลือ ทุกบัญชี');
end $$;
:as_admin
do $$ begin
  perform public.admin_update_redemption((select id from public.reward_redemptions limit 1), 'cancelled', 'ทดสอบยกเลิก');
  perform test.ok((select points_balance from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 81
              and (select stock_quantity from public.rewards where id = '30000000-0000-0000-0000-000000000002') = 50,
     'TC-DB-27 Admin ยกเลิกการแลก → คืน 50 คะแนน + คืนรางวัล');
end $$;

-- ===================== ยกเลิกคำสั่งซื้อ =====================
:as_a
do $$ declare o public.orders%rowtype; begin
  select * into o from public.orders where status = 'pending_payment' and user_id = auth.uid() order by created_at limit 1;
  perform public.cancel_order(o.id, 'เปลี่ยนใจ');
  perform test.ok((select status from public.orders where id = o.id) = 'cancelled'
              and (select stock_quantity from public.products where sku = 'GA-MS-001') = 11,
     'TC-DB-28 สมาชิกยกเลิก pending → cancelled · คืนสต็อก');
end $$;
:as_b
do $$ declare v_cart uuid; v_no text; v_oid uuid; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000005', 1);
  v_no := public.place_order('Member B', '0811111111', '456 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
  select id into v_oid from public.orders where order_number = v_no;
  perform public.submit_payment(v_oid, 'bank_transfer_demo', null, null);
end $$;
:as_admin
select public.admin_verify_payment((select p.id from public.payments p join public.orders o on o.id = p.order_id
                                    where o.user_id = '00000000-0000-0000-0000-0000000000b1' and p.status = 'submitted'), true, null) is null;
:as_b
do $$ begin
  begin
    perform public.cancel_order((select id from public.orders where status = 'paid'), 'ขอยกเลิก');
    perform test.ok(false, 'TC-DB-29a สมาชิกยกเลิก Order ที่ชำระแล้ว (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'INVALID_ORDER_STATUS', 'TC-DB-29a สมาชิกยกเลิก paid ไม่ได้ → ' || sqlerrm); end;
end $$;
:as_admin
do $$ declare v_oid uuid; begin
  select id into v_oid from public.orders where user_id = '00000000-0000-0000-0000-0000000000b1' and status = 'paid';
  perform public.cancel_order(v_oid, 'Admin ยกเลิก (ทดสอบ)');
  perform test.ok((select stock_quantity from public.products where sku = 'GA-MS-005') = 20
              and (select sold_count from public.products where sku = 'GA-MS-005') = 0
              and (select status from public.payments where order_id = v_oid) = 'voided',
     'TC-DB-29b Admin ยกเลิกหลังชำระ → คืนสต็อก · sold_count −1 · payment voided (R-20)');
end $$;
:as_b
do $$ declare v_cart uuid; v_no text; v_oid uuid; j jsonb; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000002', 1);
  v_no := public.place_order('Member B', '0811111111', '456 ถนนตัวอย่าง เขตตัวอย่าง', null, 'WELCOME10');
  select id into v_oid from public.orders where order_number = v_no;
  perform public.cancel_order(v_oid, 'ทดสอบคืนคูปอง');
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000002', 1);
  j := public.validate_coupon('WELCOME10');
  perform test.ok((j ->> 'valid')::boolean and (j ->> 'discount')::numeric = 300,
     'TC-DB-30 ยกเลิก Order ที่ใช้คูปอง → คืนสิทธิ์ใช้ได้อีก (R-23)');
  delete from public.cart_items where cart_id = v_cart;
end $$;

-- ===================== วันเกิด / คูปอง (R-05, R-06) =====================
:as_a
do $$ begin
  begin perform public.claim_birthday_coupon(); perform test.ok(false, 'TC-DB-31a ไม่ใช่เดือนเกิด (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'NOT_BIRTHDAY_MONTH', 'TC-DB-31a ไม่ใช่เดือนเกิด → ' || sqlerrm); end;
  perform test.ok((select count(*) from public.coupons) = 0, 'TC-DB-32a สมาชิกที่ไม่มีคูปอง มองไม่เห็นตาราง coupons');
end $$;
:as_e
do $$ begin
  begin perform public.claim_birthday_coupon(); perform test.ok(false, 'TC-DB-31b ไม่มีวันเกิด (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'BIRTH_DATE_REQUIRED', 'TC-DB-31b ไม่มีวันเกิด → ' || sqlerrm); end;
end $$;
:as_c
do $$ declare j jsonb; v_exp timestamptz; begin
  j := public.claim_birthday_coupon();
  v_exp := (j ->> 'expires_at')::timestamptz;
  perform test.ok(j ->> 'code' like 'BDAY%'
              and (v_exp at time zone 'Asia/Bangkok') = date_trunc('month', public.th_now()) + interval '1 month',
     'TC-DB-31c รับสิทธิ์วันเกิด → ' || (j ->> 'code') || ' หมดอายุต้นเดือนถัดไปเวลาไทย');
  begin perform public.claim_birthday_coupon(); perform test.ok(false, 'TC-DB-31d รับซ้ำ (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'ALREADY_CLAIMED', 'TC-DB-31d รับซ้ำปีเดียวกัน → ' || sqlerrm); end;
  perform test.ok((select count(*) from public.coupons) = 1
              and (select coupon_type from public.coupons limit 1) = 'birthday'
              and (select discount_value from public.coupons limit 1) = 10,
     'TC-DB-32b เห็นรายละเอียดเฉพาะคูปองแม่แบบที่ตนได้รับ (R-05)');
end $$;
do $$ declare v_cart uuid; v_code text; v_no text; o public.orders%rowtype; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  select code into v_code from public.member_coupons where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000002', 1);
  v_no := public.place_order('Birthday C', '0822222222', '789 ถนนตัวอย่าง เขตตัวอย่าง', null, v_code);
  select * into o from public.orders where order_number = v_no;
  perform test.ok(o.discount_amount = 500 and o.total_amount = 4790
              and (select used_at is not null and order_id = o.id from public.member_coupons where code = v_code),
     'TC-DB-33a ใช้คูปองวันเกิด 5,290 → ลด 500 → 4,790 · บันทึก used_at/order_id');
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000002', 1);
  begin perform public.place_order('Birthday C', '0822222222', '789 ถนนตัวอย่าง เขตตัวอย่าง', null, v_code);
        perform test.ok(false, 'TC-DB-33b ใช้ซ้ำ (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'COUPON_ALREADY_USED', 'TC-DB-33b ใช้คูปองวันเกิดซ้ำ → ' || sqlerrm); end;
  delete from public.cart_items where cart_id = v_cart;
end $$;
:as_owner
select set_config('test.c_code', (select code from public.member_coupons limit 1), false) is not null;
:as_a
do $$ declare v_cart uuid; j jsonb; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000002', 1);
  j := public.validate_coupon(current_setting('test.c_code'));
  perform test.ok(j ->> 'reason' = 'INVALID_CODE', 'TC-DB-34 ใช้รหัสวันเกิดของคนอื่น → INVALID_CODE');
  delete from public.cart_items where cart_id = v_cart;
end $$;

-- ===================== สินค้าถูกปิดขายในตะกร้า (R-04) =====================
do $$ declare v_cart uuid; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000010', 1);
end $$;
:as_admin
update public.products set status = 'inactive' where sku = 'GA-KB-005';
:as_a
do $$ declare r record; begin
  select * into r from public.get_my_cart() where sku = 'GA-KB-005';
  perform test.ok(r.name = 'Keychron K8 Pro' and r.product_status = 'inactive' and not r.is_purchasable
              and (select count(*) from public.v_product_catalog where sku = 'GA-KB-005') = 0,
     'TC-DB-35a get_my_cart แสดงสินค้าปิดขายพร้อมชื่อ/สถานะ (หน้าร้านไม่แสดง)');
  begin perform public.place_order('Member A', '0800000000', '123 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
        perform test.ok(false, 'TC-DB-35b สั่งสินค้าปิดขาย (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'OUT_OF_STOCK:GA-KB-005', 'TC-DB-35b สั่งซื้อสินค้าปิดขายไม่ได้ → ' || sqlerrm); end;
  delete from public.cart_items where product_id = '10000000-0000-0000-0000-000000000010';
end $$;
:as_b
do $$ begin
  perform test.ok((select count(*) from public.get_my_cart()) = 0 and (select count(*) from public.cart_items) = 0,
     'TC-DB-50 สมาชิก B ไม่เห็นตะกร้าของ A');
end $$;

-- ===================== การจองบริการ (R-02, R-03, R-11) =====================
:as_a
do $$ declare v_no text; begin
  v_no := public.create_booking('40000000-0000-0000-0000-000000000002', public.th_today() + 1, '10:00',
                                'Member A', '0800000000', 'member.demo@example.com', null);
  perform test.ok(v_no like 'BK-' || to_char(public.th_today(), 'YYYYMMDD') || '-%'
              and (select price_snapshot = 200 and status = 'pending' from public.bookings where booking_number = v_no),
     'TC-DB-36a จองบริการ → ' || v_no || ' · price_snapshot 200');
end $$;
:as_anon
do $$ begin
  perform test.ok((select array_agg(time_slot) from public.get_booked_slots('40000000-0000-0000-0000-000000000002', public.th_today() + 1)) = array['10:00'::time],
     'TC-DB-36b Guest เห็นเฉพาะเวลาที่ถูกจอง (ไม่มีข้อมูลผู้จอง)');
end $$;
:as_b
do $$ begin
  begin perform public.create_booking('40000000-0000-0000-0000-000000000002', public.th_today() + 1, '10:00', 'B', '0811111111', 'b@example.com', null);
        perform test.ok(false, 'TC-DB-36c จองซ้ำ (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'SLOT_TAKEN', 'TC-DB-36c จองช่วงเวลาซ้ำ → ' || sqlerrm); end;
  begin perform public.create_booking('40000000-0000-0000-0000-000000000002', public.th_today() - 1, '10:00', 'B', '0811111111', 'b@example.com', null);
        perform test.ok(false, 'TC-DB-36d วันที่ผ่านมา (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'DATE_IN_PAST', 'TC-DB-36d จองวันที่ผ่านมา → ' || sqlerrm); end;
  begin perform public.create_booking('40000000-0000-0000-0000-000000000002', public.th_today() + 1, '11:00', 'B', '0811111111', 'b@example.com', null);
        perform test.ok(false, 'TC-DB-36e เวลาไม่อยู่ในรายการ (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'INVALID_TIME_SLOT', 'TC-DB-36e เวลาไม่อยู่ในรายการ → ' || sqlerrm); end;
  begin perform public.cancel_booking((select id from public.bookings limit 1));
        perform test.ok(false, 'TC-DB-37a ยกเลิกการจองของคนอื่น (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'BOOKING_NOT_CANCELLABLE', 'TC-DB-37a ยกเลิกการจองของคนอื่นไม่ได้ → ' || sqlerrm); end;
end $$;
:as_owner
select set_config('test.bk_a', (select id::text from public.bookings limit 1), false) is not null;
:as_a
do $$ begin
  begin
    update public.bookings set status = 'confirmed' where id = current_setting('test.bk_a')::uuid;
    perform test.ok(false, 'TC-DB-37b สมาชิกแก้สถานะการจองเอง (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-37b สมาชิก UPDATE bookings ตรงไม่ได้ → ' || sqlerrm); end;
  perform public.cancel_booking(current_setting('test.bk_a')::uuid);
  perform test.ok((select status from public.bookings where id = current_setting('test.bk_a')::uuid) = 'cancelled',
     'TC-DB-37c ยกเลิกการจองของตนเอง (pending) ได้');
end $$;
:as_b
do $$ declare v_no text; begin
  v_no := public.create_booking('40000000-0000-0000-0000-000000000002', public.th_today() + 1, '10:00', 'Member B', '0811111111', 'member.b@example.com', null);
  perform test.ok(v_no is not null, 'TC-DB-37d ช่องที่ถูกยกเลิกกลับมาจองได้');
end $$;
:as_admin
do $$ declare v_id uuid; begin
  select id into v_id from public.bookings where status = 'pending' limit 1;
  begin perform public.admin_update_booking(v_id, 'completed', null);
        perform test.ok(false, 'TC-DB-38a pending→completed (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'INVALID_TRANSITION', 'TC-DB-38a ข้ามขั้น pending→completed → ' || sqlerrm); end;
  perform public.admin_update_booking(v_id, 'confirmed', 'ยืนยันแล้ว');
  perform test.ok((select status from public.bookings where id = v_id) = 'confirmed', 'TC-DB-38b Admin ยืนยันการจอง');
end $$;

-- ===================== ติดต่อร้าน (R-14) =====================
:as_anon
do $$ begin
  perform public.submit_contact_message('Guest', 'guest@example.com', 'สอบถาม', 'ข้อความทดสอบครั้งที่ 1');
  perform public.submit_contact_message('Guest', 'guest@example.com', 'สอบถาม', 'ข้อความทดสอบครั้งที่ 2');
  perform public.submit_contact_message('Guest', 'guest@example.com', 'สอบถาม', 'ข้อความทดสอบครั้งที่ 3');
  begin perform public.submit_contact_message('Guest', 'GUEST@example.com', 'สอบถาม', 'ข้อความทดสอบครั้งที่ 4');
        perform test.ok(false, 'TC-DB-39a ส่งเกินกำหนด (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'RATE_LIMITED', 'TC-DB-39a ส่งครั้งที่ 4 ใน 10 นาที → ' || sqlerrm); end;
  begin perform count(*) from public.contact_messages; perform test.ok(false, 'TC-DB-39b Guest อ่านข้อความ (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-39b Guest อ่าน contact_messages ไม่ได้ → ' || sqlerrm); end;
  begin insert into public.contact_messages (name, email, subject, message) values ('x','x@example.com','x','xxxxxxxxxxxx');
        perform test.ok(false, 'TC-DB-39c Insert ตรง (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-39c Insert ตรงไม่ได้ (ต้องผ่าน RPC) → ' || sqlerrm); end;
end $$;

-- ===================== Gallery (R-09) =====================
do $$ declare r record; begin
  select * into r from public.get_public_gallery() limit 1;
  perform test.ok(r.public_url like '%gallery/g1.webp' and (select count(*) from public.get_public_gallery()) = 1,
     'TC-DB-40a Guest อ่าน Gallery ผ่าน RPC ได้เฉพาะภาพหมวด gallery');
  begin perform count(*) from public.media_files; perform test.ok(false, 'TC-DB-40b Guest อ่าน media_files (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-40b Guest อ่านตาราง media_files ตรงไม่ได้'); end;
end $$;

-- ===================== Admin: บัญชี/สต็อก/สินค้า =====================
:as_admin
do $$ begin
  begin perform public.admin_set_account_status(auth.uid(), 'suspended');
        perform test.ok(false, 'TC-DB-41a ระงับตนเอง (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'CANNOT_CHANGE_SELF', 'TC-DB-41a Admin ระงับตนเองไม่ได้ → ' || sqlerrm); end;
  perform public.admin_set_account_status('00000000-0000-0000-0000-0000000000e1', 'suspended');
end $$;
:as_e
do $$ declare v_cart uuid; begin
  select id into v_cart from public.carts where user_id = auth.uid();
  insert into public.cart_items (cart_id, product_id, quantity) values (v_cart, '10000000-0000-0000-0000-000000000002', 1);
  begin perform public.place_order('E', '0833333333', '1010 ถนนตัวอย่าง เขตตัวอย่าง', null, null);
        perform test.ok(false, 'TC-DB-41b บัญชีถูกระงับสั่งซื้อ (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'ACCOUNT_SUSPENDED', 'TC-DB-41b บัญชีถูกระงับสั่งซื้อไม่ได้ → ' || sqlerrm); end;
  begin perform public.create_booking('40000000-0000-0000-0000-000000000001', public.th_today() + 2, '13:00', 'E', '0833333333', 'e@example.com', null);
        perform test.ok(false, 'TC-DB-41c บัญชีถูกระงับจอง (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'ACCOUNT_SUSPENDED', 'TC-DB-41c บัญชีถูกระงับจองไม่ได้ → ' || sqlerrm); end;
end $$;
:as_admin
do $$ declare v_after int; begin
  begin perform public.admin_adjust_stock('10000000-0000-0000-0000-000000000017', -5, 'adjustment', 'ทดสอบ');
        perform test.ok(false, 'TC-DB-42a สต็อกติดลบ (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'NEGATIVE_STOCK', 'TC-DB-42a ปรับสต็อกจนติดลบไม่ได้ → ' || sqlerrm); end;
  -- แยก 2 คำสั่ง: คำสั่งเดียวกันมองไม่เห็นแถวที่ฟังก์ชันเพิ่งเขียน (snapshot ของคำสั่ง)
  v_after := public.admin_adjust_stock('10000000-0000-0000-0000-000000000012', 5, 'restock', null);
  perform test.ok(v_after = 5
              and exists (select 1 from public.stock_movements where product_id = '10000000-0000-0000-0000-000000000012' and movement_type = 'restock'),
     'TC-DB-42b รับสินค้าเข้า +5 → 5 · บันทึก stock_movements');
  begin delete from public.products where sku = 'GA-MS-001';
        perform test.ok(false, 'TC-DB-43a ลบสินค้าที่เคยขาย (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '23503', 'TC-DB-43a ลบสินค้าที่เคยขายไม่ได้ (FK RESTRICT, R-10)'); end;
  delete from public.products where sku = 'GA-AC-099';
  perform test.ok(not exists (select 1 from public.products where sku = 'GA-AC-099'), 'TC-DB-43b ลบสินค้าที่ไม่เคยขายได้');
  begin update public.products set stock_quantity = 999 where sku = 'GA-MS-002';
        perform test.ok(false, 'TC-DB-44a Admin แก้สต็อกตรง (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-44a แก้ stock_quantity ตรงไม่ได้ ต้องใช้ admin_adjust_stock'); end;
  update public.products set price = 5390 where sku = 'GA-MS-002';
  perform test.ok((select price from public.products where sku = 'GA-MS-002') = 5390, 'TC-DB-44b Admin แก้ราคาได้');
  update public.products set price = 5290 where sku = 'GA-MS-002';
end $$;

-- ===================== ราคา/โปรโมชั่น (R-12) =====================
:as_admin
update public.promotions set is_active = true where slug = 'headset-week';
insert into public.promotions (name, slug, discount_type, discount_value, start_at, end_at, is_active)
values ('Test 5%', 'test-5', 'percentage', 5, now() - interval '1 hour', now() + interval '1 day', true);
insert into public.promotion_products (promotion_id, product_id)
select id, '10000000-0000-0000-0000-000000000011' from public.promotions where slug = 'test-5';
:as_anon
do $$ begin
  perform test.ok((select effective_price from public.v_product_catalog where sku = 'GA-HS-004') = 3141.00
              and (select effective_price from public.v_product_catalog where sku = 'GA-HS-003') = 6291.00,
     'TC-DB-45a โปรโมชั่น 10% → #14 3,141.00 · #13 6,291.00');
  perform test.ok((select effective_price from public.v_product_catalog where sku = 'GA-HS-001') = 4590.00,
     'TC-DB-45b sale_price 4,590 vs โปร 5% (5,025.50) → ใช้ราคาต่ำสุด 4,590 ไม่ซ้อน');
  begin perform public.place_order('x','0800000000','xxxxxxxxxxxx',null,null);
        perform test.ok(false, 'TC-DB-46a Guest เรียก place_order (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-46a Guest เรียก place_order ไม่ได้ (permission denied)'); end;
end $$;
:as_a
do $$ begin
  begin perform * from public._evaluate_coupon(auth.uid(), 'WELCOME10', 10000);
        perform test.ok(false, 'TC-DB-46b เรียกฟังก์ชันภายใน (ไม่มี error)');
  exception when others then perform test.ok(sqlstate = '42501', 'TC-DB-46b สมาชิกเรียกฟังก์ชันภายใน _evaluate_coupon ไม่ได้'); end;
  begin perform * from public.report_sales(public.th_today(), public.th_today(), 'day');
        perform test.ok(false, 'TC-DB-47a สมาชิกเรียกรายงาน (ไม่มี error)');
  exception when others then perform test.ok(sqlerrm = 'FORBIDDEN', 'TC-DB-47a สมาชิกเรียกรายงานไม่ได้ → ' || sqlerrm); end;
end $$;
:as_admin
do $$ declare v_sales numeric; v_dash jsonb; begin
  select sum(sales) into v_sales from public.report_sales(public.th_today() - 1, public.th_today() + 1, 'day');
  v_dash := public.admin_dashboard_stats(public.th_today() - 1, public.th_today() + 1);
  perform test.ok(v_sales = 8180 and (v_dash ->> 'total_sales')::numeric = 8180,
     'TC-DB-47b ยอดขายสำเร็จ = 8,180 (ไม่นับ cancelled/pending) · Dashboard ตรงกับรายงาน');
end $$;

-- ===================== เขตเวลา (R-06) =====================
:as_owner
set timezone = 'America/Los_Angeles';
do $$ begin
  perform test.ok(public.th_today() = (now() at time zone 'Asia/Bangkok')::date,
     'TC-DB-48 th_today() คืนวันที่ไทยแม้ Session ใช้เขตเวลาอื่น');
end $$;
reset timezone;

-- ===================== ภาพที่ถูกใช้อยู่ (R-28) =====================
update public.categories set image_url = 'https://example.supabase.co/storage/v1/object/public/site-media/category/c1.webp'
 where slug = 'gaming-mouse';
:as_admin
do $$ begin
  perform test.ok(exists (select 1 from public.media_usage('80000000-0000-0000-0000-000000000002') where source = 'categories' and ref = 'gaming-mouse'),
     'TC-DB-49 media_usage พบว่าภาพถูกใช้ในหมวด gaming-mouse');
end $$;
:as_owner
