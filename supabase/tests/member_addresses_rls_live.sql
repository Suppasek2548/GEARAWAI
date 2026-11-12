-- D-24 — member_addresses RLS / GRANT test on the real project, ROLLBACK-ONLY (same pattern as D-18).
-- Throw-away users are created inside one DO block that always ends with RAISE EXCEPTION, so every
-- change is undone. Run:  npx supabase db query --remote --yes -f supabase/tests/member_addresses_rls_live.sql
-- Result is in the error text:  ADDR_RLS_RESULTS total=… pass=… [ … ]
do $t$
declare
  res  jsonb := '[]'::jsonb;
  u_a  constant uuid := '00000000-0000-0000-0000-0000000000a2';  -- member A
  u_b  constant uuid := '00000000-0000-0000-0000-0000000000b2';  -- member B
  u_d  constant uuid := '00000000-0000-0000-0000-0000000000d2';  -- admin
  u_s  constant uuid := '00000000-0000-0000-0000-0000000000e2';  -- suspended member
  a_id uuid; n int; ok boolean; msg text;
  addr jsonb := jsonb_build_object('full_name','ทดสอบ ผู้รับ','phone','0812345678','address_line','99/1 ถนนทดสอบ',
                                   'subdistrict','ตลาดใหญ่','district','เมืองภูเก็ต','postal_code','83000','province','ภูเก็ต');
begin
  begin
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
      ('00000000-0000-0000-0000-000000000000', u_a, 'authenticated', 'authenticated', 'addrtest.a@example.com', '', '{}', '{"full_name":"Addr A"}', now(), now()),
      ('00000000-0000-0000-0000-000000000000', u_b, 'authenticated', 'authenticated', 'addrtest.b@example.com', '', '{}', '{"full_name":"Addr B"}', now(), now()),
      ('00000000-0000-0000-0000-000000000000', u_d, 'authenticated', 'authenticated', 'addrtest.d@example.com', '', '{}', '{"full_name":"Addr Admin"}', now(), now()),
      ('00000000-0000-0000-0000-000000000000', u_s, 'authenticated', 'authenticated', 'addrtest.s@example.com', '', '{}', '{"full_name":"Addr Suspended"}', now(), now());
    update public.profiles set role = 'admin' where id = u_d;
    update public.profiles set account_status = 'suspended' where id = u_s;

    -- 1. member A inserts own address (user_id defaults to auth.uid())
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_a::text, true);
    insert into public.member_addresses (full_name, phone, address_line, subdistrict, district, postal_code, province)
      values (addr->>'full_name', addr->>'phone', addr->>'address_line', addr->>'subdistrict', addr->>'district', addr->>'postal_code', addr->>'province')
      returning id into a_id;
    select count(*) into n from public.member_addresses where id = a_id and user_id = u_a;
    res := res || jsonb_build_object('t','A inserts own (user_id=A)','pass', n = 1);
    select count(*) into n from public.member_addresses;
    res := res || jsonb_build_object('t','A sees only own rows','pass', n = 1);

    -- 2. A cannot set user_id explicitly (no INSERT grant on user_id)
    begin
      insert into public.member_addresses (user_id, full_name, phone, address_line, subdistrict, district, postal_code, province)
        values (u_b, 'x y', '0812345678', '12345 test', 'a', 'b', '10110', 'c');
      ok := false;
    exception when insufficient_privilege then ok := true; end;
    res := res || jsonb_build_object('t','A cannot write user_id','pass', ok);

    -- 3. member B: cannot see / update / delete A's address
    perform set_config('request.jwt.claim.sub', u_b::text, true);
    select count(*) into n from public.member_addresses where id = a_id;
    res := res || jsonb_build_object('t','B cannot read A','pass', n = 0);
    with u as (update public.member_addresses set province = 'hack' where id = a_id returning 1) select count(*) into n from u;
    res := res || jsonb_build_object('t','B cannot update A','pass', n = 0);
    with d as (delete from public.member_addresses where id = a_id returning 1) select count(*) into n from d;
    res := res || jsonb_build_object('t','B cannot delete A','pass', n = 0);

    -- 4. admin: can read, cannot update or delete
    perform set_config('request.jwt.claim.sub', u_d::text, true);
    select count(*) into n from public.member_addresses where id = a_id;
    res := res || jsonb_build_object('t','admin can read A','pass', n = 1);
    with u as (update public.member_addresses set province = 'admin-edit' where id = a_id returning 1) select count(*) into n from u;
    res := res || jsonb_build_object('t','admin cannot update','pass', n = 0);
    with d as (delete from public.member_addresses where id = a_id returning 1) select count(*) into n from d;
    res := res || jsonb_build_object('t','admin cannot delete','pass', n = 0);

    -- 5. anon: no access at all
    perform set_config('role', 'anon', true); perform set_config('request.jwt.claim.sub', '', true);
    begin
      select count(*) into n from public.member_addresses; ok := false;
    exception when insufficient_privilege then ok := true; end;
    res := res || jsonb_build_object('t','anon denied','pass', ok);

    -- 6. suspended member cannot insert
    perform set_config('role', 'authenticated', true); perform set_config('request.jwt.claim.sub', u_s::text, true);
    begin
      insert into public.member_addresses (full_name, phone, address_line, subdistrict, district, postal_code, province)
        values ('x y', '0812345678', '12345 test', 'a', 'b', '10110', 'c');
      ok := false;
    exception when insufficient_privilege then ok := true; end;
    res := res || jsonb_build_object('t','suspended cannot insert','pass', ok);

    -- 7. A can update and delete own; CHECK rejects a bad postcode
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    with u as (update public.member_addresses set province = 'กระบี่' where id = a_id returning 1) select count(*) into n from u;
    res := res || jsonb_build_object('t','A updates own','pass', n = 1);
    begin
      update public.member_addresses set postal_code = '123' where id = a_id; ok := false;
    exception when check_violation then ok := true; end;
    res := res || jsonb_build_object('t','postcode CHECK','pass', ok);
    with d as (delete from public.member_addresses where id = a_id returning 1) select count(*) into n from d;
    res := res || jsonb_build_object('t','A deletes own','pass', n = 1);

    perform set_config('role', 'none', true);
  exception when others then
    get stacked diagnostics msg = message_text;
    res := res || jsonb_build_object('t','ABORT','pass', false, 'err', msg);
  end;
  raise exception 'ADDR_RLS_RESULTS total=% pass=% %',
    jsonb_array_length(res),
    (select count(*) from jsonb_array_elements(res) e where (e->>'pass')::boolean),
    (select jsonb_agg(e->>'t') from jsonb_array_elements(res) e where not (e->>'pass')::boolean);
end
$t$;
