-- =====================================================================
-- GEARAWAI — Security audit queries (replacement for the missing 02_audit.sql, gap G1)
-- Expected results come from docs/GEARAWAI_DATABASE_DESIGN.md §13.2. Run in the SQL Editor after migrations.
-- =====================================================================

-- A1: SECURITY DEFINER functions in public without a fixed search_path  → expected 0 rows
select p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
   and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');

-- A2: public tables without RLS  → expected 0 rows
select c.relname
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- A3: functions anon can execute  → expected 7 (is_admin, th_today, th_now, calc_effective_price,
--     get_booked_slots, get_public_gallery, submit_contact_message)
select p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
 order by 1;

-- A4: internal helpers authenticated can execute  → expected 0 rows
select p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('_evaluate_coupon','_award_order_points','_cart_subtotal','_assert_admin','get_setting',
                     'next_order_number','next_booking_number','handle_new_user')
   and has_function_privilege('authenticated', p.oid, 'execute');

-- A5: profiles columns a member can UPDATE  → expected exactly full_name, phone, address, avatar_url
select a.attname
  from pg_attribute a
 where a.attrelid = 'public.profiles'::regclass and a.attnum > 0 and not a.attisdropped
   and has_column_privilege('authenticated', 'public.profiles'::regclass, a.attname, 'update')
 order by 1;

-- A6: storage buckets  → expected 4 (payment-slips is the only private one)
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;

-- A7: counts  → 26 tables, 2 views
select (select count(*) from pg_tables where schemaname = 'public') as tables,
       (select count(*) from pg_views  where schemaname = 'public') as views;
