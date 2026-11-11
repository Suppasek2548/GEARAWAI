# GEARAWAI — Admin Dashboard Design

> | รายการ | รายละเอียด |
> |---|---|
> | เอกสาร | 5 / 6 — GEARAWAI_ADMIN_DESIGN.md |
> | Revision | **Rev.1 (11 พ.ย. 2026)** — ปรับตาม D-07, D-09 และ R-10, R-13, R-15, R-16, R-20, R-21, R-25, R-28 |
> | สถานะ | Draft |
> | อ้างอิง | SPEC ระบบที่ 15, 16, 17, 19, หัวข้อ 5–6 · SYSTEM_ANALYSIS (S15-Fxx) · DATABASE_DESIGN (ตาราง/RPC) · UI_UX_DESIGN หัวข้อ 12 (Layout) |
> | สิทธิ์ | Admin เท่านั้น (`profiles.role = 'admin'` และ `account_status = 'active'`) |

---

## สารบัญ

1. [การควบคุมสิทธิ์เข้าถึง](#1-การควบคุมสิทธิ์เข้าถึง)
2. [โครงสร้างเมนู](#2-โครงสร้างเมนู)
3. [Component กลางของ Admin](#3-component-กลางของ-admin)
4. [รายละเอียดแต่ละเมนู](#4-รายละเอียดแต่ละเมนู)
5. [ผลกระทบต่อหน้าร้าน (Admin → Storefront)](#5-ผลกระทบต่อหน้าร้าน)
6. [Checklist การพัฒนา Admin](#6-checklist-การพัฒนา-admin)

---

## 1. การควบคุมสิทธิ์เข้าถึง

| ชั้น | วิธี | ผลเมื่อไม่ผ่าน |
|---|---|---|
| 1. `proxy.ts` (Next.js 16+) หรือ `middleware.ts` (Next.js ≤ 15) — ตรวจเวอร์ชันในโปรเจกต์ก่อน (R-15) | ตรวจ/รีเฟรช Session จาก Cookie ทุก Request ที่ขึ้นต้นด้วย `/admin` | ไม่มี Session → `/login?redirect=/admin…` |
| 2. Admin Layout (`app/admin/layout.tsx` — Server Component) | ดึง `profiles.role` ของผู้ใช้ปัจจุบันจาก Supabase ฝั่ง Server | ไม่ใช่ Admin → แสดงหน้า 403 |
| 3. ฐานข้อมูล (GRANT + RLS + `is_admin()` ใน RPC) | ทุก Query/RPC ฝั่ง Admin ถูกตรวจซ้ำที่ฐานข้อมูล · คอลัมน์สำคัญ (สต็อก, ยอดขาย, คะแนน, role, สถานะบัญชี, used_count) แก้ได้ผ่าน RPC เท่านั้น แม้เป็น Admin | Query คืนค่าว่าง / `permission denied` / RPC `raise exception 'FORBIDDEN'` |

> ชั้นที่ 3 คือชั้นที่ **บังคับใช้จริง** — ชั้นที่ 1–2 มีไว้เพื่อ UX เท่านั้น ห้ามพึ่ง Frontend อย่างเดียว · ห้ามใช้ `service_role` key ในโค้ด Client

---

## 2. โครงสร้างเมนู

เมนูตาม SPEC หัวข้อ 6 (17 รายการ) + **Stock** แยกเป็นเมนูของตัวเองตามที่ขอในงานเตรียมเอกสาร (SPEC รวมไว้ใน "จัดการสต็อก")

| กลุ่ม | เมนู | Route | Icon (Lucide) | ระบบ | ตาราง / RPC หลัก |
|---|---|---|---|---|---|
| — | **Dashboard Overview** | `/admin` | `LayoutDashboard` | S15 | `admin_dashboard_stats()` |
| Catalog | **Products** | `/admin/products` | `Package` | S15, S03 | `products`, `product_images` |
| Catalog | **Categories** | `/admin/categories` | `Tags` | S15 | `categories` |
| Catalog | **Brands** | `/admin/brands` | `BadgeCheck` | S15 | `brands` |
| Catalog | **Stock** | `/admin/stock` | `Boxes` | S15 | `admin_adjust_stock()`, `stock_movements` |
| Catalog | **Images** | `/admin/images` | `Image` | S16 | `media_files`, Storage, `media_usage()` |
| Sales | **Orders** | `/admin/orders` | `ReceiptText` | S15, S09 | `orders`, `order_items`, `admin_update_order_status()`, `cancel_order()` |
| Sales | **Payments** | `/admin/payments` | `CreditCard` | S09 | `payments`, `admin_verify_payment()` |
| Customers | **Customers (Members)** | `/admin/customers` | `Users` | S15, S14 | `profiles`, `admin_set_account_status()`, `admin_set_member_birth_date()` |
| Customers | **Points** | `/admin/points` | `Coins` | S10 | `points_transactions`, `admin_adjust_points()` |
| Customers | **Rewards** | `/admin/rewards` | `Gift` | S12 | `rewards`, `reward_redemptions`, `admin_update_redemption()` |
| Marketing | **Promotions** | `/admin/promotions` | `Megaphone` | S19 | `promotions`, `promotion_products` |
| Marketing | **Coupons** | `/admin/coupons` | `Ticket` | S11, S09 | `coupons`, `member_coupons` |
| Services | **Services** | `/admin/services` | `Wrench` | S08 | `services` |
| Services | **Bookings** | `/admin/bookings` | `CalendarClock` | S08 | `bookings`, `admin_update_booking()` |
| Insights | **Reports** | `/admin/reports` | `BarChart3` | S17 | `report_*()` |
| Content | **Contact Messages** | `/admin/messages` | `Mail` | S20 | `contact_messages` |
| Content | **Settings** | `/admin/settings` | `Settings` | S15 | `site_settings`, `team_members` |

**Badge แจ้งเตือนบน Sidebar:** Payments (จำนวน `submitted`), Bookings (`pending`), Contact Messages (`new`), Stock (จำนวนสินค้าสต็อกต่ำ)

---

## 3. Component กลางของ Admin

| Component | ความสามารถ | ใช้ใน |
|---|---|---|
| `AdminLayout` | Sidebar 240px + Header 64px + Breadcrumb · Mobile: Drawer | ทุกหน้า |
| `DataTable` | Search, Filter, Sort ตามคอลัมน์, Pagination (20/หน้า), Empty/Loading/Error State · Mobile: เลื่อนแนวนอนในกรอบ หรือแสดงเป็นการ์ด | ทุกหน้ารายการ |
| `StatusBadge` | สี + ข้อความตามสถานะ (Enum ใน DATABASE_DESIGN) | Orders, Payments, Bookings, Messages, Redemptions |
| `FormPanel` | Validation ตอน Blur/Submit, ปุ่ม [บันทึก] 160×48 + [ยกเลิก], เตือนเมื่อออกจากหน้าโดยยังไม่บันทึก | ทุกหน้าเพิ่ม/แก้ไข |
| `ConfirmDialog` | ยืนยันก่อน ลบ / ยกเลิก / เปลี่ยนสถานะที่ย้อนกลับไม่ได้ | ทุกหน้า |
| `ImagePicker` | เลือกจาก Image Library หรืออัปโหลดใหม่ (ใช้ร่วมกับ S16) | Products, Categories, Promotions, Services, Rewards, Team |
| `DateRangePicker` | 180×40 · ค่าลัด: วันนี้ / 7 วัน / 30 วัน / เดือนนี้ / กำหนดเอง | Dashboard, Reports, Orders |
| `Toast` | แจ้งผลสำเร็จ/ล้มเหลว | ทุกหน้า |
| `DemoFilter` | สลับ "แสดง/ซ่อน Demo Data" (`is_demo`) | Products, Orders, Customers ฯลฯ |
| `ErrorMessage` | แปลรหัส Error จากฐานข้อมูลเป็นข้อความไทย (UI_UX §15.1) | ทุกหน้า |

### 3.1 การอัปเดตหน้าร้านหลัง Admin บันทึก (R-16)

SPEC หัวข้อ 9 ต้องการให้หน้าร้านเปลี่ยนทันทีหลัง Admin แก้ข้อมูล — Next.js App Router อาจ Cache หน้าที่ Render บน Server จึงกำหนดว่า:

1. ทุก Server Action ของ Admin เรียก `revalidatePath()` ของหน้าที่ได้รับผลกระทบหลังบันทึกสำเร็จ

| บันทึกที่เมนู | revalidatePath |
|---|---|
| Products / Stock / Images (ภาพสินค้า) | `/`, `/shop`, `/shop/[slug]`, `/deals` |
| Categories / Brands | `/`, `/shop`, `/categories` |
| Promotions | `/`, `/deals`, `/shop` |
| Settings → Store / About / Contact | `/` (layout), `/about`, `/contact` |
| Services | `/booking` |
| Rewards | `/dashboard/rewards` |

2. หน้าที่แสดงราคา/สต็อกแบบ Real-time (ตะกร้า, Checkout) ใช้ Dynamic Rendering เสมอ
3. TC-ADM-03/04/06/08 และ TC-PRM-01 ใช้ตรวจข้อกำหนดนี้

---

## 4. รายละเอียดแต่ละเมนู

### 4.1 Dashboard Overview — `/admin`

| ส่วน | ข้อมูล | ขนาด (SPEC) | หมายเหตุ |
|---|---|---|---|
| Total Sales | ผลรวม `total_amount` ของ Order สถานะ `paid`, `shipped`, `completed` ในช่วงวันที่ | StatCard 220×120 | ไม่นับ `cancelled` / ยังไม่ชำระ |
| Total Orders | จำนวน Order ทั้งหมดในช่วงวันที่ (แยกย่อยตามสถานะใน Tooltip) | 220×120 | |
| Total Customers | จำนวน `profiles` ที่ `role = 'member'` | 220×120 | |
| Total Products | จำนวน `products` (แยก active/inactive) | 220×120 | |
| Sales Overview Chart | ยอดขายรายวันในช่วงวันที่ (Line/Bar) | 600×300 | |
| Top Categories | สัดส่วนยอดขายตามหมวดหมู่ (Donut) | 300×300 | |
| Recent Orders | 5–10 รายการล่าสุด: เลข, ลูกค้า, ยอด, สถานะ, วันที่ | ภาพสินค้า 64×64 | ปุ่ม [View] |
| Alerts | สินค้าสต็อกต่ำ/หมด | | ลิงก์ไป Stock |
| Pending Tasks | แจ้งชำระรอตรวจ, การจองรอยืนยัน, ข้อความใหม่, การแลกรางวัลรอส่งมอบ | | ลิงก์ไปแต่ละเมนู |

**ข้อกำหนด:** ข้อมูลจาก `admin_dashboard_stats()` เท่านั้น · ไม่มีข้อมูล → แสดง `0` และกราฟ Empty State · ห้ามใส่ตัวเลขสมมติ

---

### 4.2 Product Management — `/admin/products`

**รายการ (DataTable)**

| คอลัมน์ | หมายเหตุ |
|---|---|
| ภาพ 64×64 | ภาพหลัก |
| SKU | `GA-XX-000` |
| ชื่อสินค้า | ลิงก์ไปหน้าแก้ไข |
| แบรนด์ / หมวดหมู่ | |
| ราคา / ราคาลด | |
| สต็อก | สีเหลือง ≤ threshold, สีแดง = 0 |
| ขายแล้ว | `sold_count` — นับเฉพาะ Order ที่ยืนยันชำระแล้ว (D-07) จึงตรงกับรายงาน Best Sellers |
| สถานะ | `active` / `inactive` (Toggle ได้จากตาราง) |
| ⭐ Featured | Toggle |
| Actions | [แก้ไข] [ดูหน้าร้าน ↗] [ลบ] |

**Filter:** หมวดหมู่, แบรนด์, สถานะ, สต็อก (ปกติ/ต่ำ/หมด), Featured, Demo · **Search:** ชื่อ, SKU · **Sort:** ชื่อ, ราคา, สต็อก, ขายแล้ว, วันที่สร้าง

**ฟอร์มเพิ่ม/แก้ไข** (`/admin/products/new`, `/admin/products/[id]`)

| ฟิลด์ | Input | Validation |
|---|---|---|
| SKU | Text | บังคับ, รูปแบบ `GA-[A-Z]{2}-[0-9]{3}`, ไม่ซ้ำ |
| ชื่อสินค้า | Text | บังคับ, 1–150 ตัวอักษร |
| Slug | Text (สร้างอัตโนมัติจากชื่อ แก้ได้) | บังคับ, `a-z0-9-`, ไม่ซ้ำ |
| แบรนด์ | Select (+ ลิงก์ "เพิ่มแบรนด์") | บังคับ |
| หมวดหมู่ | Select | บังคับ |
| คำอธิบายสั้น | Textarea | ≤ 200 ตัวอักษร |
| รายละเอียด | Textarea | — |
| Specifications | Key-Value Editor (เพิ่ม/ลบ/เรียงแถว) | Key ห้ามว่าง/ซ้ำ |
| ราคา | Number (2 ตำแหน่ง) | บังคับ, > 0 |
| ราคาลด | Number | ว่างได้, > 0 และ < ราคา |
| สต็อกเริ่มต้น | Number (เฉพาะตอนสร้าง) | ≥ 0 จำนวนเต็ม · บันทึก `stock_movements('initial')` อัตโนมัติ · หลังสร้างแล้ว **ฐานข้อมูลไม่อนุญาตให้แก้ตรง** ต้องใช้เมนู Stock |
| เกณฑ์สต็อกต่ำ | Number | ≥ 0 |
| รูปภาพ | `ImagePicker` หลายรูป + เลือกภาพหลัก + ลากเรียงลำดับ | อย่างน้อย 1 รูปเมื่อ `active` (ข้อเสนอ), JPG/PNG/WebP ≤ 2MB, แนะนำ 800×800 |
| สถานะ | Toggle active/inactive | |
| Featured | Checkbox | |
| Demo Data | Checkbox | |

**Actions และกฎ**

| Action | กฎ |
|---|---|
| เพิ่ม | สร้าง `products` + `product_images` + `stock_movements(initial)` |
| แก้ไข | ราคาที่แก้มีผลกับตะกร้าทันที แต่ **ไม่เปลี่ยน** ราคาใน Order ที่สั่งไปแล้ว (Snapshot) |
| ลบ | ConfirmDialog · อนุญาตเฉพาะสินค้าที่ **ไม่เคยอยู่ในคำสั่งซื้อใดเลย** — บังคับที่ฐานข้อมูลด้วย `order_items.product_id ON DELETE RESTRICT` (R-10) · ถ้าลบไม่ได้ (Error 23503) → แสดง "สินค้านี้มีประวัติการสั่งซื้อ แนะนำให้ปิดการขายแทน" |
| ปิดการขาย | `status = 'inactive'` → หายจากหน้าร้านทันที, สินค้าในตะกร้าของลูกค้าแสดง "ไม่พร้อมจำหน่าย" |

---

### 4.3 Category Management — `/admin/categories`

| ส่วน | รายละเอียด |
|---|---|
| รายการ | ภาพ, ชื่อ, slug, จำนวนสินค้า, ลำดับ, สถานะ · ลากเพื่อเรียง `sort_order` |
| ฟอร์ม | ชื่อ (บังคับ, ไม่ซ้ำ), slug (ไม่ซ้ำ), คำอธิบาย, ภาพ 600×600, ลำดับ, สถานะ |
| ลบ | ไม่อนุญาตถ้ายังมีสินค้าในหมวด (FK RESTRICT) → แจ้ง "ย้ายสินค้า X รายการออกก่อน" |
| ผลต่อหน้าร้าน | ชื่อ/ภาพ/ลำดับเปลี่ยนที่ Homepage, `/categories`, Filter ใน `/shop` · ปิดสถานะ = ซ่อนหมวด |

### 4.4 Brand Management — `/admin/brands`

เหมือน Category: ชื่อ, slug, โลโก้ (ไม่บังคับ), สถานะ · ลบไม่ได้ถ้ามีสินค้า · มีผลกับ Filter Brand และการค้นหาจากแบรนด์

---

### 4.5 Stock Management — `/admin/stock`

| ส่วน | รายละเอียด |
|---|---|
| รายการ | ภาพ, SKU, ชื่อ, สต็อกคงเหลือ, เกณฑ์ต่ำ, สถานะสต็อก (ปกติ/ต่ำ/หมด), ขายแล้ว, ปรับล่าสุด |
| Filter | ทั้งหมด / ต่ำ / หมด · หมวดหมู่ · แบรนด์ |
| ปรับสต็อก (Modal) | ประเภท: `restock` (รับเข้า +) หรือ `adjustment` (+/−) · จำนวน (จำนวนเต็ม ≠ 0) · หมายเหตุ (บังคับเมื่อ adjustment) · แสดงตัวอย่าง "คงเหลือหลังปรับ = X" |
| Validation | ผลลัพธ์ต้อง ≥ 0 (ตรวจทั้ง Frontend และใน `admin_adjust_stock()`) |
| ประวัติ | แท็บ/ลิ้นชัก แสดง `stock_movements` ของสินค้า: วันที่, ประเภท, +/−, คงเหลือ, อ้างอิง Order, ผู้ทำรายการ, หมายเหตุ |
| ผลต่อหน้าร้าน | ป้าย "มีสินค้า/เหลือน้อย/หมด" และจำนวนสูงสุดที่ใส่ตะกร้าได้เปลี่ยนทันที |

> สต็อกถูกตัด/คืนอัตโนมัติจาก `place_order()` และ `cancel_order()` — Admin ไม่ต้องปรับเองเมื่อมีคำสั่งซื้อ

---

### 4.6 Image Management — `/admin/images` (S16)

| ส่วน | รายละเอียด |
|---|---|
| Image Library | Grid ภาพ Preview 160×160 + ชื่อไฟล์, ขนาด (KB), ความกว้าง×สูง, หมวดหมู่ภาพ, วันที่ |
| Filter | Image Category (`product`, `banner`, `promotion`, `category`, `gallery`, `team`, `service`, `reward`, `other`) · Search ชื่อไฟล์ |
| Upload | กล่อง Drag & Drop 500×300 · หลายไฟล์ได้ · เลือกหมวดหมู่ก่อนอัปโหลด |
| ตรวจไฟล์ | ชนิด JPG/PNG/WebP · ขนาด ≤ 2MB · อ่านขนาดภาพและ **เตือน** (ไม่บล็อก) เมื่อสัดส่วนต่างจากขนาดแนะนำ |
| ขนาดแนะนำ | สินค้า 800×800 · แบนเนอร์หลัก 1920×700 · แบนเนอร์โปรโมชั่น 1200×600 (Mobile 750×1000) · หมวดหมู่ 600×600 · Gallery 1200×800 · ทีมงาน 600×600 · บริการ 600×400 · รางวัล 600×600 |
| Edit | แก้ Alt Text, หมวดหมู่ · [เปลี่ยนไฟล์] = อัปโหลดทับ (อัปเดต URL ทุกที่ที่ใช้อยู่) |
| Delete | เรียก `media_usage(media_id)` ก่อน → ถ้าภาพถูกใช้อยู่ (product_images, categories, brands, promotions, services, rewards, team_members, site_settings) → **บล็อกการลบ** และแสดงรายการที่ใช้ (R-28) · ไม่ถูกใช้ → ConfirmDialog → ลบทั้งไฟล์ใน Storage และแถวใน `media_files` |
| เชื่อมโยง | ใช้ผ่าน `ImagePicker` ในฟอร์มสินค้า/โปรโมชั่น/หมวดหมู่ |

---

### 4.7 Order Management — `/admin/orders`

**รายการ:** เลขคำสั่งซื้อ, วันที่, ลูกค้า (ชื่อ/อีเมล), จำนวนชิ้น, ยอดรวม, สถานะ Order, สถานะการชำระล่าสุด, Demo · **Filter:** สถานะ, ช่วงวันที่, Demo · **Search:** เลขคำสั่งซื้อ, ชื่อ/อีเมลลูกค้า

**หน้ารายละเอียด** `/admin/orders/[id]`

| ส่วน | รายละเอียด |
|---|---|
| Header | เลขคำสั่งซื้อ, StatusBadge, วันที่สั่ง |
| Timeline | สถานะและเวลา (`created_at`, `paid_at`, `shipped_at`, `completed_at`, `cancelled_at`) |
| ลูกค้า | ชื่อ, อีเมล, เบอร์ → ลิงก์ไป Customers |
| จัดส่ง | ชื่อผู้รับ, เบอร์, ที่อยู่, หมายเหตุ, Tracking Number |
| รายการสินค้า | ภาพ 64×64, SKU, ชื่อ (Snapshot), ราคาต่อหน่วย, จำนวน, รวม |
| สรุปยอด | Subtotal, คูปอง (รหัส + ส่วนลด), ค่าส่ง, Total |
| การชำระเงิน | ประวัติ `payments` + ลิงก์ไป Payments |

**การเปลี่ยนสถานะ** (ตาม SYSTEM_ANALYSIS 6.1 — ปุ่มที่แสดงขึ้นกับสถานะปัจจุบัน)

| สถานะปัจจุบัน | ปุ่มที่แสดง | ผล |
|---|---|---|
| `pending_payment` | [ยกเลิกคำสั่งซื้อ] | `cancel_order()` คืนสต็อก + คูปอง |
| `payment_submitted` | [ไปตรวจสอบการชำระ] · [ยกเลิก] | ไป `/admin/payments/[id]` |
| `paid` | [บันทึกการจัดส่ง] (กรอก Tracking — ไม่บังคับ) · [ยกเลิก] | → `shipped` · ยกเลิก = คืนสต็อก, ลด `sold_count`, payment → `voided` (R-20) |
| `shipped` | [ปิดงาน — สำเร็จ] | → `completed` + **ให้คะแนนอัตโนมัติ** (`award_order_points`) |
| `completed` / `cancelled` | — (อ่านอย่างเดียว) | |

> ทุกปุ่มมี ConfirmDialog · การยกเลิกต้องกรอกเหตุผล · ไม่มีการ "ลบ" คำสั่งซื้อ

---

### 4.8 Payment Verification — `/admin/payments`

| ส่วน | รายละเอียด |
|---|---|
| แถบเตือน | "ระบบชำระเงินจำลอง — การยืนยันในหน้านี้ไม่ได้หมายถึงการได้รับเงินจริง" |
| รายการ | เลขคำสั่งซื้อ, ลูกค้า, ช่องทาง (Demo), ยอด, สถานะ, วันที่แจ้ง |
| Filter | สถานะ (`submitted` เป็นค่าเริ่มต้น), ช่วงวันที่ |
| รายละเอียด | ยอดที่แจ้ง vs `orders.total_amount` (ไฮไลต์ถ้าไม่ตรง), ภาพสลิป (Signed URL จาก Bucket Private), หมายเหตุลูกค้า |
| Actions | [ยืนยันการชำระ] → `verified` + Order `paid` + `sold_count` เพิ่ม (D-07) · [ปฏิเสธ] (กรอกเหตุผล) → `rejected` + Order กลับ `pending_payment` |
| สถานะ `voided` | แสดงป้าย "ยกเลิกหลังแจ้งชำระ (Demo — ไม่มีการคืนเงินจริง)" |

---

### 4.9 Member Management — `/admin/customers`

| ส่วน | รายละเอียด |
|---|---|
| รายการ | Avatar, ชื่อ, อีเมล, เบอร์, บทบาท, สถานะบัญชี, คะแนน, จำนวน Order, ยอดซื้อรวม, วันที่สมัคร, Demo |
| Filter / Search | บทบาท, สถานะบัญชี, Demo / ชื่อ, อีเมล, เบอร์ |
| รายละเอียด | ข้อมูลส่วนตัว (อ่านอย่างเดียว ยกเว้นที่ระบุ), วันเกิด, ประวัติ Order, ประวัติคะแนน, การแลกรางวัล, คูปอง, การจอง |
| Actions | [ระงับ/เปิดใช้บัญชี] → `admin_set_account_status()` · [ปรับคะแนน] → ไปเมนู Points · [แก้วันเกิด] → `admin_set_member_birth_date()` (กรณีลูกค้าขอแก้เกินสิทธิ์) · **ไม่มีปุ่มเปลี่ยนบทบาท** — เปลี่ยนเป็น Admin ผ่าน SQL เท่านั้น |
| ข้อห้าม | Admin **ไม่เห็นรหัสผ่าน** (อยู่ใน Supabase Auth) · ระงับบัญชีตัวเองไม่ได้ (`CANNOT_CHANGE_SELF`) · ระงับ Admin คนสุดท้ายไม่ได้ (`LAST_ADMIN`) — บังคับใน RPC (R-25) |

> ผลของการระงับบัญชี: ยัง Login ได้แต่สั่งซื้อ/จอง/แลกรางวัล/รับคูปองไม่ได้ (ตรวจใน RPC) และแสดงข้อความแจ้งใน Dashboard

---

### 4.10 Points Management — `/admin/points` (S10)

| ส่วน | รายละเอียด |
|---|---|
| ตั้งค่า | อัตรา `baht_per_point` (`site_settings.points_rule`) · แสดงสูตร "คะแนน = (ยอดสินค้า − ส่วนลดคูปอง) ÷ อัตรา (ไม่รวมค่าส่ง)" (D-04) · ตัวอย่าง "ยอดสินค้า 4,990 บาท ไม่มีคูปอง → 49 คะแนน" |
| ประวัติรวม | `points_transactions` ทุกคน: วันที่, สมาชิก, ประเภท, +/−, คงเหลือ, อ้างอิง (Order/Redemption), ผู้ทำ, หมายเหตุ |
| ปรับคะแนน | เลือกสมาชิก → จำนวน (+/−) → เหตุผล (บังคับ) → `admin_adjust_points()` · ห้ามทำให้ติดลบ |

### 4.11 Rewards Management — `/admin/rewards` (S12)

| แท็บ | รายละเอียด |
|---|---|
| ของรางวัล | CRUD: ชื่อ, รายละเอียด, ภาพ 600×600, คะแนนที่ใช้ (> 0), จำนวนคงเหลือ (≥ 0), ลำดับ, สถานะ · **เป็นของที่จับต้องได้เท่านั้น (D-06)** · ลบไม่ได้ถ้ามีประวัติการแลก (FK RESTRICT — ใช้ปิดสถานะแทน) |
| คำขอแลก | รายการ `reward_redemptions`: วันที่, สมาชิก, รางวัล, คะแนน, สถานะ · [ส่งมอบแล้ว] → `fulfilled` · [ยกเลิก] (เหตุผล) → `cancelled` + คืนคะแนน + คืนจำนวนรางวัล |

---

### 4.12 Promotion Management — `/admin/promotions` (S19)

**รายการ:** Banner ย่อ, ชื่อ, ประเภท/มูลค่าส่วนลด, Start–End, จำนวนสินค้า, สถานะที่คำนวณได้ (**กำลังใช้งาน / ตั้งเวลาไว้ / หมดอายุ / ปิดอยู่**), แสดงหน้าแรก

**ฟอร์ม**

| ฟิลด์ | Validation |
|---|---|
| Promotion Name | บังคับ |
| Slug | ไม่ซ้ำ |
| Promotion Description | — |
| Discount Type | `percentage` / `fixed_amount` |
| Discount Value | > 0 · ถ้าเป็น % ต้อง ≤ 100 · ถ้าเป็นจำนวนเงิน เตือนเมื่อมากกว่าราคาสินค้าที่เลือก |
| Start Date / End Date | บังคับ · End > Start |
| สินค้าที่เข้าร่วม | Multi-select + ค้นหา + เลือกทั้งหมวด · แสดงราคาก่อน/หลังโปรโมชั่น และเตือนเมื่อสินค้ามี `sale_price` ต่ำกว่าอยู่แล้ว (ตามกฎ 6.2 จะใช้ราคาต่ำสุด) |
| Banner Desktop / Mobile | `ImagePicker` 1200×600 / 750×1000 |
| Promotion Status | Toggle เปิด/ปิด |
| แสดงบนหน้าแรก | Checkbox |
| ลำดับ | Number |

**Actions:** เพิ่ม · แก้ไข · ลบ (ConfirmDialog — ลบ `promotion_products` ตาม CASCADE) · ทำสำเนา *(ข้อเสนอ)* · [Preview หน้า Deals ↗]

**ผลต่อหน้าร้าน:** แสดงบน `/` และ `/deals` **เฉพาะ** ช่วงวันที่และเปิดใช้งาน · ราคาใน Card/Detail/Cart เปลี่ยนตาม `effective_price` ทันที

### 4.13 Coupon Management — `/admin/coupons`

| ส่วน | รายละเอียด |
|---|---|
| รายการ | รหัส, ชื่อ, ประเภท (general/birthday), ส่วนลด, ขั้นต่ำ, ใช้ไปแล้ว/จำกัด (`used_count` อ่านอย่างเดียว — นับเฉพาะ Order ที่ไม่ถูกยกเลิก), ช่วงเวลา, สถานะ |
| ฟอร์ม | รหัส (บังคับสำหรับ general, ตัวพิมพ์ใหญ่, ไม่ซ้ำ), ชื่อ, ประเภท, Discount Type/Value, เพดานส่วนลด, ยอดขั้นต่ำ, จำกัดจำนวนครั้งรวม, จำกัดต่อคน, Start/End, สถานะ |
| คูปองวันเกิด | มีแม่แบบ 1 รายการ (`coupon_type = 'birthday'`) ที่ผูกกับ `site_settings.birthday_rule` · แท็บ "ที่ออกให้สมาชิก" แสดง `member_coupons`: สมาชิก, รหัส, ปี, รับเมื่อ, หมดอายุ, ใช้แล้ว/Order |
| ลบ | ไม่ได้ถ้าเคยถูกใช้ → ปิดสถานะแทน |

---

### 4.14 Service Management — `/admin/services` (S08)

CRUD บริการ: ชื่อ, slug, รายละเอียด, ราคา (≥ 0), ระยะเวลา (นาที > 0), ภาพ 600×400, ลำดับ, สถานะ · ลบไม่ได้ถ้ามีการจอง → ปิดสถานะแทน · ตั้งค่าช่วงเวลา/วันปิด/จองล่วงหน้าสูงสุด อยู่ที่ Settings → Booking

### 4.15 Booking Management — `/admin/bookings` (S08)

| ส่วน | รายละเอียด |
|---|---|
| มุมมอง | ตาราง (ค่าเริ่มต้น) + ปฏิทินรายสัปดาห์ *(ข้อเสนอ ไม่บังคับ)* |
| รายการ | เลขการจอง, บริการ, วันที่, เวลา, ผู้จอง (ชื่อ/เบอร์/อีเมล), สถานะ, หมายเหตุ |
| Filter | สถานะ (`pending` เป็นค่าเริ่มต้น), บริการ, ช่วงวันที่ |
| Actions | ผ่าน `admin_update_booking()`: `pending` → [ยืนยัน] / [ยกเลิก] · `confirmed` → [เสร็จสิ้น] / [ยกเลิก] · ข้ามขั้นไม่ได้ (`INVALID_TRANSITION`) · เพิ่ม Admin Note ได้ |
| ผลต่อลูกค้า | สถานะใน `/dashboard/bookings` เปลี่ยนทันที · ช่วงเวลาที่ถูกยกเลิกกลับมาว่างให้จองได้ |

---

### 4.16 Reports & Analytics — `/admin/reports` (S17)

| แท็บ | เนื้อหา | กราฟ/ตาราง (SPEC) | RPC |
|---|---|---|---|
| Sales Report | ยอดขายรวม, จำนวน Order สำเร็จ, ค่าเฉลี่ยต่อ Order, ยอดขายราย วัน/เดือน | StatCard 220×120, กราฟ 700×320 | `report_sales()` |
| Order Report | จำนวน Order ตามสถานะ, อัตรายกเลิก | ตาราง + Bar | `report_order_status()` |
| Best Selling Products | Top 10 ตามจำนวนชิ้นและยอดเงิน | ตาราง (ภาพ 64×64) | `report_best_sellers()` |
| Customer Report | สมาชิกใหม่ในช่วง, Top ลูกค้าตามยอดซื้อ | ตาราง | `report_customers()` |
| Category Report | ยอดขายตามหมวดหมู่ | Pie/Donut 320×320 + ตาราง | `report_category_sales()` |

**ตัวควบคุม:** Date Filter 180×40 (ใช้ร่วมทุกแท็บ · วันที่ตามเวลาไทย รวมวันสุดท้าย — R-06) · ปุ่ม Export 160×40 → **Excel (.xlsx)** · ปุ่ม **พิมพ์ / บันทึก PDF** → เปิดหน้า `/admin/reports/print?...` แบบ Print-friendly (CSS `@media print`, ฟอนต์ไทยจาก `next/font`) แล้วใช้ "พิมพ์ → บันทึกเป็น PDF" ของเบราว์เซอร์ (D-09 — แก้ปัญหาฟอนต์ไทยของ jsPDF, R-13) · ทั้งสองแบบต้องมีหัวรายงาน: ชื่อร้าน, ชื่อรายงาน, ช่วงวันที่, วันเวลาที่ออกรายงาน, ข้อความ "รวม Demo Data" ถ้ามี

**กฎข้อมูล:** ยอดขายสำเร็จ = Order `paid`, `shipped`, `completed` · **ไม่นับ** `cancelled`, `pending_payment`, `payment_submitted` · มีตัวเลือก "ไม่รวม Demo Data" (`is_demo = false`)

---

### 4.17 Contact Message Management — `/admin/messages` (S20)

| ส่วน | รายละเอียด |
|---|---|
| รายการ | สถานะ (จุดสีสำหรับ `new`), ชื่อ, อีเมล, หัวข้อ, วันที่, สมาชิก/Guest |
| Filter | สถานะ (`new` เป็นค่าเริ่มต้น), ช่วงวันที่ · Search ชื่อ/อีเมล/หัวข้อ |
| รายละเอียด | เปิดอ่าน → เปลี่ยนเป็น `read` อัตโนมัติ · ข้อความเต็ม · ปุ่ม [ตอบกลับทางอีเมล] (`mailto:` พร้อมหัวข้อ "Re: …") · [ทำเครื่องหมายว่าตอบแล้ว] → `replied` · [เก็บถาวร] → `archived` · Admin Note |
| ลบ | ConfirmDialog (ข้อเสนอ: ใช้ archived แทนการลบ) |

---

### 4.18 Settings — `/admin/settings`

| แท็บ | ฟิลด์ (key ใน `site_settings`) | ผลต่อหน้าร้าน |
|---|---|---|
| Store | `store_info` (ชื่อ, Slogan, Tagline) · `hero_banner` (ภาพ 3 ขนาด, ข้อความปุ่ม, ลิงก์) | Header, Hero, Footer |
| About | `about_content` (ประวัติร้าน, จุดเด่น 5 ข้อ) · จัดการ `team_members` (CRUD + ลำดับ + Demo) · Gallery (เลือกจาก Image Library หมวด gallery) | `/about` |
| Contact | `store_contact` (เบอร์, อีเมล, ที่อยู่, Map Embed URL, ✓ "เป็นข้อมูลตัวอย่าง") · `social_links` | `/contact`, Footer |
| Commerce | `shipping_rule` (ค่าส่ง, ยอดขั้นต่ำส่งฟรี) · `points_rule` · `birthday_rule` | Checkout, Points, Birthday |
| Payment | `payment_mode` (แสดง "demo" แบบล็อก — ไม่มีตัวเลือก "live" จนกว่าจะเชื่อม Gateway จริง) · ภาพ QR ตัวอย่าง · ข้อมูลบัญชีตัวอย่าง | หน้า Payment |
| Booking | `booking_rule` (ช่วงเวลา, วันปิด, จองล่วงหน้าสูงสุด) | `/booking` |
| Uploads | `upload_rule` (ชนิดไฟล์, ขนาดสูงสุด) | Image Management |

---

## 5. ผลกระทบต่อหน้าร้าน

ตาม SPEC หัวข้อ 9 — ทุกข้อด้านล่างต้องทดสอบใน TEST_CASES

| # | Admin ทำ | หน้าร้านต้องเปลี่ยน | Test Case |
|---|---|---|---|
| 1 | เพิ่มสินค้า (active) | แสดงใน `/shop` และค้นหาเจอ | TC-ADM-01 |
| 2 | เปลี่ยนราคา | ราคาใหม่ใน Card/Detail/Cart · Order เก่าไม่เปลี่ยน | TC-ADM-03 |
| 3 | ปรับสต็อก | ป้ายสต็อกและจำนวนสูงสุดในตะกร้าเปลี่ยน | TC-ADM-06 |
| 4 | ปิดการขาย | สินค้าหายจาก `/shop`, URL เดิมแสดง 404 | TC-ADM-04 |
| 5 | สร้าง/เปิดโปรโมชั่น | แสดงบน `/` และ `/deals` เฉพาะในช่วงวันที่ | TC-PRM-01, 02 |
| 6 | ยืนยันการชำระ | สถานะใน `/dashboard/orders` เปลี่ยน | TC-PAY-03 |
| 7 | ปิดงาน Order | คะแนนสมาชิกเพิ่ม | TC-PTS-01 |
| 8 | ยืนยันการจอง | สถานะใน `/dashboard/bookings` เปลี่ยน | TC-BKG-03 |
| 9 | แก้ข้อมูลติดต่อ | `/contact` และ Footer เปลี่ยน | TC-CNT-04 |
| 10 | แก้หมวดหมู่ | Homepage/Filter เปลี่ยน | TC-ADM-08 |

---

## 6. Checklist การพัฒนา Admin

ลำดับแนะนำภายใน Phase 5 (SPEC หัวข้อ 14)

- [ ] สร้าง Admin คนแรกด้วย SQL และทดสอบ Middleware/Layout guard
- [ ] `AdminLayout`, `DataTable`, `FormPanel`, `ConfirmDialog`, `ImagePicker`
- [ ] Image Management (เพราะเมนูอื่นต้องใช้ `ImagePicker`)
- [ ] Categories → Brands → Products → Stock
- [ ] Orders → Payments
- [ ] Customers → Points → Rewards
- [ ] Promotions → Coupons
- [ ] Services → Bookings
- [ ] Contact Messages → Settings
- [ ] Dashboard Overview → Reports + Export (ทำท้ายสุดเมื่อมีข้อมูลทดสอบจริงแล้ว)
- [ ] ทดสอบด้วยบัญชี Member ว่าเข้า `/admin` และเรียก RPC `admin_*` ไม่ได้
- [ ] ทุก Server Action ของ Admin เรียก `revalidatePath()` ตามตาราง 3.1
- [ ] หน้า Print-friendly ของรายงาน (D-09)
