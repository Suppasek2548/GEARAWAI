-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0009) — split verbatim, logic unchanged
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
