-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0002) — split verbatim, logic unchanged
-- ---------------------------------------------------------------------
-- 0002  HELPERS (เวลาไทย, updated_at)
-- ---------------------------------------------------------------------
create or replace function public.th_now() returns timestamp
language sql stable set search_path = '' as $$ select (now() at time zone 'Asia/Bangkok') $$;

create or replace function public.th_today() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'Asia/Bangkok')::date $$;

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;
