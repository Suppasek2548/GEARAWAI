-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0017) — split verbatim, logic unchanged
-- ---------------------------------------------------------------------
-- 0017  GRANTS (ชั้นที่ 2 — สิทธิ์ระดับตาราง/คอลัมน์)
-- ต้องรันส่วนนี้ใหม่ทุกครั้งที่เพิ่มตาราง/ฟังก์ชัน เพราะ Supabase ให้สิทธิ์ทั้งหมดแก่ object ใหม่โดยอัตโนมัติ
-- ---------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- อ่านข้อมูลหน้าร้าน (RLS กรองเฉพาะที่เปิดใช้งาน)
grant select on public.categories, public.brands, public.products, public.product_images,
                public.promotions, public.promotion_products, public.services, public.rewards,
                public.team_members, public.site_settings,
                public.v_product_catalog, public.v_active_promotions
  to anon, authenticated;

-- อ่านข้อมูลของตนเอง (RLS กรองเจ้าของ/Admin)
grant select on public.profiles, public.wishlists, public.wishlist_items, public.carts, public.cart_items,
                public.orders, public.order_items, public.payments, public.bookings,
                public.points_transactions, public.reward_redemptions, public.coupons, public.member_coupons,
                public.contact_messages, public.media_files, public.stock_movements
  to authenticated;

-- สมาชิกเขียนได้เฉพาะคอลัมน์ที่จำเป็น (R-01)
grant update (full_name, phone, address, avatar_url) on public.profiles to authenticated;
grant insert (cart_id, product_id, quantity), update (quantity), delete on public.cart_items to authenticated;
grant insert (wishlist_id, product_id), delete on public.wishlist_items to authenticated;

-- Admin (RLS = is_admin())
grant insert, update, delete on public.categories, public.brands, public.product_images, public.promotions,
                                public.promotion_products, public.services, public.rewards, public.team_members,
                                public.site_settings, public.media_files
  to authenticated;
grant insert (sku, name, slug, brand_id, category_id, short_description, description, specifications, price,
              sale_price, stock_quantity, low_stock_threshold, status, is_featured, is_demo),
      update (sku, name, slug, brand_id, category_id, short_description, description, specifications, price,
              sale_price, low_stock_threshold, status, is_featured, is_demo),
      delete
  on public.products to authenticated;   -- stock_quantity/sold_count แก้ผ่าน RPC เท่านั้น
grant insert (code, name, description, coupon_type, discount_type, discount_value, max_discount_amount,
              min_order_amount, usage_limit, per_user_limit, valid_days_after_claim, start_at, end_at, is_active, is_demo),
      update (code, name, description, coupon_type, discount_type, discount_value, max_discount_amount,
              min_order_amount, usage_limit, per_user_limit, valid_days_after_claim, start_at, end_at, is_active, is_demo),
      delete
  on public.coupons to authenticated;
grant update (status, admin_note, read_at, replied_at), delete on public.contact_messages to authenticated;

-- ฟังก์ชันที่ Guest เรียกได้
grant execute on function public.is_admin(), public.th_today(), public.th_now(),
                          public.calc_effective_price(numeric, numeric, uuid, timestamptz),
                          public.get_booked_slots(uuid, date), public.get_public_gallery(),
                          public.submit_contact_message(text, text, text, text)
  to anon, authenticated;

-- ฟังก์ชันของสมาชิก
grant execute on function public.get_my_cart(), public.get_my_wishlist(), public.set_my_birth_date(date),
                          public.validate_coupon(text),
                          public.place_order(text, text, text, text, text),
                          public.submit_payment(uuid, public.payment_method, text, text),
                          public.cancel_order(uuid, text), public.redeem_reward(uuid),
                          public.claim_birthday_coupon(),
                          public.create_booking(uuid, date, time, text, text, text, text),
                          public.cancel_booking(uuid)
  to authenticated;

-- ฟังก์ชัน Admin (ภายในตรวจ is_admin() อีกชั้น)
grant execute on function public.admin_verify_payment(uuid, boolean, text),
                          public.admin_update_order_status(uuid, public.order_status, text),
                          public.admin_update_redemption(uuid, public.redemption_status, text),
                          public.admin_adjust_points(uuid, integer, text),
                          public.admin_adjust_stock(uuid, integer, public.stock_movement_type, text),
                          public.admin_set_account_status(uuid, public.account_status),
                          public.admin_set_member_birth_date(uuid, date),
                          public.admin_update_booking(uuid, public.booking_status, text),
                          public.media_usage(uuid),
                          public.admin_dashboard_stats(date, date),
                          public.report_sales(date, date, text),
                          public.report_best_sellers(date, date, int),
                          public.report_category_sales(date, date),
                          public.report_order_status(date, date),
                          public.report_customers(date, date, int)
  to authenticated;
-- ฟังก์ชันภายใน (_evaluate_coupon, _award_order_points, _cart_subtotal, _assert_admin, get_setting,
-- next_order_number, next_booking_number, handle_new_user, trigger functions) ไม่ GRANT ให้ใคร
