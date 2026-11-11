-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0011) — split verbatim, logic unchanged
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
