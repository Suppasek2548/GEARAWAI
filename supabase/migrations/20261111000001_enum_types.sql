-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0001) — split verbatim, logic unchanged
-- =====================================================================
-- GEARAWAI — Database Schema Draft (Revision 1)
-- Target: Supabase PostgreSQL (schema public)  ·  ทดสอบบน PostgreSQL 16 + Supabase shim
-- สถานะ: DRAFT สำหรับออกแบบ — ยังไม่ได้รันบน Supabase จริง
-- หลักการสำคัญ (ดู GEARAWAI_DATABASE_DESIGN.md):
--   1) สิทธิ์ระดับคอลัมน์ (GRANT) + RLS ระดับแถว  → ป้องกัน 2 ชั้น
--   2) งานที่แตะเงิน/สต็อก/คะแนน/การจอง ทำผ่าน RPC SECURITY DEFINER เท่านั้น
--   3) ทุกกฎที่ใช้ "วันที่" ใช้เวลา Asia/Bangkok (th_today / th_now)
--   4) ไม่มี Trigger ที่ "เขียนทับค่า" ตามตัวตนผู้เรียก (แก้ R-01)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0001  ENUM TYPES
-- ---------------------------------------------------------------------
create type public.user_role           as enum ('member','admin');
create type public.account_status      as enum ('active','suspended');
create type public.product_status      as enum ('active','inactive');
create type public.order_status        as enum ('pending_payment','payment_submitted','paid','shipped','completed','cancelled');
create type public.payment_method      as enum ('promptpay_demo','bank_transfer_demo');
create type public.payment_status      as enum ('pending','submitted','verified','rejected','voided');
create type public.booking_status      as enum ('pending','confirmed','completed','cancelled');
create type public.points_txn_type     as enum ('earn','redeem','adjust','reverse');
create type public.redemption_status   as enum ('requested','fulfilled','cancelled');
create type public.discount_type       as enum ('percentage','fixed_amount');
create type public.coupon_type         as enum ('general','birthday');
create type public.message_status      as enum ('new','read','replied','archived');
create type public.stock_movement_type as enum ('initial','restock','order','cancel_return','adjustment');
create type public.media_category      as enum ('product','banner','promotion','category','gallery','team','service','reward','other');
