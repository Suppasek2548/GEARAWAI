-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0016) — split verbatim, logic unchanged
-- ---------------------------------------------------------------------
-- 0016  ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.brands              enable row level security;
alter table public.media_files         enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.wishlists           enable row level security;
alter table public.wishlist_items      enable row level security;
alter table public.carts               enable row level security;
alter table public.cart_items          enable row level security;
alter table public.promotions          enable row level security;
alter table public.promotion_products  enable row level security;
alter table public.coupons             enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.member_coupons      enable row level security;
alter table public.payments            enable row level security;
alter table public.stock_movements     enable row level security;
alter table public.services            enable row level security;
alter table public.bookings            enable row level security;
alter table public.rewards             enable row level security;
alter table public.reward_redemptions  enable row level security;
alter table public.points_transactions enable row level security;
alter table public.contact_messages    enable row level security;
alter table public.team_members        enable row level security;
alter table public.site_settings       enable row level security;

-- profiles
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- ตารางแคตตาล็อก: อ่านเฉพาะที่เปิดใช้งาน / Admin จัดการทั้งหมด
create policy categories_read on public.categories for select using (is_active or public.is_admin());
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy brands_read on public.brands for select using (is_active or public.is_admin());
create policy brands_admin on public.brands for all using (public.is_admin()) with check (public.is_admin());
create policy products_read on public.products for select using (status = 'active' or public.is_admin());
create policy products_admin on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy product_images_read on public.product_images for select
  using (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy product_images_admin on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy media_admin on public.media_files for all using (public.is_admin()) with check (public.is_admin());
create policy services_read on public.services for select using (is_active or public.is_admin());
create policy services_admin on public.services for all using (public.is_admin()) with check (public.is_admin());
create policy rewards_read on public.rewards for select using (is_active or public.is_admin());
create policy rewards_admin on public.rewards for all using (public.is_admin()) with check (public.is_admin());
create policy team_read on public.team_members for select using (is_active or public.is_admin());
create policy team_admin on public.team_members for all using (public.is_admin()) with check (public.is_admin());
create policy settings_read on public.site_settings for select using (is_public or public.is_admin());
create policy settings_admin on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy promotions_read on public.promotions for select
  using ((is_active and now() >= start_at and now() < end_at) or public.is_admin());
create policy promotions_admin on public.promotions for all using (public.is_admin()) with check (public.is_admin());
create policy promotion_products_read on public.promotion_products for select using (true);
create policy promotion_products_admin on public.promotion_products for all using (public.is_admin()) with check (public.is_admin());

-- คูปอง: Admin ทั้งหมด / สมาชิกอ่านเฉพาะแม่แบบของคูปองที่ตนได้รับ (R-05)
create policy coupons_member_read on public.coupons for select
  using (exists (select 1 from public.member_coupons mc where mc.coupon_id = coupons.id and mc.user_id = auth.uid()));
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy member_coupons_read on public.member_coupons for select using (user_id = auth.uid() or public.is_admin());

-- ตะกร้า / Wishlist: เฉพาะของตนเอง และเพิ่มได้เฉพาะสินค้าที่เปิดขาย
create policy wishlists_read on public.wishlists for select using (user_id = auth.uid());
create policy carts_read on public.carts for select using (user_id = auth.uid());
create policy wishlist_items_read on public.wishlist_items for select
  using (wishlist_id in (select w.id from public.wishlists w where w.user_id = auth.uid()));
create policy wishlist_items_insert on public.wishlist_items for insert
  with check (wishlist_id in (select w.id from public.wishlists w where w.user_id = auth.uid())
              and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy wishlist_items_delete on public.wishlist_items for delete
  using (wishlist_id in (select w.id from public.wishlists w where w.user_id = auth.uid()));
create policy cart_items_read on public.cart_items for select
  using (cart_id in (select c.id from public.carts c where c.user_id = auth.uid()));
create policy cart_items_insert on public.cart_items for insert
  with check (cart_id in (select c.id from public.carts c where c.user_id = auth.uid())
              and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy cart_items_update on public.cart_items for update
  using (cart_id in (select c.id from public.carts c where c.user_id = auth.uid()))
  with check (cart_id in (select c.id from public.carts c where c.user_id = auth.uid()));
create policy cart_items_delete on public.cart_items for delete
  using (cart_id in (select c.id from public.carts c where c.user_id = auth.uid()));

-- คำสั่งซื้อ/ชำระเงิน/คะแนน/การจอง: อ่านของตนเองหรือ Admin · เขียนผ่าน RPC เท่านั้น
create policy orders_read on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy order_items_read on public.order_items for select
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy payments_read on public.payments for select
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy bookings_read on public.bookings for select using (user_id = auth.uid() or public.is_admin());
create policy points_read on public.points_transactions for select using (user_id = auth.uid() or public.is_admin());
create policy redemptions_read on public.reward_redemptions for select using (user_id = auth.uid() or public.is_admin());
create policy stock_movements_read on public.stock_movements for select using (public.is_admin());

-- ข้อความติดต่อ: Admin เท่านั้น (ส่งผ่าน submit_contact_message)
create policy contact_admin_read on public.contact_messages for select using (public.is_admin());
create policy contact_admin_update on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());
create policy contact_admin_delete on public.contact_messages for delete using (public.is_admin());
