-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0003) — split verbatim, logic unchanged
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
