-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0004) — split verbatim, logic unchanged
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
