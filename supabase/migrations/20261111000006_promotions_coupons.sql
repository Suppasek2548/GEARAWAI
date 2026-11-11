-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0006) — split verbatim, logic unchanged
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
