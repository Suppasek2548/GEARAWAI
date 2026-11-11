-- =====================================================================
-- GEARAWAI — Database Schema Draft (Revision 1)
-- Target: Supabase PostgreSQL (schema public)  ·  ทดสอบบน PostgreSQL 16 + Supabase shim
-- สถานะ: DRAFT สำหรับออกแบบ — ยังไม่ได้รันบน Supabase จริง
-- หลักการสำคัญ (ดู GEARAWAI_DATABASE_DESIGN.md):
--   1) สิทธิ์ระดับคอลัมน์ (GRANT) + RLS ระดับแถว  → ป้องกัน 2 ชั้น
--   2) งานที่แตะเงิน/สต็อก/คะแนน/การจอง ทำผ่าน RPC SECURITY DEFINER เท่านั้น
--   3) ทุกกฎที่ใช้ "วันที่" ใช้เวลา Asia/Bangkok (th_today / th_now)
--   4) ไม่มี Trigger ที่ "เขียนทับค่า" ตามตัวตนผู้เรียก (แก้ R-01)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0001  ENUM TYPES
-- ---------------------------------------------------------------------
create type public.user_role           as enum ('member','admin');
create type public.account_status      as enum ('active','suspended');
create type public.product_status      as enum ('active','inactive');
create type public.order_status        as enum ('pending_payment','payment_submitted','paid','shipped','completed','cancelled');
create type public.payment_method      as enum ('promptpay_demo','bank_transfer_demo');
create type public.payment_status      as enum ('pending','submitted','verified','rejected','voided');
create type public.booking_status      as enum ('pending','confirmed','completed','cancelled');
create type public.points_txn_type     as enum ('earn','redeem','adjust','reverse');
create type public.redemption_status   as enum ('requested','fulfilled','cancelled');
create type public.discount_type       as enum ('percentage','fixed_amount');
create type public.coupon_type         as enum ('general','birthday');
create type public.message_status      as enum ('new','read','replied','archived');
create type public.stock_movement_type as enum ('initial','restock','order','cancel_return','adjustment');
create type public.media_category      as enum ('product','banner','promotion','category','gallery','team','service','reward','other');

-- ---------------------------------------------------------------------
-- 0002  HELPERS (เวลาไทย, updated_at)
-- ---------------------------------------------------------------------
create or replace function public.th_now() returns timestamp
language sql stable set search_path = '' as $$ select (now() at time zone 'Asia/Bangkok') $$;

create or replace function public.th_today() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'Asia/Bangkok')::date $$;

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------------
-- 0003  PROFILES + ADMIN CHECK
-- ---------------------------------------------------------------------
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  full_name               text not null check (char_length(full_name) between 1 and 100),
  email                   text not null unique,
  phone                   text check (phone ~ '^[0-9+ -]{9,15}$'),
  birth_date              date check (birth_date > date '1900-01-01'),
  birth_date_change_count smallint not null default 0 check (birth_date_change_count >= 0),
  address                 text check (char_length(address) <= 500),
  avatar_url              text,
  role                    public.user_role not null default 'member',
  account_status          public.account_status not null default 'active',
  points_balance          integer not null default 0 check (points_balance >= 0),
  is_demo                 boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin' and account_status = 'active');
$$;

create or replace function public._assert_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 0004  CATALOG
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text, image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  logo_url text,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger brands_updated_at before update on public.brands for each row execute function public.set_updated_at();

create table public.media_files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null check (bucket in ('product-images','site-media')),
  storage_path text not null,
  public_url text not null,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 2097152),
  width integer check (width > 0), height integer check (height > 0),
  category public.media_category not null default 'other',
  alt_text text,
  uploaded_by uuid references public.profiles(id) on delete set null default auth.uid(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (sku ~ '^GA-[A-Z]{2}-[0-9]{3}$'),
  name text not null check (char_length(name) between 1 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  brand_id uuid not null references public.brands(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  short_description text check (char_length(short_description) <= 200),
  description text,
  specifications jsonb not null default '{}'::jsonb,
  price numeric(10,2) not null check (price > 0),
  sale_price numeric(10,2) check (sale_price is null or (sale_price > 0 and sale_price < price)),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  sold_count integer not null default 0 check (sold_count >= 0),   -- นับเมื่อชำระแล้ว (D-07)
  status public.product_status not null default 'active',
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create index products_category_idx on public.products(category_id);
create index products_brand_idx on public.products(brand_id);
create index products_status_idx on public.products(status);
create index products_created_idx on public.products(created_at desc);
create index products_sold_idx on public.products(sold_count desc);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  media_id uuid references public.media_files(id) on delete set null,
  image_url text not null, alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index product_images_one_primary on public.product_images(product_id) where is_primary;
create index product_images_product_idx on public.product_images(product_id);

create or replace function public.ensure_single_primary_image() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_primary then
    update public.product_images set is_primary = false
     where product_id = new.product_id and id <> new.id and is_primary;
  end if;
  return new;
end $$;
create trigger product_images_single_primary before insert or update of is_primary on public.product_images
  for each row execute function public.ensure_single_primary_image();

-- ---------------------------------------------------------------------
-- 0005  WISHLIST / CART
-- ---------------------------------------------------------------------
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);
create trigger cart_items_updated_at before update on public.cart_items for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 0006  PROMOTIONS / COUPONS
-- ---------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  discount_type public.discount_type not null,
  discount_value numeric(10,2) not null check (discount_value > 0),
  start_at timestamptz not null, end_at timestamptz not null,
  is_active boolean not null default true,
  show_on_homepage boolean not null default false,
  banner_desktop_url text, banner_mobile_url text,
  sort_order integer not null default 0,
  is_demo boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint promotions_pct_chk check (discount_type <> 'percentage' or discount_value <= 100),
  constraint promotions_period_chk check (end_at > start_at)
);
create trigger promotions_updated_at before update on public.promotions for each row execute function public.set_updated_at();
create index promotions_active_idx on public.promotions(is_active, start_at, end_at);

create table public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (promotion_id, product_id)
);
create index promotion_products_product_idx on public.promotion_products(product_id);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique check (code = upper(code)),
  name text not null, description text,
  coupon_type public.coupon_type not null default 'general',
  discount_type public.discount_type not null,
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_discount_amount numeric(10,2) check (max_discount_amount > 0),
  min_order_amount numeric(10,2) not null default 0 check (min_order_amount >= 0),
  usage_limit integer check (usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  valid_days_after_claim integer check (valid_days_after_claim > 0),
  start_at timestamptz, end_at timestamptz,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint coupons_pct_chk check (discount_type <> 'percentage' or discount_value <= 100),
  constraint coupons_period_chk check (start_at is null or end_at is null or end_at > start_at),
  constraint coupons_code_chk check (coupon_type <> 'general' or code is not null)
);
create trigger coupons_updated_at before update on public.coupons for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 0007  ORDERS / PAYMENTS
-- ---------------------------------------------------------------------
create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0 and discount_amount <= subtotal),
  shipping_fee numeric(10,2) not null default 0 check (shipping_fee >= 0),
  total_amount numeric(10,2) not null,
  coupon_id uuid references public.coupons(id) on delete set null,   -- คูปองทั่วไป หรือแม่แบบวันเกิด
  coupon_code text,                                                  -- snapshot รหัสที่ใช้
  recipient_name text not null check (char_length(recipient_name) between 1 and 100),
  recipient_phone text not null check (recipient_phone ~ '^[0-9+ -]{9,15}$'),
  shipping_address text not null check (char_length(shipping_address) between 10 and 500),
  note text check (char_length(note) <= 500),
  tracking_number text, cancelled_reason text,
  paid_at timestamptz, shipped_at timestamptz, completed_at timestamptz, cancelled_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint orders_total_chk check (total_amount = subtotal - discount_amount + shipping_fee)
);
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create index orders_user_idx on public.orders(user_id, created_at desc);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at);
create index orders_coupon_idx on public.orders(coupon_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,   -- R-10
  product_sku text not null, product_name text not null, product_image_url text,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now(),
  constraint order_items_total_chk check (line_total = unit_price * quantity)
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

create table public.member_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  code text not null unique,
  cycle_year integer not null,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  order_id uuid unique references public.orders(id) on delete set null,   -- แหล่งความจริงเดียว (R-22)
  unique (user_id, coupon_id, cycle_year)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  amount numeric(10,2) not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  slip_path text,
  payer_note text check (char_length(payer_note) <= 300),
  is_demo boolean not null default true,
  submitted_at timestamptz, verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  reject_reason text,
  created_at timestamptz not null default now()
);
create index payments_order_idx on public.payments(order_id);
create index payments_status_idx on public.payments(status);

create table public.stock_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type public.stock_movement_type not null,
  quantity_change integer not null check (quantity_change <> 0),
  quantity_after integer not null check (quantity_after >= 0),
  order_id uuid references public.orders(id) on delete set null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index stock_movements_product_idx on public.stock_movements(product_id, created_at desc);

-- ---------------------------------------------------------------------
-- 0008  SERVICES / BOOKINGS
-- ---------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger services_updated_at before update on public.services for each row execute function public.set_updated_at();

create sequence public.booking_number_seq;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  booking_date date not null,
  time_slot time not null,
  contact_name text not null check (char_length(contact_name) between 1 and 100),
  contact_phone text not null check (contact_phone ~ '^[0-9+ -]{9,15}$'),
  contact_email text not null check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  note text check (char_length(note) <= 500),
  price_snapshot numeric(10,2) not null check (price_snapshot >= 0),
  status public.booking_status not null default 'pending',
  admin_note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create unique index bookings_slot_uq on public.bookings(service_id, booking_date, time_slot)
  where status in ('pending','confirmed');
create index bookings_user_idx on public.bookings(user_id);

-- ---------------------------------------------------------------------
-- 0009  POINTS / REWARDS
-- ---------------------------------------------------------------------
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text, image_url text,
  points_required integer not null check (points_required > 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger rewards_updated_at before update on public.rewards for each row execute function public.set_updated_at();

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  reward_name text not null,
  points_used integer not null check (points_used > 0),
  status public.redemption_status not null default 'requested',
  admin_note text,
  fulfilled_at timestamptz, cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.points_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.points_txn_type not null,
  points integer not null check (points <> 0),
  balance_after integer not null check (balance_after >= 0),
  order_id uuid references public.orders(id) on delete set null,
  redemption_id uuid references public.reward_redemptions(id) on delete set null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index points_earn_once on public.points_transactions(order_id) where type = 'earn';
create index points_user_idx on public.points_transactions(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 0010  CONTENT
-- ---------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  subject text not null check (char_length(subject) between 1 and 150),
  message text not null check (char_length(message) between 10 and 2000),
  status public.message_status not null default 'new',
  admin_note text, read_at timestamptz, replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages(status, created_at desc);
create index contact_messages_email_idx on public.contact_messages(lower(email), created_at desc);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, position text not null, description text, image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger team_members_updated_at before update on public.team_members for each row execute function public.set_updated_at();

create table public.site_settings (
  key text primary key check (key ~ '^[a-z_]+$'),
  value jsonb not null,
  description text,
  is_public boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

create or replace function public.get_setting(p_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select value from public.site_settings where key = p_key
$$;

-- ---------------------------------------------------------------------
-- 0011  SIGN-UP TRIGGER (R-07: ไม่ทำให้การสมัครล้มเพราะ metadata)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_raw  text;
  v_bd   date;
begin
  v_name := left(coalesce(
              nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
              nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
              'Member'), 100);
  v_raw := new.raw_user_meta_data ->> 'birth_date';
  if v_raw ~ '^\d{4}-\d{2}-\d{2}$' then
    begin
      v_bd := v_raw::date;
    exception when others then
      v_bd := null;
    end;
    if v_bd is not null and (v_bd > public.th_today() or v_bd <= date '1900-01-01') then
      v_bd := null;
    end if;
  end if;
  -- role/points/status ไม่อ่านจาก metadata เด็ดขาด (ใช้ค่า default)
  insert into public.profiles (id, email, full_name, birth_date)
  values (new.id, coalesce(new.email, new.id::text || '@no-email.local'), v_name, v_bd);
  insert into public.wishlists (user_id) values (new.id);
  insert into public.carts (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 0012  PRICE / CATALOG VIEWS (R-12: สูตรราคาที่เดียว)
-- ---------------------------------------------------------------------
create or replace function public.calc_effective_price(
  p_price numeric, p_sale_price numeric, p_product_id uuid, p_at timestamptz default now())
returns numeric language sql stable set search_path = '' as $$
  select least(
    p_price,
    coalesce(p_sale_price, p_price),
    coalesce((
      select min(case when pr.discount_type = 'percentage'
                      then round(p_price * (1 - pr.discount_value / 100.0), 2)
                      else greatest(p_price - pr.discount_value, 0) end)
        from public.promotion_products pp
        join public.promotions pr on pr.id = pp.promotion_id
       where pp.product_id = p_product_id
         and pr.is_active and p_at >= pr.start_at and p_at < pr.end_at
    ), p_price));
$$;

create view public.v_product_catalog with (security_invoker = true) as
select p.id, p.sku, p.name, p.slug, p.short_description, p.description, p.specifications,
       p.price, p.sale_price,
       public.calc_effective_price(p.price, p.sale_price, p.id) as effective_price,
       p.stock_quantity, p.low_stock_threshold,
       (p.stock_quantity > 0) as in_stock,
       (p.stock_quantity > 0 and p.stock_quantity <= p.low_stock_threshold) as is_low_stock,
       p.sold_count, p.status, p.is_featured, p.created_at,
       b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
       c.id as category_id, c.name as category_name, c.slug as category_slug,
       (select pi.image_url from public.product_images pi
         where pi.product_id = p.id and pi.is_primary limit 1) as primary_image_url
  from public.products p
  join public.brands b on b.id = p.brand_id
  join public.categories c on c.id = p.category_id;

create view public.v_active_promotions with (security_invoker = true) as
select pr.id, pr.name, pr.slug, pr.description, pr.discount_type, pr.discount_value,
       pr.start_at, pr.end_at, pr.show_on_homepage, pr.banner_desktop_url, pr.banner_mobile_url, pr.sort_order,
       (select count(*) from public.promotion_products pp where pp.promotion_id = pr.id) as product_count
  from public.promotions pr
 where pr.is_active and now() >= pr.start_at and now() < pr.end_at;

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
