-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0008) — split verbatim, logic unchanged
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
