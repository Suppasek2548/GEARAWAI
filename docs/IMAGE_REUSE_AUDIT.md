# GEARAWAI — ตรวจสอบภาพเดิมเพื่อนำกลับมาใช้ (Image Reuse Audit)

> จัดทำ 2026-11-12 · ตรวจอย่างเดียว — ไม่ได้แก้โค้ด/ฐานข้อมูล ไม่ได้อัปโหลด ลบ หรือแทนที่ภาพใด
> เทียบกับรายการ 48 ภาพใน [IMAGE_PROMPT_LIBRARY.md](IMAGE_PROMPT_LIBRARY.md)

## 1. ภาพที่มีอยู่จริง

ค้นใน `C:\Projects\gearawai` (ยกเว้น node_modules/.next/.git), โฟลเดอร์ OneDrive `Documents\GEARAWAI`, Downloads, Pictures, Desktop และ Supabase Storage

| แหล่ง | สิ่งที่พบ | สถานะ |
| --- | --- | --- |
| `public/images/products/placeholder-ga-*.svg` | **20 ไฟล์** SVG 800×800 (~1 KB/ไฟล์) — การ์ดตัวอักษร: หมวด (สี Lime), ชื่อสินค้า, `SKU · GEARAWAI DEMO IMAGE` บนพื้นเข้ม + กรอบ Gradient · **ไม่มีภาพวัตถุ** | **ใช้งานอยู่** เป็นภาพหลักของสินค้าทั้ง 20 รายการ + อยู่ในประวัติคำสั่งซื้อ (ห้ามลบ/แทนที่) |
| `scripts/illustrations/gearawai-illustrations.js` | **ภาพประกอบเวกเตอร์ 37 ภาพ** ที่สร้างไว้ก่อนหน้า (เก็บเป็นโค้ด SVG — ยังไม่เคย Export เป็นไฟล์ภาพ): Hero 3, สินค้า 20, หมวดหมู่ 8, Promotion 2, รางวัล 4 | ยังไม่ Commit · Render ได้ขนาดตรง SPEC ทุกภาพ |
| `public/_tmp/gai.js`, `preview.html` | สำเนาสคริปต์ด้านบน + หน้า Preview ชั่วคราว (ไม่ใช่ภาพ) | ไฟล์ชั่วคราว — ควรลบหลังเสร็จงาน |
| `app/favicon.ico` | ICO 48/32/16 px — ไอคอนเริ่มต้นจาก create-next-app (Phase 1) ไม่ใช่ของร้าน | ใช้งานอยู่ |
| OneDrive / Downloads / Pictures / Desktop | ไม่พบไฟล์ภาพที่เกี่ยวกับ GEARAWAI | — |
| Supabase Storage | `product-images` 0 · `site-media` 0 · `media_files` 0 แถว (มีเฉพาะ `payment-slips` 2 และ `avatars` 1 ซึ่งเป็นข้อมูลทดสอบของสมาชิก — ไม่ใช่ภาพเว็บไซต์) | — |

ไม่พบ PNG / JPG / WebP ใด ๆ ของโปรเจกต์ — ภาพ WebP ที่เคยแสดงใน Preview เป็นเพียงข้อมูลในหน่วยความจำของเบราว์เซอร์ ไม่ได้บันทึกเป็นไฟล์

## 2. คุณภาพของภาพประกอบในสคริปต์ (ตรวจจาก Render จริง, WebP q0.9)

| กลุ่ม | ขนาดตรง SPEC | ขนาดไฟล์ | จุดดี | ข้อจำกัด / ต้องแก้ |
| --- | --- | --- | --- | --- |
| Hero 3 ภาพ | ✅ 1920×700 / 1200×600 / 750×1000 | 38–62 KB | ฉากคีย์บอร์ด+เมาส์+หูฟัง อยู่ฝั่งขวา ฝั่งซ้ายว่างตาม Safe zone ของหน้าเว็บ · ไม่มีตัวอักษร | สไตล์เวกเตอร์เรียบ ไม่สมจริง · แสง Lime ใต้หูฟังยังดูเป็นแผ่นทึบเล็กน้อย |
| สินค้า 20 ภาพ | ✅ 800×800 | 20–34 KB | สไตล์เดียวกันทั้งชุด · ไม่มีโลโก้แบรนด์ · มีป้าย "ILLUSTRATION · ภาพประกอบ" ชัดเจน | **ทรงเดียวกันทั้งประเภท** (เมาส์ 5 ตัวต่างกันแค่สีไฟ, คีย์บอร์ด/หูฟัง/เก้าอี้เช่นกัน) · มีชื่อแบรนด์+ชื่อรุ่นเป็นตัวอักษรธรรมดาบนภาพ (ซ้ำกับชื่อบนการ์ด แต่ไม่ใช่โลโก้) |
| หมวดหมู่ 8 ภาพ | ✅ 600×600 | 12–23 KB | วัตถุชิ้นเดียว อ่านออกที่ 144px | **มีชื่อหมวดเป็นตัวอักษรในภาพ** ซ้ำกับชื่อใต้การ์ด และเล็กเกินอ่าน (~10px) → ควรตัดออก |
| Promotion 2 ภาพ | ✅ 1200×600 / 750×1000 | 18–19 KB | หูฟังฝั่งขวา ซ้ายมืดสำหรับข้อความ · Mobile วางวัตถุแถบกลาง (เข้ากับการ์ดมือถือที่เห็นเฉพาะแถบกลาง) | มีสัญลักษณ์ % จาง ๆ เป็นลวดลาย |
| รางวัล 4 ภาพ | ✅ 600×600 | 14–15 KB | แก้ว/แผ่นรอง/สติกเกอร์/พวงกุญแจ มีคำว่า GEARAWAI จากฟอนต์จริง (ชื่อร้านเอง) | **มีชื่อรางวัลภาษาไทยท้ายภาพ** ซ้ำกับชื่อบนการ์ด → ควรตัดออก |

> ข้อควรทราบ: ภาพชุดนี้คือชุดเดียวกับที่ประเมินไว้ก่อนหน้าว่า "คุณภาพต่ำกว่ามาตรฐานที่ต้องการ" (ไม่สมจริง, รายละเอียดน้อย) — ใช้งานได้และดีกว่า Placeholder ตัวอักษร แต่ไม่ใช่ภาพระดับ Photorealistic ตาม IMAGE_PROMPT_LIBRARY

## 3. ตารางจับคู่ 48 รายการ

สถานะ: **READY** = ใช้ได้ทันที · **NEEDS EDIT** = มีภาพแล้วแต่ต้อง Export/ปรับก่อนใช้ · **MISSING** = ไม่มีภาพ

| Image ID | ตำแหน่งใช้งาน | ไฟล์ภาพเดิม | คุณภาพ | ขนาด | สถานะ |
| --- | --- | --- | --- | --- | --- |
| HERO-01 | หน้าแรก Hero Desktop | สคริปต์ `GAI.hero(1920,700)` | พอใช้ (เวกเตอร์) | 1920×700 · 62 KB | NEEDS EDIT — Export + ลดแสง Lime ใต้หูฟัง |
| HERO-02 | หน้าแรก Hero Tablet | สคริปต์ `GAI.hero(1200,600)` | พอใช้ | 1200×600 · 42 KB | NEEDS EDIT — Export (+ แก้แสงเดียวกัน) |
| HERO-03 | หน้าแรก Hero Mobile | สคริปต์ `GAI.hero(750,1000)` | พอใช้ | 750×1000 · 38 KB | NEEDS EDIT — Export (+ แก้แสงเดียวกัน) |
| PRD-01 | สินค้า GA-MS-001 | ① `placeholder-ga-ms-001.svg` (ใช้อยู่) ② สคริปต์ product #1 | ① ตัวอักษรล้วน ② พอใช้ | 800×800 · ② 21 KB | NEEDS EDIT — Export ② (① คงไว้เป็นภาพสำรอง) |
| PRD-02 | สินค้า GA-MS-002 | ① placeholder ② สคริปต์ #2 | 〃 | 800×800 · 24 KB | NEEDS EDIT — Export |
| PRD-03 | สินค้า GA-MS-003 | ① placeholder ② สคริปต์ #3 | 〃 | 800×800 · 20 KB | NEEDS EDIT — Export |
| PRD-04 | สินค้า GA-MS-004 | ① placeholder ② สคริปต์ #4 | 〃 | 800×800 · 22 KB | NEEDS EDIT — Export |
| PRD-05 | สินค้า GA-MS-005 | ① placeholder ② สคริปต์ #5 | 〃 | 800×800 · 24 KB | NEEDS EDIT — Export |
| PRD-06 | สินค้า GA-KB-001 | ① placeholder ② สคริปต์ #6 | 〃 | 800×800 · 27 KB | NEEDS EDIT — Export |
| PRD-07 | สินค้า GA-KB-002 | ① placeholder ② สคริปต์ #7 | 〃 | 800×800 · 26 KB | NEEDS EDIT — Export |
| PRD-08 | สินค้า GA-KB-003 | ① placeholder ② สคริปต์ #8 | 〃 | 800×800 · 26 KB | NEEDS EDIT — Export |
| PRD-09 | สินค้า GA-KB-004 | ① placeholder ② สคริปต์ #9 | 〃 | 800×800 · 28 KB | NEEDS EDIT — Export |
| PRD-10 | สินค้า GA-KB-005 | ① placeholder ② สคริปต์ #10 | 〃 | 800×800 · 25 KB | NEEDS EDIT — Export |
| PRD-11 | สินค้า GA-HS-001 | ① placeholder ② สคริปต์ #11 | 〃 | 800×800 · 23 KB | NEEDS EDIT — Export |
| PRD-12 | สินค้า GA-HS-002 | ① placeholder ② สคริปต์ #12 | 〃 | 800×800 · 23 KB | NEEDS EDIT — Export |
| PRD-13 | สินค้า GA-HS-003 | ① placeholder ② สคริปต์ #13 | 〃 | 800×800 · 23 KB | NEEDS EDIT — Export |
| PRD-14 | สินค้า GA-HS-004 | ① placeholder ② สคริปต์ #14 | 〃 | 800×800 · 21 KB | NEEDS EDIT — Export |
| PRD-15 | สินค้า GA-HS-005 | ① placeholder ② สคริปต์ #15 | 〃 | 800×800 · 23 KB | NEEDS EDIT — Export |
| PRD-16 | สินค้า GA-CH-001 | ① placeholder ② สคริปต์ #17 | 〃 | 800×800 · 20 KB | NEEDS EDIT — Export |
| PRD-17 | สินค้า GA-CH-002 | ① placeholder ② สคริปต์ #18 | 〃 | 800×800 · 24 KB | NEEDS EDIT — Export |
| PRD-18 | สินค้า GA-RW-001 | ① placeholder ② สคริปต์ #19 | 〃 | 800×800 · 24 KB | NEEDS EDIT — Export |
| PRD-19 | สินค้า GA-MP-001 | ① placeholder ② สคริปต์ #16 | 〃 | 800×800 · 21 KB | NEEDS EDIT — Export |
| PRD-20 | สินค้า GA-ST-001 | ① placeholder ② สคริปต์ #20 | 〃 | 800×800 · 34 KB | NEEDS EDIT — Export |
| CAT-01 | หมวด Gaming Mouse | สคริปต์ category #1 | ดี | 600×600 · 13 KB | NEEDS EDIT — ตัดชื่อหมวดในภาพ + Export |
| CAT-02 | หมวด Gaming Keyboard | สคริปต์ category #2 | ดี | 600×600 · 17 KB | NEEDS EDIT — 〃 |
| CAT-03 | หมวด Gaming Headset | สคริปต์ category #3 | ดี | 600×600 · 14 KB | NEEDS EDIT — 〃 |
| CAT-04 | หมวด Mouse Pad | สคริปต์ category #4 | ดี | 600×600 · 12 KB | NEEDS EDIT — 〃 |
| CAT-05 | หมวด Gaming Chair | สคริปต์ category #5 | ดี | 600×600 · 13 KB | NEEDS EDIT — 〃 |
| CAT-06 | หมวด Racing Wheel | สคริปต์ category #6 | ดี | 600×600 · 15 KB | NEEDS EDIT — 〃 |
| CAT-07 | หมวด Streaming Equipment | สคริปต์ category #7 | ดี | 600×600 · 23 KB | NEEDS EDIT — 〃 |
| CAT-08 | หมวด Computer Accessories | สคริปต์ category #8 (USB hub) | ดี | 600×600 · 15 KB | NEEDS EDIT — 〃 |
| PRO-01 | Headset Week Desktop | สคริปต์ `GAI.promo(1200,600)` | พอใช้ | 1200×600 · 18 KB | NEEDS EDIT — Export |
| PRO-02 | Headset Week Mobile | สคริปต์ `GAI.promo(750,1000)` | พอใช้ | 750×1000 · 19 KB | NEEDS EDIT — Export |
| RWD-01 | สติกเกอร์ GEARAWAI | สคริปต์ reward `sticker` | ดี | 600×600 · 15 KB | NEEDS EDIT — ตัดชื่อรางวัลท้ายภาพ + Export |
| RWD-02 | พวงกุญแจ GEARAWAI | สคริปต์ reward `keychain` | ดี | 600×600 · 14 KB | NEEDS EDIT — 〃 |
| RWD-03 | แก้วน้ำ GEARAWAI | สคริปต์ reward `mug` | ดี | 600×600 · 14 KB | NEEDS EDIT — 〃 |
| RWD-04 | แผ่นรองเมาส์ขนาดเล็ก | สคริปต์ reward `pad` | ดี | 600×600 · 15 KB | NEEDS EDIT — 〃 |
| TEAM-01 | About — Project Manager | — | — | — | MISSING (หน้าเว็บแสดงอักษรย่อแทนได้) |
| TEAM-02 | About — Frontend | — | — | — | MISSING (〃) |
| TEAM-03 | About — Backend/DB | — | — | — | MISSING (〃) |
| TEAM-04 | About — UI/UX | — | — | — | MISSING (〃) |
| ICON-01 | Favicon | `app/favicon.ico` (ไอคอน Next.js) | ไม่ใช่ของร้าน | 48/32/16 | MISSING (ใช้ของเดิมได้ชั่วคราว) |
| GAL-01 | About Gallery | — | — | — | MISSING (P2 — Section ซ่อนอัตโนมัติ) |
| GAL-02 | About Gallery | — | — | — | MISSING (P2) |
| GAL-03 | About Gallery | — | — | — | MISSING (P2) |
| SRV-01 | บริการ (หน้าร้านไม่แสดง) | — | — | — | MISSING (P2) |
| SRV-02 | 〃 | — | — | — | MISSING (P2) |
| SRV-03 | 〃 | — | — | — | MISSING (P2) |

## 4. สรุปจำนวน

| สถานะ | จำนวน | รายการ |
| --- | ---: | --- |
| **READY** | **0** | ยังไม่มีไฟล์ภาพเป้าหมายที่พร้อมอัปโหลดทันที (Placeholder SVG 20 ไฟล์ "ใช้งานอยู่แล้ว" เป็นภาพสำรองของสินค้า) |
| **NEEDS EDIT** | **37** | Hero 3 · สินค้า 20 · หมวดหมู่ 8 · Promotion 2 · รางวัล 4 — มีภาพแล้ว ต้อง Export เป็น WebP (และตัดข้อความซ้ำใน 12 ภาพ) |
| **MISSING** | **11** | Team 4 · Favicon 1 · Gallery 3 · บริการ 3 |

**ภาพที่ขาดแต่ "ไม่จำเป็นต้องสร้างตอนนี้"** — ทั้ง 11 รายการมีทางแสดงแทนหรือไม่กระทบหน้าเว็บ:
- Team 4: หน้า About แสดงวงกลมอักษรย่อบน Gradient อยู่แล้ว
- Favicon: ใช้ไอคอนเดิมได้ (แต่เป็นของ Next.js ไม่ใช่ของร้าน)
- Gallery 3: Section ถูกซ่อนเมื่อไม่มีภาพ
- บริการ 3: หน้าร้านยังไม่แสดงภาพบริการ

→ **ภาพที่ต้องสร้างใหม่จริงเพื่อให้เว็บครบในระดับ P0/P1: 0 ภาพ** (ถ้ายอมรับภาพประกอบเวกเตอร์ชุดเดิม) · ถ้าต้องการ Favicon ของร้าน ต้องทำเพิ่ม 1 ภาพ (โค้ด SVG ไม่ใช้ AI)

## 5. แผนนำภาพเดิมกลับมาใช้ (รออนุมัติ — ยังไม่ได้ทำ)

| ขั้น | งาน | แตะอะไร |
| --- | --- | --- |
| 1 | แก้สคริปต์ `scripts/illustrations/gearawai-illustrations.js` เล็กน้อย: ตัดชื่อหมวดใน CAT-01…08, ตัดชื่อรางวัลใน RWD-01…04, ลดแสง Lime ใต้หูฟังใน Hero (ไม่สร้างภาพใหม่ — แก้ภาพเดิม) | ไฟล์สคริปต์ (ยังไม่ Commit) |
| 2 | Export 37 ภาพเป็น WebP (q0.9) ลง `image-assets/final/` ตามชื่อไฟล์ใน IMAGE_PROMPT_LIBRARY — ใช้ `sharp` ที่มีอยู่แล้วใน `node_modules` (ไม่ติดตั้ง Package เพิ่ม) หรือ Canvas ในเบราว์เซอร์ | ไฟล์ใหม่ในโฟลเดอร์ที่ไม่ถูกเผยแพร่ |
| 3 | แสดง Preview ทั้ง 37 ภาพให้ตรวจ | — |
| 4 | นำเข้าผ่าน Admin (คุณล็อกอิน admin.demo เอง): Hero 3 → หมวดหมู่ 8 → สินค้า 20 (อัปโหลด + ตั้งเป็นภาพหลัก, **ไม่ลบแถว/ไฟล์ Placeholder**) → Headset Week 2 → รางวัล 4 | Supabase Storage + DB ผ่านหน้า Admin |
| 5 | ตรวจหน้าร้าน (หน้าแรก, `/categories`, `/shop`, หน้าสินค้า, `/deals`, `/dashboard/rewards`) + จำนวน `media_files` | อ่านอย่างเดียว |
| 6 | ลบ `public/_tmp/` (ไฟล์ชั่วคราวที่ Claude สร้าง ไม่ใช่ภาพเดิม) | ต้องอนุมัติ |
| ไม่บังคับ | Favicon "G" เป็น `app/icon.svg` | แก้โค้ด — ต้องอนุมัติแยก |

**เรื่อง Placeholder (ข้อ 4):** คำสั่ง "ห้ามแทนที่ Placeholder SVG ที่ใช้งานอยู่" — แผนนี้ **ไม่แตะไฟล์ SVG** แต่การตั้งภาพใหม่เป็น "ภาพหลัก" จะทำให้หน้าร้านแสดงภาพใหม่แทน SVG (แถว Placeholder ยังอยู่เป็นภาพที่ 2 และสลับกลับได้ทันทีจาก Admin) — ต้องการให้ทำแบบนี้ หรือให้ใส่ภาพใหม่เป็นภาพรองโดยคง SVG เป็นภาพหลักไว้ กรุณายืนยัน
