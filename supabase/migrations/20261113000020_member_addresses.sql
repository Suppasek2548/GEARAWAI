-- 0020 — Member shipping addresses (D-24)
-- Members keep their own manual shipping addresses (address book). Admins may READ them (customer
-- detail page) but never write. profiles.address, orders and the checkout snapshot are unchanged.

create table public.member_addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  full_name     text not null check (char_length(btrim(full_name)) between 2 and 100),
  phone         text not null check (phone ~ '^[0-9+ -]{9,15}$'),
  address_line  text not null check (char_length(btrim(address_line)) between 5 and 300),
  subdistrict   text not null check (char_length(btrim(subdistrict)) between 1 and 100),
  district      text not null check (char_length(btrim(district)) between 1 and 100),
  postal_code   text not null check (postal_code ~ '^[0-9]{5}$'),
  province      text not null check (char_length(btrim(province)) between 1 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index member_addresses_user_idx on public.member_addresses(user_id, created_at desc);
create trigger member_addresses_updated_at before update on public.member_addresses
  for each row execute function public.set_updated_at();

-- RLS: the owner (an ACTIVE account) reads/writes only their own rows; an admin may only read.
alter table public.member_addresses enable row level security;

create policy member_addresses_read on public.member_addresses for select
  using (user_id = auth.uid() or public.is_admin());

create policy member_addresses_insert on public.member_addresses for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_status = 'active')
  );

create policy member_addresses_update on public.member_addresses for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_status = 'active')
  );

create policy member_addresses_delete on public.member_addresses for delete
  using (user_id = auth.uid());

-- Privileges: signed-in users only (anon gets nothing). user_id is not updatable (rows never move owner).
revoke all on public.member_addresses from anon, authenticated;
grant select, delete on public.member_addresses to authenticated;
grant insert (full_name, phone, address_line, subdistrict, district, postal_code, province)
  on public.member_addresses to authenticated;
grant update (full_name, phone, address_line, subdistrict, district, postal_code, province)
  on public.member_addresses to authenticated;
