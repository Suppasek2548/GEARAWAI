-- ---------------------------------------------------------------------
-- 0018  STORAGE (Buckets + Policies)
-- Source: docs/GEARAWAI_DATABASE_DESIGN.md §8 — the draft SQL had no storage section (gap G2),
-- so this file implements §8 as written. Must be verified on real Supabase (TC-AUT / Phase 1).
--   product-images  public   products/{product_id}/{uuid}.webp      write: Admin
--   site-media      public   {category}/{uuid}.webp                 write: Admin
--   avatars         public   {user_id}/avatar.webp                  write: owner folder
--   payment-slips   PRIVATE  {user_id}/{order_id}/{uuid}.jpg        insert: owner (own order) · read: owner + Admin
-- Limits: image/jpeg, image/png, image/webp · 2 MB
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true,  2097152, array['image/jpeg','image/png','image/webp']),
  ('site-media',     'site-media',     true,  2097152, array['image/jpeg','image/png','image/webp']),
  ('avatars',        'avatars',        true,  2097152, array['image/jpeg','image/png','image/webp']),
  ('payment-slips',  'payment-slips',  false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admin manages catalog / site media
create policy "media admin write" on storage.objects for all to authenticated
  using (bucket_id in ('product-images','site-media') and public.is_admin())
  with check (bucket_id in ('product-images','site-media') and public.is_admin());

-- Avatars: each member writes only inside their own folder
-- (select is needed for upsert/replace through the Storage API)
create policy "avatar own read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar own write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Payment slips (private): owner uploads into {user_id}/{order_id}/ of their own order
create policy "slip own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-slips'
              and (storage.foldername(name))[1] = auth.uid()::text
              and exists (select 1 from public.orders o
                           where o.id::text = (storage.foldername(name))[2] and o.user_id = auth.uid()));
create policy "slip own or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'payment-slips'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
