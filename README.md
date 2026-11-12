# GEARAWAI — LEVEL UP YOUR GEAR

เว็บไซต์ E-Commerce อุปกรณ์ Gaming Gear และอุปกรณ์ IT (โครงงานเพื่อการศึกษา)
ข้อกำหนดทั้งหมดอยู่ใน [`docs/`](docs/) — SPEC, SYSTEM_ANALYSIS, DATABASE_DESIGN, UI_UX_DESIGN, PRODUCT_DATA, ADMIN_DESIGN, TEST_CASES

> ระบบชำระเงินเป็น **ระบบจำลอง (Demo)** โดยค่าเริ่มต้น — ไม่มีการตัดเงินจริง · Admin เปิด "รับชำระเงินจริง" ได้ที่ Settings → Payment (แสดง QR/บัญชีจริง ตรวจสลิปเอง — D-22) · ราคาและสต็อกสินค้าเป็นข้อมูลตัวอย่าง

## เทคโนโลยี

Next.js 16 (App Router, Cache Components, `proxy.ts`) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL, Auth, Storage, RLS) · Lucide Icons · zod · sonner

## สถานะการพัฒนา

| Phase                   | ขอบเขต                                                                                                                                                                                                      | สถานะ                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1 Foundation            | Design System, Supabase clients, Migration + Storage + Seed, Register/Login/Logout, Guard `/dashboard` `/admin`                                                                                             | ✅ เสร็จ (เชื่อม Supabase จริงแล้ว) |
| 2 Main Frontend         | Homepage, About, Catalog (`/shop`, `/shop/[slug]`, `/categories`), Search & Filter, Deals, Contact + Contact Form                                                                                           | ✅ เสร็จ                        |
| 3 Shopping              | Wishlist, Cart, Booking, Checkout/Payment (Demo), หน้าคำสั่งซื้อ/การจองของสมาชิก, Admin Orders + Payments (พื้นฐาน)                                                                                                 | ✅ เสร็จ                        |
| 4 Member                | Dashboard (sidebar, overview, profile + avatar + birth date), Points, Birthday coupon, Rewards — R-32 = ยอมรับความเสี่ยง (docs/DECISIONS.md)                                                                   | ✅ เสร็จ                        |
| 5 Admin                 | Dashboard Overview, 18 เมนู Admin (Catalog, Stock, Images, Orders/Payments, Customers/Points/Rewards, Promotions/Coupons, Services/Bookings, Messages, Settings), Reports + Excel + Print-to-PDF — D-14–D-16 | ✅ เสร็จ                        |
| 6 Integration & Testing | TC-DB 80 assertion บน Supabase จริง (rollback-only), Test Case ระดับเว็บ, Responsive, แก้บั๊ก, README + คู่มือ Admin + รายงานผลการทดสอบ — D-17–D-19                                                                  | ✅ เสร็จ                        |

เอกสารส่งมอบ: [คู่มือ Admin](docs/ADMIN_MANUAL.md) · [รายงานผลการทดสอบ](docs/TEST_REPORT.md) · [บันทึกการตัดสินใจ](docs/DECISIONS.md)

## ติดตั้ง

```bash
npm install
cp .env.example .env.local   # แล้วใส่ URL + anon/publishable key ของ Supabase
npm run dev                  # http://localhost:3000
```

| Script                            | หน้าที่                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `npm run dev` / `build` / `start` | รัน / Build / Production                                |
| `npm run lint`                    | ESLint                                                 |
| `npm run format`                  | Prettier (+ เรียง class Tailwind)                       |
| `npm run db:types`                | สร้าง `types/database.types.ts` จาก Supabase ที่ link แล้ว |

## ตั้งค่า Supabase (Project ใหม่ — ห้ามใช้ Project เดิม)

1. สร้าง Project ใหม่ใน Supabase (Region: Southeast Asia / Singapore) — เก็บ Database Password ไว้เอง
2. **Authentication → Sign In / Providers → Email:** ปิด _Confirm email_ (D-02) และตั้ง _Minimum password length_ = 8
3. **Authentication → URL Configuration:** Site URL = `http://localhost:3000`
4. **Project Settings → API:** คัดลอก Project URL และ anon (หรือ publishable) key ใส่ `.env.local`
   — **ห้ามใช้ service_role / secret key ในแอปนี้**
5. Link และ Push Migration (ต้องใส่ Database Password เองตอน link):
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
   Migration อยู่ที่ `supabase/migrations/` — 0001–0017 แยกมาจาก `docs/GEARAWAI_DB_SCHEMA_DRAFT.sql` แบบไม่แก้ตรรกะ, 0018 = Storage buckets + policies, 0019 = ตัวเลือก "ไม่รวม Demo Data" ของรายงาน (D-14)
6. Seed ข้อมูลตัวอย่าง: เปิด **SQL Editor** แล้ววางเนื้อหา `supabase/seed_demo.sql` → Run (ผลท้ายไฟล์ควรได้ 8 / 7 / 20 / 19 / 11 / true)
7. ตรวจความปลอดภัย: รัน `supabase/tests/audit.sql` ใน SQL Editor และเทียบกับค่าที่คาดไว้ในไฟล์
8. สมัครบัญชีทดสอบผ่านหน้าเว็บ (`/register`) แล้วตั้ง Admin คนแรกใน SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'admin.demo@example.com';
   ```
9. `npm run db:types` เพื่อสร้าง Type ของฐานข้อมูล

> ห้ามรันไฟล์ `00_supabase_shim.sql` บน Supabase จริง (ใช้เฉพาะเครื่องทดสอบ)

## ใช้งานวันนำเสนอ (Hosting = localhost — D-10 / D-19)

```bash
npm run build
npm start                    # http://localhost:3000 (Production mode)
```

- ใช้ Supabase Project เดิมที่ตั้งค่าไว้ใน `.env.local` · ไม่ต้อง Deploy ขึ้นอินเทอร์เน็ต
- ต้องใช้ Node.js 20 LTS ขึ้นไป — ระหว่างทดสอบ Phase 6 ใช้ Node v26 แล้ว `next dev` เคยหยุดเองหนึ่งครั้ง (Segmentation fault, exit 139 — ไม่ใช่โค้ดของแอป) ถ้าเกิดขึ้นให้รันคำสั่งใหม่ · แนะนำใช้ Node LTS ในวันนำเสนอ
- Admin เปิด `/admin` (ดู [คู่มือ Admin](docs/ADMIN_MANUAL.md)) · หน้า Print รายงานใช้ "พิมพ์ → บันทึกเป็น PDF" ของเบราว์เซอร์

### บัญชีทดสอบ (ข้อมูลตัวอย่าง @example.com — รหัสผ่านไม่อยู่ใน Repository)

| อีเมล                        | บทบาท  | ใช้ทดสอบ                                                                |
| --------------------------- | ------ | ---------------------------------------------------------------------- |
| `admin.demo@example.com`    | admin  | หลังบ้านทั้งหมด                                                            |
| `reg01@example.com`         | member | สมาชิกหลักของ Phase 6 (D-17) · วันเกิดถูก Admin ตั้งเป็น พ.ย. เพื่อทดสอบสิทธิ์วันเกิด |
| `reg09@example.com`         | member | โปรไฟล์ / วันเกิดครบสิทธิ์                                                   |
| `member.demo@example.com`   | member | บัญชีเดิมจาก Phase 1 — ใช้งานได้ แต่ไม่ได้ใช้ใน Phase 6 (D-17)                  |
| `birthday.demo@example.com` | member | บัญชีเดิมจาก Phase 1 — ไม่ได้ใช้ใน Phase 6 (D-17)                            |

## ทดสอบ

- ทดสอบฐานข้อมูลบน Supabase จริงแบบไม่เหลือข้อมูล: `npx supabase db query --remote --yes -f supabase/tests/db_tests_live.sql`
  — ทั้งไฟล์เป็น DO block เดียวที่จบด้วย `RAISE EXCEPTION` เสมอ จึง rollback ทุกอย่าง (ผลลัพธ์อยู่ในข้อความ Error: `DBTEST_RESULTS total=80 pass=80 …`)
- ตรวจ RLS / GRANT: `supabase/tests/audit.sql`
- ผลการทดสอบทั้งหมด: [docs/TEST_REPORT.md](docs/TEST_REPORT.md)

## โครงสร้าง

```
app/(store)/      หน้าร้าน + /dashboard (Header/Footer กลาง)
app/(auth)/       /login, /register
app/admin/        หลังบ้าน — layout ตรวจ role (403 ถ้าไม่ใช่ Admin)
components/ui/    Button, Field/Input, Badge, Card, ConfirmDialog, EmptyState, StatCard, DemoBanner …
components/layout Header, MobileDrawer, Footer, Logo
lib/supabase/     client.ts · server.ts · proxy.ts (refresh session + กันหน้า)
lib/auth/dal.ts   อ่านผู้ใช้ปัจจุบัน (Data Access Layer)
lib/actions/      Server Actions
lib/errors.ts     แปลรหัส Error จากฐานข้อมูลเป็นภาษาไทย
supabase/         migrations, seed_demo.sql, tests/audit.sql, tests/db_tests_live.sql
hooks/            use-focus-first-error (โฟกัสช่องแรกที่ผิดหลัง Submit)
proxy.ts          Next.js 16 Proxy (เดิมชื่อ middleware)
```

## ความปลอดภัย (สรุป)

ตรวจสิทธิ์ 3 ชั้น: ① `proxy.ts` พา Guest ไปหน้า Login ② Server Layout ตรวจ role ③ **ฐานข้อมูลบังคับจริง** ด้วย GRANT ระดับคอลัมน์ + RLS ทุกตาราง + RPC `SECURITY DEFINER` สำหรับงานที่แตะเงิน/สต็อก/คะแนน
