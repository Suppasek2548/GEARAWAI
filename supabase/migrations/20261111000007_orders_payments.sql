-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0007) — split verbatim, logic unchanged
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
