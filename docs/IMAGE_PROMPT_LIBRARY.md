# GEARAWAI — คู่มือสร้างภาพด้วย ChatGPT Images (Image Asset Requirements & Prompt Library)

> สถานะ: **ร่างเพื่อรออนุมัติ** · จัดทำ 2026-11-12 · อ้างอิงโค้ด, ฐานข้อมูลจริง (อ่านอย่างเดียว) และเอกสาร SPEC / PRODUCT_DATA / DATABASE_DESIGN / ADMIN_DESIGN / UI_UX_DESIGN / REVIEW_REPORT
> งานนี้ **ไม่ได้** แก้โค้ด ฐานข้อมูล Storage หรือภาพใด ๆ — เป็นเอกสารวางแผนเท่านั้น

---

## 0. สรุปผล

### 0.1 จำนวนภาพ

| หมวด | จำนวนไฟล์ | สร้างใน ChatGPT (ครั้ง) | Priority | หมายเหตุ |
| --- | ---: | ---: | --- | --- |
| A. ภาพสินค้า (ภาพหลัก) | 20 | 20 | P0 | 1 ภาพ/สินค้า (ระบบรองรับหลายภาพ — มุมเพิ่มเติมอยู่ใน A.21 เป็น P2) |
| B. ภาพหมวดหมู่ | 8 | 8 | P0 | รวม Computer Accessories ที่ยังไม่มีสินค้า (แสดงบนหน้าแรกอยู่แล้ว) |
| C. Hero Banner | 3 | 2 | P0 | Desktop + Tablet ครอปจากต้นฉบับแนวนอนภาพเดียว · Mobile แยก |
| D. Promotion Banner (Headset Week) | 2 | 2 | P1 | Desktop + Mobile |
| E. ภาพของรางวัล | 4 | 4 | P1 | |
| F. Team Avatar | 4 | 4 | P1 | Avatar กราฟิกตามบทบาท — ไม่มีใบหน้าคน |
| G. Gallery (About) | 3 | 3 | P2 | Section ถูกซ่อนอัตโนมัติถ้าไม่มีภาพ |
| H. Favicon / App Icon | 1 | 0 | P1 | **ไม่สร้างด้วย AI** — ทำเป็นไฟล์ SVG จากโค้ด (ต้องแก้โค้ด → รออนุมัติ) |
| I. ภาพบริการ (Services) | 3 | 3 | P2 | มีช่องใน Admin แต่ **หน้าร้านยังไม่แสดง** |
| **รวมทั้งหมด** | **48** | **46** | | |

- **ต้องสร้างจริงใน ChatGPT ตอนนี้ (P0 + P1): 41 ไฟล์ จากการสร้าง 40 ครั้ง** (Hero Desktop/Tablet ใช้ต้นฉบับเดียวกัน)
  - P0 = 31 ไฟล์ (30 ครั้ง) · P1 = 10 ไฟล์ (10 ครั้ง) + Favicon 1 ไฟล์ที่ไม่ใช้ AI
- P2 (ยังไม่จำเป็น) = 6 ไฟล์ + มุมเพิ่มเติมของสินค้า (ไม่นับ)
- **ไม่นับ / ไม่ต้องสร้าง:** QR ชำระเงิน (ระบบวาดเอง), โลโก้แบรนด์ 7 แบรนด์, โลโก้ช่องทางชำระเงิน, โลโก้ร้าน (ใช้ตัวอักษรจากโค้ด), แบนเนอร์ Contact, ภาพประวัติร้าน, ภาพวันเกิด, ภาพหน้า Login, Avatar สมาชิก — รายละเอียดในหัวข้อ 9

### 0.2 เอกสารที่ขาด / ข้อขัดแย้งที่ต้องรายงาน

| # | เรื่อง | รายละเอียด |
| --- | --- | --- |
| 1 | **ไม่พบ `GEARAWAI_AI_IMAGE_PLAN.md`** | ค้นทั้ง `C:\Projects\gearawai` และโฟลเดอร์ OneDrive `GEARAWAI\docs` แล้วไม่มีไฟล์นี้ — เอกสารนี้จึงอ้างอิง SPEC + โค้ดจริงแทน ถ้ามีไฟล์ดังกล่าวอยู่ที่อื่น กรุณาแนบมาเพื่อเทียบ |
| 2 | ภาพ Mockup ที่ SPEC อ้างถึง (M15) | ยังไม่มีใน Project (REVIEW_REPORT) — ใช้ Palette ของเว็บจริงแทน |
| 3 | SPEC กำหนดขนาดภาพบางตำแหน่งที่โค้ดไม่มีช่องใส่ภาพ | Contact Banner 1920×300, ภาพประกอบ Contact 1200×800, ภาพประวัติร้าน 1200×800, ภาพวันเกิด 800×500 — หน้าเว็บใช้ Gradient/ไอคอนแทน (หัวข้อ 9) |
| 4 | Promotion Banner Mobile 750×1000 แสดงในการ์ดแนวนอน | บนมือถือการ์ดโปรโมชั่นสูงแค่ ~220px แต่ภาพเป็นแนวตั้ง → เห็นเพียง **แถบกลางภาพ (~30–70% ของความสูง)** — Prompt ใน D-02 ออกแบบให้รองรับแล้ว |

---

## 1. วิธีใช้คู่มือนี้ (Workflow)

1. เลือกภาพจากตารางหลัก (หัวข้อ 3) → ไปที่รายละเอียดของภาพนั้น
2. คัดลอก **Prompt** (กล่องโค้ด) ไปวางใน ChatGPT → ตรวจตาม Checklist (หัวข้อ 2.5)
3. ดาวน์โหลดไฟล์ต้นฉบับ (ปกติเป็น PNG) แล้ว **ตั้งชื่อตาม "ชื่อไฟล์ต้นฉบับ"** เก็บไว้ที่
   `C:\Projects\gearawai\image-assets\source\`
   (โฟลเดอร์นี้ไม่อยู่ใน `public/` จึงไม่ถูกเผยแพร่ — การ Commit หรือไม่ ค่อยตัดสินใจภายหลัง)
4. แจ้ง Claude → Claude ตรวจขนาด/สัดส่วน, **ครอปตามตาราง 2.3 (ไม่บิดสัดส่วน)**, ย่อ/ขยาย, แปลงเป็น WebP ลง
   `C:\Projects\gearawai\image-assets\final\` แล้วแสดงตัวอย่างให้ตรวจ
5. เมื่ออนุมัติ → Claude นำเข้าผ่าน Admin (ต้องให้คุณล็อกอิน admin.demo เอง) ตามตำแหน่งที่ระบุใน "ใช้ที่"

**เคล็ดลับความสม่ำเสมอ:** สร้างภาพหมวดเดียวกันใน **แชทเดียวกันของ ChatGPT** และหลังได้ภาพแรกที่พอใจ ให้ต่อท้าย Prompt ถัดไปด้วย
`Match exactly the lighting, background, camera angle and render style of the approved image above.`

---

## 2. มาตรฐานภาพ GEARAWAI

### 2.1 สีและสไตล์

| Token | ค่า | ใช้ที่ |
| --- | --- | --- |
| Main background | `#0A0B1E` | พื้นหลังหลักของเว็บ / ฉากภาพสินค้า |
| Surface | `#12143A` | การ์ดสินค้า (ภาพสินค้าควรกลืนกับสีนี้) |
| Primary | `#1F06AC` | แสงขอบ (Rim light), Gradient |
| Secondary (โค้ดจริง) | `#0F42C0` | จุดกลางของ Gradient แบรนด์ |
| Accent / Secondary (ตาม Brief) | `#5882E8` | แสงฟ้า, เงาสะท้อน |
| Lime accent | `#E3EF4F` | **ใช้น้อยมาก** 1–2 จุดต่อภาพ |
| Brand gradient | `135° #1F06AC → #0F42C0 → #5882E8` | พื้นหลังการ์ดหมวดหมู่ / รางวัล / Avatar / Hero |

สไตล์: Modern Gaming · Premium Tech · E-Commerce — Photorealistic 3D render, แสงเงามีมิติ, คม, ไม่มีตัวอักษร

### 2.2 ข้อกำหนดไฟล์ (ตรวจจากระบบจริง)

| ข้อ | ค่าในระบบ | ที่มา |
| --- | --- | --- |
| ชนิดไฟล์ | JPG, PNG, WebP | Bucket `allowed_mime_types` + `lib/admin/media-types.ts` |
| ขนาดสูงสุด | 2 MB ต่อไฟล์ (Hard-coded ใน `lib/admin/upload.ts`, Bucket limit 2 MB) | Migration 0018 |
| เตือนสัดส่วน | เตือน (ไม่บล็อก) เมื่อสัดส่วนต่างจากขนาดแนะนำเกิน ±5% | `RECOMMENDED` ใน `lib/admin/upload.ts` |
| Bucket | สินค้า → `product-images/products/{uuid}.webp` · อื่น ๆ → `site-media/{category}/{uuid}.webp` | `uploadImage()` |
| รูปแบบที่ใช้นำเข้า | **WebP คุณภาพ 85–90** | แนะนำ (เล็กกว่า PNG มาก) |

### 2.3 ขนาดที่สั่ง ChatGPT และวิธีครอป/ย่อ

ChatGPT Images มักให้ไฟล์ 3 ขนาด: **สี่เหลี่ยม 1024×1024**, **แนวนอน 1536×1024 (3:2)**, **แนวตั้ง 1024×1536 (2:3)** — ให้ตรวจขนาดจริงหลังดาวน์โหลด ถ้าได้ภาพใหญ่กว่านี้ให้ใช้สัดส่วนการครอปเดิม

| ปลายทาง (W×H) | Ratio | สั่ง ChatGPT | ครอปจากต้นฉบับ | ย่อ/ขยายเป็น | เป้าขนาดไฟล์ WebP |
| --- | --- | --- | --- | --- | --- |
| 800×800 (สินค้า) | 1:1 | 1024×1024 | ไม่ต้องครอป | ย่อ 800×800 | ≤ 250 KB |
| 600×600 (หมวด/รางวัล/ทีม) | 1:1 | 1024×1024 | ไม่ต้องครอป | ย่อ 600×600 | ≤ 150 KB |
| 1920×700 (Hero Desktop) | 2.74:1 | 1536×1024 | 1536×560 แถบกลาง (y ≈ 232) | ขยาย 1.25× → 1920×700 | ≤ 500 KB |
| 1200×600 (Hero Tablet / Promo Desktop) | 2:1 | 1536×1024 | 1536×768 แถบกลาง (y ≈ 128) | ย่อ 1200×600 | ≤ 350 KB |
| 750×1000 (Hero Mobile / Promo Mobile) | 3:4 | 1024×1536 | 1024×1365 (y ≈ 85) | ย่อ 750×1000 | ≤ 400 KB |
| 1200×800 (Gallery) | 3:2 | 1536×1024 | ไม่ต้องครอป | ย่อ 1200×800 | ≤ 400 KB |
| 600×400 (บริการ) | 3:2 | 1536×1024 | ไม่ต้องครอป | ย่อ 600×400 | ≤ 150 KB |

- ตำแหน่ง y ของการครอปปรับได้ตามภาพจริง แต่ **ห้ามบิดสัดส่วน** (ครอปก่อน แล้วค่อยย่อ/ขยายแบบล็อกสัดส่วน)
- Hero Desktop ต้องขยาย 1.25× เพราะ ChatGPT ให้ความกว้างสูงสุด 1536 — ยอมรับได้เพราะหน้าเว็บแสดงภาพ Hero ที่ความทึบ 50%
- ทั้งหมดต่ำกว่าเพดาน 2 MB มาก

### 2.4 ข้อห้ามมาตรฐาน (ใช้กับทุกภาพ)

- ห้ามโลโก้ / เครื่องหมายการค้า / ชื่อแบรนด์จริง และห้ามเลียนแบบดีไซน์สินค้าจริงจนเข้าใจผิดว่าเป็นของจริง
- ห้ามตัวอักษร ตัวเลข สัญลักษณ์ % หรือ Watermark ที่ AI สร้าง (ข้อความทั้งหมดของเว็บมาจากโค้ด)
- ห้ามภาพคนเสมือนจริง ห้ามมือ ห้ามใบหน้า
- ห้ามภาพหน้าร้าน/โชว์รูม/คลังสินค้า (GEARAWAI เป็นร้านออนไลน์)
- ห้ามนำภาพจากอินเทอร์เน็ตมาใช้หรือมาเป็นต้นแบบ

### 2.5 Checklist ตรวจภาพจาก ChatGPT ก่อนส่งให้ Claude

- [ ] ไม่มีตัวอักษร/โลโก้/ตัวเลขแฝง (ดูบนปุ่ม คีย์แคป แผ่นรอง และขอบภาพ)
- [ ] ชิ้นส่วนไม่เพี้ยน: คีย์บอร์ดเรียงปุ่มสม่ำเสมอ · เมาส์มีล้อเลื่อน 1 ล้อ · หูฟังมีหูฟัง 2 ข้างสมมาตร · เก้าอี้ขาดาว 5 แฉก · พวงมาลัยก้านสมมาตร · Stream deck ปุ่ม 15 ปุ่ม (5×3)
- [ ] วัตถุอยู่ใน "Safe zone" ตามที่ Prompt กำหนด (สำคัญมากกับ Hero และ Promotion)
- [ ] พื้นหลังโทนน้ำเงิน-กรมท่า ไม่สว่างเกิน ไม่มีสีแดง/ส้มเด่น
- [ ] ความคมชัดดีเมื่อซูม 100%

---

## 3. ตารางหลัก

| ID | ประเภท | ชื่อภาพ | ตำแหน่งใช้งาน | จำนวน | ขนาด (px) | Ratio | Format | Priority |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| HERO-01 | Hero | Hero Desktop | หน้าแรก `/` Hero (≥1024px) | 1 | 1920×700 | 2.74:1 | WebP | P0 |
| HERO-02 | Hero | Hero Tablet | หน้าแรก Hero (768–1023px) | 1 | 1200×600 | 2:1 | WebP | P0 |
| HERO-03 | Hero | Hero Mobile | หน้าแรก Hero (<768px) | 1 | 750×1000 | 3:4 | WebP | P0 |
| PRD-01 | สินค้า | Razer DeathAdder V3 Pro | ProductCard, `/shop/[slug]`, ตะกร้า, Wishlist, Checkout | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-02 | สินค้า | Logitech G Pro X Superlight 2 | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-03 | สินค้า | Logitech G502 X Plus | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-04 | สินค้า | Razer Viper V3 Pro | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-05 | สินค้า | SteelSeries Aerox 3 Wireless | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-06 | สินค้า | Razer BlackWidow V4 | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-07 | สินค้า | Logitech G Pro X TKL | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-08 | สินค้า | HyperX Alloy Origins | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-09 | สินค้า | SteelSeries Apex Pro TKL | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-10 | สินค้า | Keychron K8 Pro | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-11 | สินค้า | Logitech G733 Lightspeed | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-12 | สินค้า | Razer BlackShark V2 Pro | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-13 | สินค้า | SteelSeries Arctis Nova 7 | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-14 | สินค้า | HyperX Cloud III | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-15 | สินค้า | Logitech G Pro X 2 Lightspeed | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-16 | สินค้า | Razer Iskur V2 | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-17 | สินค้า | Secretlab TITAN Evo | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-18 | สินค้า | Logitech G923 Racing Wheel | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-19 | สินค้า | Razer Strider Chroma | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| PRD-20 | สินค้า | Elgato Stream Deck MK.2 | 〃 | 1 | 800×800 | 1:1 | WebP | P0 |
| CAT-01 | หมวดหมู่ | Gaming Mouse | หน้าแรก Popular Categories, `/categories` | 1 | 600×600 | 1:1 | WebP | P0 |
| CAT-02 | หมวดหมู่ | Gaming Keyboard | 〃 | 1 | 600×600 | 1:1 | WebP | P0 |
| CAT-03 | หมวดหมู่ | Gaming Headset | 〃 | 1 | 600×600 | 1:1 | WebP | P0 |
| CAT-04 | หมวดหมู่ | Mouse Pad | 〃 | 1 | 600×600 | 1:1 | WebP | P0 |
| CAT-05 | หมวดหมู่ | Gaming Chair | 〃 | 1 | 600×600 | 1:1 | WebP | P0 |
| CAT-06 | หมวดหมู่ | Racing Wheel | 〃 | 1 | 600×600 | 1:1 | WebP | P0 |
| CAT-07 | หมวดหมู่ | Streaming Equipment | 〃 | 1 | 600×600 | 1:1 | WebP | P0 |
| CAT-08 | หมวดหมู่ | Computer Accessories | 〃 (ป้าย "เร็ว ๆ นี้") | 1 | 600×600 | 1:1 | WebP | P0 |
| PRO-01 | โปรโมชั่น | Headset Week Desktop | หน้าแรก Promotions, `/deals` | 1 | 1200×600 | 2:1 | WebP | P1 |
| PRO-02 | โปรโมชั่น | Headset Week Mobile | หน้าแรก/`/deals` บนมือถือ (<768px) | 1 | 750×1000 | 3:4 | WebP | P1 |
| RWD-01 | รางวัล | สติกเกอร์ GEARAWAI | `/dashboard/rewards` Reward Card | 1 | 600×600 | 1:1 | WebP | P1 |
| RWD-02 | รางวัล | พวงกุญแจ GEARAWAI | 〃 | 1 | 600×600 | 1:1 | WebP | P1 |
| RWD-03 | รางวัล | แก้วน้ำ GEARAWAI | 〃 | 1 | 600×600 | 1:1 | WebP | P1 |
| RWD-04 | รางวัล | แผ่นรองเมาส์ขนาดเล็กลาย GEARAWAI | 〃 | 1 | 600×600 | 1:1 | WebP | P1 |
| TEAM-01 | ทีมงาน | Avatar Project Manager | `/about` Team Members | 1 | 600×600 | 1:1 | WebP | P1 |
| TEAM-02 | ทีมงาน | Avatar Frontend Developer | 〃 | 1 | 600×600 | 1:1 | WebP | P1 |
| TEAM-03 | ทีมงาน | Avatar Backend / Database | 〃 | 1 | 600×600 | 1:1 | WebP | P1 |
| TEAM-04 | ทีมงาน | Avatar UI/UX Designer | 〃 | 1 | 600×600 | 1:1 | WebP | P1 |
| ICON-01 | Favicon | Favicon / App icon "G" | แท็บเบราว์เซอร์, Bookmark | 1 | SVG (+PNG 512, 180) | 1:1 | SVG/PNG | P1 (ไม่ใช้ AI) |
| GAL-01 | Gallery | Gaming setup | `/about` Store Gallery | 1 | 1200×800 | 3:2 | WebP | P2 |
| GAL-02 | Gallery | Gear flat-lay | 〃 | 1 | 1200×800 | 3:2 | WebP | P2 |
| GAL-03 | Gallery | PC build workbench | 〃 | 1 | 1200×800 | 3:2 | WebP | P2 |
| SRV-01 | บริการ | บริการประกอบคอมพิวเตอร์ | Admin Services (หน้าร้านยังไม่แสดง) | 1 | 600×400 | 3:2 | WebP | P2 |
| SRV-02 | บริการ | บริการตรวจเช็กอุปกรณ์เกมมิ่ง | 〃 | 1 | 600×400 | 3:2 | WebP | P2 |
| SRV-03 | บริการ | บริการติดตั้งและตั้งค่าซอฟต์แวร์ | 〃 | 1 | 600×400 | 3:2 | WebP | P2 |

---

## 4. ลำดับการสร้าง

| ชุด | ภาพ | เหตุผล |
| --- | --- | --- |
| **ชุดทดลอง (3 ภาพ)** | ① **PRD-01** DeathAdder (สินค้า) ② **HERO-01/02** ต้นฉบับแนวนอน ③ **CAT-01** Gaming Mouse | ทดสอบ 3 รูปแบบที่ต่างกันที่สุด: ภาพสินค้าพื้นเข้ม, ภาพกว้างที่ต้องเว้นพื้นที่ข้อความ+ครอป, ภาพที่ต้องอ่านออกที่ 144px → ถ้าผ่านทั้ง 3 สไตล์ทั้งชุดจะไปทางเดียวกัน |
| ชุดที่ 1 (P0) | HERO-03 · PRD-02…05 (เมาส์) · CAT-02…08 | ปิดหน้าแรกให้ครบ |
| ชุดที่ 2 (P0) | PRD-06…10 (คีย์บอร์ด) · PRD-11…15 (หูฟัง) | สร้างทีละประเภทในแชทเดียวกันเพื่อความสม่ำเสมอ |
| ชุดที่ 3 (P0) | PRD-16…20 (เก้าอี้ พวงมาลัย แผ่นรอง Stream deck) | |
| ชุดที่ 4 (P1) | PRO-01, PRO-02 · RWD-01…04 · TEAM-01…04 · ICON-01 (Claude ทำจากโค้ด) | |
| ชุดที่ 5 (P2) | GAL-01…03 · SRV-01…03 · มุมเพิ่มเติมสินค้า | ทำเมื่อมีเวลา |

---

## 5. C — Hero Banner (P0)

**ตรวจจากโค้ด** `app/(store)/page.tsx` → `Hero`:
- ภาพอยู่ใน `<picture>`: Mobile `<768px` → `mobile_url`, Tablet `768–1023px` → `tablet_url`, อื่น ๆ → `desktop_url` · `object-fit: cover` · **ความทึบ 50%** ทับบน Brand gradient
- ความสูง Section: มือถือ ≥ 520px · ≥1024px = 560px · ≥1440px = 700px
- ข้อความ (ชื่อร้าน, **LEVEL UP YOUR GEAR**, คำโปรย, ปุ่ม SHOP NOW + View Deals): **ชิดซ้ายตั้งแต่ 768px ขึ้นไป** · **กึ่งกลางบนมือถือ**
- นำเข้า: Admin → `/admin/settings` แท็บ Store → Hero Desktop / Tablet / Mobile → บันทึก
- Alt: ภาพตกแต่ง (`alt=""` ในโค้ด) — ใส่ Alt ใน Media Library เพื่อการจัดการเท่านั้น

**Safe zone ที่คำนวณจาก Layout จริง (พิกัดบนภาพปลายทาง)**

| ภาพ | พื้นที่ข้อความ (ต้องว่าง/มืด) | พื้นที่วางวัตถุหลัก | ส่วนที่อาจถูกตัด |
| --- | --- | --- | --- |
| Desktop 1920×700 | x 13–52% (ข้อความเริ่มราว x 260px, กว้าง ~690px) | x 55–83%, y 20–80% | ซ้าย/ขวา 17% แต่ละข้างที่จอ 1024px |
| Tablet 1200×600 | x 15–63% | x 65–87%, y 20–80% | ซ้าย/ขวา ~13% ที่จอ 768px |
| Mobile 750×1000 | กึ่งกลาง y 14–86% เกือบทั้งภาพ | ขอบบน 0–16% และขอบล่าง 84–100% | ซ้าย/ขวา ~5% |

> Desktop และ Tablet ครอปจากต้นฉบับแนวนอน **ภาพเดียวกัน** (`hero-landscape-master.png`) — Prompt จึงกำหนดวัตถุไว้ที่ x 58–85% ซึ่งปลอดภัยทั้งสองแบบ

### HERO-01 + HERO-02 · Hero Desktop / Tablet (ต้นฉบับเดียว)

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | HERO-01 (Desktop) + HERO-02 (Tablet) |
| 2 ชื่อภาพ | Hero Banner — ฉากโต๊ะเกมมิ่ง (Landscape master) |
| 3 ใช้ที่ | หน้าแรก `/` Section Hero · Admin `/admin/settings` → Store → Hero Desktop (1920×700), Hero Tablet (1200×600) |
| 4 ขนาด | ปลายทาง 1920×700 และ 1200×600 · สั่ง ChatGPT 1536×1024 |
| 5 Ratio | ต้นฉบับ 3:2 → ครอป 2.74:1 (Desktop) และ 2:1 (Tablet) |
| 6 คำอธิบาย | ฉากโต๊ะเกมมิ่งพรีเมียม (คีย์บอร์ด เมาส์ หูฟังบนขาตั้ง) อยู่ฝั่งขวา ฝั่งซ้ายมืดและโล่งสำหรับข้อความ แสงน้ำเงินแบบภาพโฆษณา |
| 7 ต้องมี | ซ้าย 55% ว่าง/มืด · วัตถุอยู่ x 58–85% และแถบกลางแนวตั้ง · ขอบบน/ล่าง 22% ไม่มีรายละเอียดสำคัญ · Lime แค่ 1–2 จุด |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน (2.4) · จอภาพที่มีเนื้อหา/UI · ตัวอักษร LEVEL UP YOUR GEAR (ข้อความมาจากโค้ด) |
| 10 ชื่อไฟล์ | ต้นฉบับ `hero-landscape-master.png` → `hero-desktop-1920x700.webp`, `hero-tablet-1200x600.webp` |
| 11 Alt | Media Library: `ฉากโต๊ะเกมมิ่งพร้อมคีย์บอร์ด เมาส์ และหูฟัง` (หน้าเว็บแสดงเป็นภาพตกแต่ง) |
| 12 หมายเหตุ | Desktop ต้องขยาย 1.25× หลังครอป · หน้าเว็บแสดงที่ทึบ 50% จึงควรใช้ภาพที่สว่างพอสมควร ไม่มืดทั้งภาพ |

**9 Prompt**

```text
Create a wide landscape 3:2 image (1536×1024 px) to be used as the background of a website hero banner for an online gaming-gear store. It will be cropped to a very wide strip and shown at 50% opacity behind large white headline text on the left.

Layout (very important):
- Left side, from 0% to 55% of the width: dark, calm negative space only — deep navy #0A0B1E softly blending into royal indigo #1F06AC, with faint out-of-focus light. No objects in this area.
- The subject sits on the right, between about 58% and 85% of the width, vertically centered inside the middle 50% of the height.
- Top 22% and bottom 22% of the image: background only, no important details (they will be cropped away).
- Keep the far-right 12% simple; it may be cropped on smaller screens.

Subject: a premium, minimal gaming desk setup seen at a three-quarter angle — a tenkeyless mechanical keyboard with cool-blue backlighting, a wireless gaming mouse on a large dark desk mat, and an over-ear gaming headset resting on a small stand behind them.

Lighting and color: cinematic lighting with royal-blue (#1F06AC) and cool-blue (#5882E8) rim lights, soft reflections on a glossy dark desk surface, and only one or two tiny lime (#E3EF4F) accent highlights.

Style: photorealistic 3D product render, high detail, crisp edges, shallow depth of field, premium tech advertising look.

Do not include: any text, letters, numbers, logos or brand names; monitors or screens showing content; user-interface elements; people or hands; watermarks.
```

### HERO-03 · Hero Mobile

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | HERO-03 |
| 2 ชื่อภาพ | Hero Banner — Mobile |
| 3 ใช้ที่ | หน้าแรก `/` Hero บนจอ < 768px · Admin `/admin/settings` → Store → Hero Mobile (750×1000) |
| 4 ขนาด | 750×1000 · สั่ง ChatGPT 1024×1536 |
| 5 Ratio | ต้นฉบับ 2:3 → ครอป 3:4 |
| 6 คำอธิบาย | ภาพบรรยากาศแนวตั้ง กลางภาพมืดและเรียบ (ข้อความ+ปุ่ม 2 ปุ่มเต็มความกว้างวางทับกลางจอ) อุปกรณ์อยู่ที่ขอบบนและขอบล่าง |
| 7 ต้องมี | กลางภาพ y 18–82% ไม่มีวัตถุ · ขอบล่าง: คีย์บอร์ด+เมาส์ · ขอบบน: ส่วนโค้งของหูฟัง · ห่างขอบซ้ายขวา ≥ 8% |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · วัตถุใหญ่กลางภาพ |
| 10 ชื่อไฟล์ | ต้นฉบับ `hero-mobile-master.png` → `hero-mobile-750x1000.webp` |
| 11 Alt | Media Library: `ภาพบรรยากาศอุปกรณ์เกมมิ่งโทนน้ำเงิน` |
| 12 หมายเหตุ | ให้สีและอุปกรณ์เข้าชุดกับ HERO-01 (สร้างในแชทเดียวกันต่อจาก HERO-01) |

**9 Prompt**

```text
Create a tall portrait 2:3 image (1024×1536 px) to be used as the mobile background of a website hero banner for an online gaming-gear store. It will be cropped to 3:4 and shown at 50% opacity behind centered white headline text and two full-width buttons that cover the middle of the image.

Layout (very important):
- Middle area, from about 18% to 82% of the height: dark, calm, low-detail background only — deep navy #0A0B1E blending into royal indigo #1F06AC with soft bokeh light. No objects here.
- Bottom 18%: the front edge of a mechanical keyboard with cool-blue backlighting and a wireless gaming mouse on a dark desk mat, seen from a low three-quarter angle and cut off naturally by the bottom edge.
- Top 18%: the curved headband and one ear cup of an over-ear gaming headset entering the frame from the top edge, softly lit.
- Keep every important detail at least 8% away from the left and right edges.

Lighting and color: cinematic royal-blue (#1F06AC) and cool-blue (#5882E8) rim light, one small lime (#E3EF4F) accent highlight.

Style: photorealistic 3D render, high detail, premium tech look, matching the same gear and lighting as the desktop hero image.

Do not include: any text, letters, numbers, logos or brand names; user-interface elements; people or hands; watermarks.
```

---

## 6. A — ภาพสินค้า (P0)

### A.0 ข้อกำหนดร่วมของภาพสินค้าทั้ง 20 ภาพ

- **ตรวจจากโค้ด:** `components/products/product-image.tsx` ใช้ `object-fit: contain` ·
  ProductCard แสดง ~160×160px · หน้า Detail `/shop/[slug]` สูงสุด ~520px · Lightbox ~768px ·
  ตะกร้า/Wishlist/Checkout/Order 64–80px · Admin ตาราง 64px → ต้นฉบับ 800×800 เพียงพอ
- **ตอนนี้:** สินค้าทุกตัวมีภาพเดียว = SVG Placeholder (`/images/products/placeholder-ga-xx-xxx.svg`)
- **ระบบต้องการ:** ภาพหลัก 1 ภาพ/สินค้า (`product_images.is_primary`) — รองรับหลายภาพ แต่ไม่บังคับ
- **พื้นหลัง:** เข้ม `#12143A → #0A0B1E` ให้กลืนกับการ์ดสินค้า (`surface #12143A`)
- **องค์ประกอบ:** สินค้าชิ้นเดียว มุม 3/4 ด้านหน้า ครบทั้งชิ้น กินพื้นที่ ~70% มีขอบว่างรอบด้าน (ภาพย่อเหลือ 160px ต้องยังเห็นทรงชัด)
- **ลิขสิทธิ์:** ภาพเป็น "ภาพประกอบประเภทสินค้า" แบบไม่มีแบรนด์ — **ไม่ใช่ภาพสินค้าจริง** แต่ละรุ่นจึงต่างกันด้วยทรงและโทนสีที่สอดคล้องกับคำอธิบายใน PRODUCT_DATA โดยไม่เลียนแบบดีไซน์จริง
- **นำเข้า:** Admin `/admin/products` → แก้ไขสินค้า → ส่วน "รูปภาพ" → อัปโหลด → **ตั้งเป็นภาพหลัก** → ลบแถว Placeholder
- **Alt:** ชื่อสินค้า (UI_UX_DESIGN §16 ข้อ 4: ภาพสินค้า = ชื่อสินค้า)
- **ชื่อไฟล์:** `{sku ตัวเล็ก}-main.webp` (ต้นฉบับ `.png` ชื่อเดียวกัน)

### PRD-01 · Razer DeathAdder V3 Pro — `GA-MS-001` · Gaming Mouse

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-01 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Razer DeathAdder V3 Pro |
| 3 ใช้ที่ | `/shop/razer-deathadder-v3-pro` · ProductCard (หน้าแรก, `/shop`, `/deals`, Related) · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | เมาส์ไร้สายทรง Ergonomic สำหรับมือขวา น้ำหนักเบา สีดำด้าน |
| 7 ต้องมี | ทรงโค้งรับมือขวา, ปุ่มข้าง 2 ปุ่ม, ล้อเลื่อน, แสงขอบน้ำเงิน |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · โลโก้รูปงู/สัญลักษณ์บนหลังเมาส์ |
| 10 ชื่อไฟล์ | `ga-ms-001-main.webp` |
| 11 Alt | Razer DeathAdder V3 Pro |
| 12 หมายเหตุ | **ภาพทดลองชุดแรก** — ใช้เป็นต้นแบบสไตล์ของภาพสินค้าทั้งหมด |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a lightweight wireless ergonomic gaming mouse shaped for the right hand, with a smooth matte black shell, two thumb-side buttons and a scroll wheel.
View: three-quarter front view from slightly above; the whole product is fully visible and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-02 · Logitech G Pro X Superlight 2 — `GA-MS-002` · Gaming Mouse

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-02 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Logitech G Pro X Superlight 2 |
| 3 ใช้ที่ | `/shop/logitech-g-pro-x-superlight-2` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | เมาส์ไร้สายทรงสมมาตร น้ำหนักเบามาก ดีไซน์มินิมอล สีขาวนวล |
| 7 ต้องมี | ทรงสมมาตร เรียบ ไม่มีไฟ RGB, ขอบเส้นสีน้ำเงินเข้มบาง ๆ |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ตัว "G" หรือโลโก้ใด ๆ |
| 10 ชื่อไฟล์ | `ga-ms-002-main.webp` |
| 11 Alt | Logitech G Pro X Superlight 2 |
| 12 หมายเหตุ | ใช้สีขาวเพื่อแยกจากเมาส์ดำตัวอื่นในหน้าเดียวกัน |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: an ultra-lightweight symmetrical wireless esports mouse with a minimal, seamless matte off-white shell, a thin deep-indigo accent line along the side, two small side buttons and a scroll wheel, no RGB lighting.
View: three-quarter front view from slightly above; the whole product is fully visible and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-03 · Logitech G502 X Plus — `GA-MS-003` · Gaming Mouse

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-03 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Logitech G502 X Plus |
| 3 ใช้ที่ | `/shop/logitech-g502-x-plus` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | เมาส์ไร้สายปุ่มเยอะ มีที่พักนิ้วโป้ง แถบไฟ RGB สีน้ำเงิน-ม่วง |
| 7 ต้องมี | ทรง Ergonomic ขนาดใหญ่, ปุ่มข้างหลายปุ่ม, ล้อเลื่อนโลหะ, แถบไฟ |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ตัวอักษรบนแถบไฟ |
| 10 ชื่อไฟล์ | `ga-ms-003-main.webp` |
| 11 Alt | Logitech G502 X Plus |
| 12 หมายเหตุ | ตรวจว่าปุ่มข้างไม่ซ้อนกันเพี้ยน |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a feature-rich wireless gaming mouse with a sculpted ergonomic body and thumb rest, several side buttons, a metal-finish scroll wheel, and a thin RGB light strip glowing blue-violet; dark graphite shell.
View: three-quarter front view from slightly above; the whole product is fully visible and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-04 · Razer Viper V3 Pro — `GA-MS-004` · Gaming Mouse

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-04 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Razer Viper V3 Pro |
| 3 ใช้ที่ | `/shop/razer-viper-v3-pro` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | เมาส์ไร้สายทรงสมมาตรโปรไฟล์ต่ำ สำหรับแข่งขัน สีดำ ขอบน้ำเงินโคบอลต์ |
| 7 ต้องมี | ทรงเตี้ยยาว สมมาตร, เส้นขอบ `#0F42C0` |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · โลโก้รูปงู |
| 10 ชื่อไฟล์ | `ga-ms-004-main.webp` |
| 11 Alt | Razer Viper V3 Pro |
| 12 หมายเหตุ | ให้ต่างจาก PRD-01 ด้วยทรงสมมาตร/เตี้ยกว่า |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a low-profile symmetrical wireless esports mouse, long and flat, matte black shell with a thin cobalt-blue (#0F42C0) edge accent, two side buttons and a scroll wheel.
View: three-quarter front view from slightly above; the whole product is fully visible and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-05 · SteelSeries Aerox 3 Wireless — `GA-MS-005` · Gaming Mouse

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-05 |
| 2 ชื่อภาพ | ภาพหลักสินค้า SteelSeries Aerox 3 Wireless |
| 3 ใช้ที่ | `/shop/steelseries-aerox-3-wireless` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | เมาส์ไร้สายเชลล์รังผึ้ง (มีรูทั่วตัว) น้ำหนักเบา เห็นแสงน้ำเงิน-ม่วงลอดรู |
| 7 ต้องมี | ลายรูหกเหลี่ยมเรียงสม่ำเสมอ, ไฟภายใน |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · รูผิดรูปหรือไม่สมมาตร |
| 10 ชื่อไฟล์ | `ga-ms-005-main.webp` |
| 11 Alt | SteelSeries Aerox 3 Wireless |
| 12 หมายเหตุ | ตรวจลายรังผึ้งให้เรียบร้อย (AI มักทำลายเพี้ยน) |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: an ultra-lightweight wireless gaming mouse with a honeycomb-perforated shell (neat, evenly spaced hexagonal holes) in dark charcoal, with a soft blue-violet internal glow visible through the holes, two side buttons and a scroll wheel.
View: three-quarter front view from slightly above; the whole product is fully visible and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-06 · Razer BlackWidow V4 — `GA-KB-001` · Gaming Keyboard

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-06 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Razer BlackWidow V4 |
| 3 ใช้ที่ | `/shop/razer-blackwidow-v4` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | คีย์บอร์ดเมคานิคอล Full-size มีแถวปุ่ม Macro ด้านซ้าย ปุ่มหมุนมีเดีย ที่พักข้อมือ ไฟ RGB รายปุ่มโทนน้ำเงิน-ม่วง |
| 7 ต้องมี | แป้นตัวเลขครบ, คอลัมน์ Macro, ปุ่มหมุน, ที่พักข้อมือ |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · **ตัวอักษรบนคีย์แคป** (ให้เป็นคีย์ว่าง) |
| 10 ชื่อไฟล์ | `ga-kb-001-main.webp` |
| 11 Alt | Razer BlackWidow V4 |
| 12 หมายเหตุ | คีย์บอร์ดยาว → มุม 3/4 ทแยงจะเต็มกรอบสี่เหลี่ยมได้ดีกว่ามุมตรง |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a full-size mechanical gaming keyboard with a dedicated column of macro keys on the left, a multi-function media dial at the top right, a detachable padded wrist rest, and per-key RGB backlighting in blue and violet; black frame; blank keycaps.
View: three-quarter front view from slightly above, placed diagonally; the whole product is fully visible and centered, filling about 75% of the frame width with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, evenly aligned keys, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; keycaps have no legends; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-07 · Logitech G Pro X TKL — `GA-KB-002` · Gaming Keyboard

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-07 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Logitech G Pro X TKL |
| 3 ใช้ที่ | `/shop/logitech-g-pro-x-tkl` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | คีย์บอร์ดไร้สาย Tenkeyless ขอบบาง ดีไซน์เรียบ สีดำ ไฟฟ้าเย็น |
| 7 ต้องมี | ไม่มีแป้นตัวเลข, ขอบบาง, ไม่มีสาย |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ตัวอักษรบนคีย์แคป |
| 10 ชื่อไฟล์ | `ga-kb-002-main.webp` |
| 11 Alt | Logitech G Pro X TKL |
| 12 หมายเหตุ | — |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a sleek wireless tenkeyless (no number pad) mechanical gaming keyboard with very thin bezels, matte black frame, blank keycaps and an even cool-blue backlight; no cable.
View: three-quarter front view from slightly above, placed diagonally; the whole product is fully visible and centered, filling about 75% of the frame width with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, evenly aligned keys, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; keycaps have no legends; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-08 · HyperX Alloy Origins — `GA-KB-003` · Gaming Keyboard

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-08 |
| 2 ชื่อภาพ | ภาพหลักสินค้า HyperX Alloy Origins |
| 3 ใช้ที่ | `/shop/hyperx-alloy-origins` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | คีย์บอร์ด Full-size บอดี้อะลูมิเนียมขัดลายสีเทาเข้ม คีย์ลอย ไฟ RGB รายปุ่ม สาย USB-C ถอดได้ |
| 7 ต้องมี | แผ่นโลหะลายขัด, คีย์ลอยเห็นไฟใต้ปุ่ม, สาย USB-C |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · สีแดง (โทนแบรนด์จริง) · ตัวอักษรบนคีย์แคป |
| 10 ชื่อไฟล์ | `ga-kb-003-main.webp` |
| 11 Alt | HyperX Alloy Origins |
| 12 หมายเหตุ | — |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a full-size mechanical gaming keyboard with a brushed dark-gunmetal aluminium top plate, floating keys with visible per-key RGB glow in blue and violet underneath, blank keycaps, and a detachable braided USB-C cable.
View: three-quarter front view from slightly above, placed diagonally; the whole product is fully visible and centered, filling about 75% of the frame width with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic brushed-metal material, accurate proportions, evenly aligned keys, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no red color; keycaps have no legends; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-09 · SteelSeries Apex Pro TKL — `GA-KB-004` · Gaming Keyboard

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-09 |
| 2 ชื่อภาพ | ภาพหลักสินค้า SteelSeries Apex Pro TKL |
| 3 ใช้ที่ | `/shop/steelseries-apex-pro-tkl` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | คีย์บอร์ด TKL มีจอ OLED เล็ก + ปุ่มหมุนโลหะมุมขวาบน สีดำ ไฟน้ำเงินเข้ม |
| 7 ต้องมี | จอเล็กเรืองแสง (ไม่มีข้อความ — แสดงเป็นคลื่นนามธรรม), ปุ่มหมุน |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ข้อความหรือตัวเลขบนจอ |
| 10 ชื่อไฟล์ | `ga-kb-004-main.webp` |
| 11 Alt | SteelSeries Apex Pro TKL |
| 12 หมายเหตุ | ถ้า AI ใส่ข้อความบนจอ ให้สั่ง "make the small screen show only a simple abstract wave" |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a tenkeyless (no number pad) mechanical gaming keyboard, matte black, with a small glowing display at the top right showing only a simple abstract blue wave line, a metal roller/dial next to it, blank keycaps and deep-blue per-key backlighting.
View: three-quarter front view from slightly above, placed diagonally; the whole product is fully visible and centered, filling about 75% of the frame width with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, evenly aligned keys, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; the display shows no text or numbers; keycaps have no legends; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-10 · Keychron K8 Pro — `GA-KB-005` · Gaming Keyboard

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-10 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Keychron K8 Pro |
| 3 ใช้ที่ | `/shop/keychron-k8-pro` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | คีย์บอร์ด TKL ไร้สายสาย Custom คีย์แคปสองโทนเทา-ดำ ปุ่ม Esc สี Lime ปุ่มเดียว ไฟขาวนวล |
| 7 ต้องมี | คีย์แคปทรงสูงสองโทน, ปุ่ม Esc Lime `#E3EF4F` |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · คีย์สีส้ม (โทนแบรนด์จริง) · ตัวอักษรบนคีย์แคป |
| 10 ชื่อไฟล์ | `ga-kb-005-main.webp` |
| 11 Alt | Keychron K8 Pro |
| 12 หมายเหตุ | ภาพเดียวในชุดที่ใช้ Lime เป็นจุดเด่นของสินค้า |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: an enthusiast-style wireless tenkeyless mechanical keyboard with a dark grey aluminium-look frame, two-tone keycaps in light grey and charcoal, a single lime (#E3EF4F) escape key as the only bright accent, and a soft white backlight; blank keycaps.
View: three-quarter front view from slightly above, placed diagonally; the whole product is fully visible and centered, filling about 75% of the frame width with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, evenly aligned keys, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no orange keys; keycaps have no legends; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-11 · Logitech G733 Lightspeed — `GA-HS-001` · Gaming Headset

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-11 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Logitech G733 Lightspeed |
| 3 ใช้ที่ | `/shop/logitech-g733-lightspeed` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | หูฟังไร้สายน้ำหนักเบา สายคาดหัวแบบ Suspension สีขาว-ม่วงลาเวนเดอร์ ไฟ RGB ด้านข้าง ไมค์ถอดได้ |
| 7 ต้องมี | สายคาดยืดหยุ่น, แถบไฟข้างครอบหู, ไมค์บูม |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ลวดลายแบรนด์บนสายคาด |
| 10 ชื่อไฟล์ | `ga-hs-001-main.webp` |
| 11 Alt | Logitech G733 Lightspeed |
| 12 หมายเหตุ | หูฟังสีอ่อนตัวเดียวในชุด |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a lightweight wireless gaming headset in soft white with pale lavender accents, a stretchy suspension headband, a thin glowing blue-violet light strip on the outside of each ear cup, plush ear cushions, and a detachable boom microphone.
View: three-quarter front view; the whole headset is fully visible, symmetrical and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people, heads or hands; no other objects.
```

### PRD-12 · Razer BlackShark V2 Pro — `GA-HS-002` · Gaming Headset

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-12 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Razer BlackShark V2 Pro |
| 3 ใช้ที่ | `/shop/razer-blackshark-v2-pro` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | หูฟังไร้สายสำหรับอีสปอร์ต ครอบหูปิด ทรงวงรีใหญ่ สีดำด้าน วงแหวนน้ำเงินโคบอลต์ ไมค์ถอดได้ |
| 7 ต้องมี | ครอบหูวงรี, ฟองน้ำหนา, ไมค์ถอดได้ |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · สีเขียว (โทนแบรนด์จริง) · โลโก้รูปงู |
| 10 ชื่อไฟล์ | `ga-hs-002-main.webp` |
| 11 Alt | Razer BlackShark V2 Pro |
| 12 หมายเหตุ | — |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a closed-back wireless esports headset with large oval ear cups, matte black finish, thin cobalt-blue (#0F42C0) rings around the ear cups, thick memory-foam cushions, a padded headband and a detachable flexible microphone.
View: three-quarter front view; the whole headset is fully visible, symmetrical and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no green color; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people, heads or hands; no other objects.
```

### PRD-13 · SteelSeries Arctis Nova 7 — `GA-HS-003` · Gaming Headset

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-13 |
| 2 ชื่อภาพ | ภาพหลักสินค้า SteelSeries Arctis Nova 7 |
| 3 ใช้ที่ | `/shop/steelseries-arctis-nova-7` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | หูฟังไร้สาย โครงลวดเหล็กบาง + สายคาดยืดแบบ Ski-band สีดำ ไมค์พับเก็บได้ |
| 7 ต้องมี | โครงลวดคู่, สายคาดผ้า, ครอบหูทรงรีเรียบ |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน |
| 10 ชื่อไฟล์ | `ga-hs-003-main.webp` |
| 11 Alt | SteelSeries Arctis Nova 7 |
| 12 หมายเหตุ | — |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a wireless gaming headset with a thin dual steel-wire frame and an elastic fabric ski-goggle-style suspension band, smooth matte black oval ear cups with a subtle cool-blue edge glow, soft fabric cushions and a retractable microphone.
View: three-quarter front view; the whole headset is fully visible, symmetrical and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people, heads or hands; no other objects.
```

### PRD-14 · HyperX Cloud III — `GA-HS-004` · Gaming Headset

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-14 |
| 2 ชื่อภาพ | ภาพหลักสินค้า HyperX Cloud III |
| 3 ใช้ที่ | `/shop/hyperx-cloud-iii` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | หูฟังแบบสายคลาสสิก ก้านอะลูมิเนียม สีดำ+น้ำเงินคราม ไมค์และสายถอดได้ |
| 7 ต้องมี | ก้านโลหะ, ฟองน้ำ Memory foam, สายถักแยกออก |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · สีแดง (โทนแบรนด์จริง) |
| 10 ชื่อไฟล์ | `ga-hs-004-main.webp` |
| 11 Alt | HyperX Cloud III |
| 12 หมายเหตุ | หูฟังแบบมีสายตัวเดียวในชุด |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a classic wired over-ear gaming headset with solid aluminium forks, matte black ear cups with deep indigo accents, thick memory-foam leatherette cushions, a padded headband, a detachable boom microphone and a detachable braided cable.
View: three-quarter front view; the whole headset is fully visible, symmetrical and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no red color; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people, heads or hands; no other objects.
```

### PRD-15 · Logitech G Pro X 2 Lightspeed — `GA-HS-005` · Gaming Headset

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-15 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Logitech G Pro X 2 Lightspeed |
| 3 ใช้ที่ | `/shop/logitech-g-pro-x-2-lightspeed` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | หูฟังไร้สายระดับโปร โครงโลหะ ดีไซน์เรียบหรู ไม่มีไฟ RGB หนังสังเคราะห์สีดำ |
| 7 ต้องมี | ก้านโลหะ, ครอบหูทรงกลม, ไมค์ถอดได้ปลายสี Lime เล็ก ๆ |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ไฟ RGB |
| 10 ชื่อไฟล์ | `ga-hs-005-main.webp` |
| 11 Alt | Logitech G Pro X 2 Lightspeed |
| 12 หมายเหตุ | ให้ดู "พรีเมียม" ต่างจาก PRD-11 |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a premium professional wireless gaming headset with an aluminium and steel frame, round matte black ear cups, black leatherette cushions, no RGB lighting, and a detachable microphone with a tiny lime (#E3EF4F) tip as the only accent.
View: three-quarter front view; the whole headset is fully visible, symmetrical and centered, filling about 70% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic metal and leather materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people, heads or hands; no other objects.
```

### PRD-16 · Razer Iskur V2 — `GA-CH-001` · Gaming Chair

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-16 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Razer Iskur V2 |
| 3 ใช้ที่ | `/shop/razer-iskur-v2` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | เก้าอี้เกมมิ่งทรงรถแข่ง มีระบบรองรับหลังส่วนล่างปรับได้ หนังสังเคราะห์ดำ ด้ายเย็บน้ำเงินเข้ม |
| 7 ต้องมี | พนักพิงสูง, ส่วนรองหลังล่างนูน, ที่วางแขน, ขาดาว 5 แฉก + ล้อ 5 ล้อ |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · สีเขียว · ปักโลโก้บนพนักพิง |
| 10 ชื่อไฟล์ | `ga-ch-001-main.webp` |
| 11 Alt | Razer Iskur V2 |
| 12 หมายเหตุ | เก้าอี้สูง → ให้กินพื้นที่แนวตั้ง ~80% และเห็นทั้งตัวรวมล้อ |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: an ergonomic racing-style gaming chair with a tall backrest, a sculpted built-in adjustable lumbar curve, black synthetic leather with dark royal-blue stitching, adjustable armrests, a gas lift and a five-star base with five casters; plain backrest with no embroidery.
View: three-quarter front view; the whole chair including all casters is fully visible and centered, filling about 80% of the frame height with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark floor underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no green color; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-17 · Secretlab TITAN Evo — `GA-CH-002` · Gaming Chair

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-17 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Secretlab TITAN Evo |
| 3 ใช้ที่ | `/shop/secretlab-titan-evo` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | เก้าอี้เกมมิ่งพรีเมียม เบาะกว้าง หมอนรองศีรษะแม่เหล็ก ขอบกุ๊นสีคราม |
| 7 ต้องมี | หมอนรองศีรษะ, เบาะกว้าง, ขอบกุ๊น Indigo, ขาดาว 5 แฉก |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ปักโลโก้/ลายสิงโต |
| 10 ชื่อไฟล์ | `ga-ch-002-main.webp` |
| 11 Alt | Secretlab TITAN Evo |
| 12 หมายเหตุ | ให้ต่างจาก PRD-16 ด้วยหมอนรองศีรษะและทรงกว้างกว่า |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a premium gaming chair with a wide seat, a tall backrest, a magnetic memory-foam head pillow, black stitched leatherette with subtle deep-indigo piping along the edges, multi-direction armrests and a five-star aluminium base with five casters; plain surfaces with no embroidery.
View: three-quarter front view; the whole chair including all casters is fully visible and centered, filling about 80% of the frame height with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark floor underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no logos, no emblems, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-18 · Logitech G923 Racing Wheel — `GA-RW-001` · Racing Wheel

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-18 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Logitech G923 Racing Wheel |
| 3 ใช้ที่ | `/shop/logitech-g923-racing-wheel` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | พวงมาลัยเกมแข่งรถหุ้มหนัง ก้านโลหะ ปุ่มบนก้าน ฐานยึดโต๊ะ + ชุดแป้นเหยียบ 3 แป้นด้านหลัง |
| 7 ต้องมี | วงพวงมาลัยกลมสมมาตร, Paddle shifter, แป้นเหยียบ 3 แป้น |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ตัวอักษรบนปุ่ม |
| 10 ชื่อไฟล์ | `ga-rw-001-main.webp` |
| 11 Alt | Logitech G923 Racing Wheel |
| 12 หมายเหตุ | ตรวจความสมมาตรของก้านพวงมาลัย |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a sim-racing steering wheel with a round leather-wrapped rim, brushed metal spokes with a few small unlabeled buttons, two paddle shifters, mounted on a compact black wheel base with a desk clamp, and a matching three-pedal set placed slightly behind and to the side; small cool-blue LED accents.
View: three-quarter front view; the wheel, base and pedals are fully visible and centered, filling about 75% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, symmetrical wheel, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; buttons have no symbols or labels; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-19 · Razer Strider Chroma — `GA-MP-001` · Mouse Pad

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-19 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Razer Strider Chroma |
| 3 ใช้ที่ | `/shop/razer-strider-chroma` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | แผ่นรองเมาส์ไฮบริดขนาดใหญ่ (ยาว ~2.4 เท่าของความกว้าง) ขอบไฟ RGB น้ำเงิน-ม่วง ผิวเนื้อละเอียดสีดำ |
| 7 ต้องมี | แผ่นยาววางทแยงเต็มกรอบ, ขอบเรืองแสง, ช่องเสียบ USB เล็ก ๆ ที่มุม |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ลวดลาย/โลโก้บนผิวแผ่น · ไม่มีคีย์บอร์ดหรือเมาส์วางบนแผ่น |
| 10 ชื่อไฟล์ | `ga-mp-001-main.webp` |
| 11 Alt | Razer Strider Chroma |
| 12 หมายเหตุ | วัตถุยาวมากในกรอบสี่เหลี่ยม → มุมมองทแยง 3/4 จากด้านบน |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a large extended hybrid gaming desk mat (about 2.4 times longer than it is wide), plain black micro-textured surface, glowing RGB edge lighting in blue and violet around the whole border, and a small USB connector housing at one corner; nothing placed on the mat.
View: high three-quarter view from above, the mat placed diagonally across the frame; the whole mat is fully visible and centered, filling about 80% of the frame width with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic fabric texture, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no printed pattern on the surface; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### PRD-20 · Elgato Stream Deck MK.2 — `GA-ST-001` · Streaming Equipment

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRD-20 |
| 2 ชื่อภาพ | ภาพหลักสินค้า Elgato Stream Deck MK.2 |
| 3 ใช้ที่ | `/shop/elgato-stream-deck-mk-2` · ProductCard · ตะกร้า/Wishlist/Checkout · Admin → Products → รูปภาพ |
| 4 ขนาด | 800×800 (สั่ง 1024×1024) |
| 5 Ratio | 1:1 |
| 6 คำอธิบาย | แผงควบคุมไลฟ์สตรีม 15 ปุ่มจอ LCD (5×3) บนขาตั้งปรับมุมได้ ปุ่มแสดงไอคอนนามธรรมหลากสี |
| 7 ต้องมี | ปุ่ม 15 ปุ่มเรียง 5×3, ขาตั้ง, สาย USB-C |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ไอคอนแอปจริง (Twitch/YouTube/Discord ฯลฯ) · ตัวอักษรบนปุ่ม |
| 10 ชื่อไฟล์ | `ga-st-001-main.webp` |
| 11 Alt | Elgato Stream Deck MK.2 |
| 12 หมายเหตุ | นับปุ่มให้ครบ 15 ปุ่ม |

**9 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) for an online gaming-gear store.
Subject: a compact stream controller with exactly 15 square LCD keys arranged in a 5-by-3 grid, each key showing a simple abstract geometric icon (circle, triangle, wave, star, square) in blue, violet, cyan and one lime (#E3EF4F), in a black housing on an adjustable angled stand, with a USB-C cable.
View: three-quarter front view from slightly above; the whole product is fully visible and centered, filling about 65% of the frame with even empty margin on every side (nothing cropped).
Style: photorealistic studio product render, crisp sharp edges, realistic materials, accurate proportions, premium tech look.
Background: seamless dark navy gradient from #12143A in the center to #0A0B1E at the edges, a soft royal-blue (#1F06AC) rim light behind the product, and a subtle cool-blue (#5882E8) reflection on a glossy dark surface underneath.
Rules: generic unbranded design that does not copy any real manufacturer's product; no real app or platform icons; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

### A.21 ภาพเพิ่มเติม (P2 — ไม่บังคับ, ไม่นับรวม)

ระบบรองรับหลายภาพต่อสินค้า (Thumbnail ใต้ภาพหลักในหน้า Detail) ถ้าต้องการภายหลัง แนะนำ 2 ภาพ/สินค้า:
- `{sku}-side.webp` มุมด้านข้าง — ใช้ Prompt เดิมแต่เปลี่ยนบรรทัด View เป็น `View: clean side profile view at eye level`
- `{sku}-top.webp` มุมบน — `View: top-down view from directly above`
- ขนาด 800×800 เท่าเดิม · Alt = `ชื่อสินค้า – มุมด้านข้าง` / `ชื่อสินค้า – มุมบน`

---

## 7. B — ภาพหมวดหมู่ (P0)

**ตรวจจากโค้ด** `components/products/category-card.tsx`: กรอบสี่เหลี่ยมจัตุรัส **กว้างสูงสุด 144px** (`max-w-36`) พื้นหลัง Brand gradient · `object-fit: cover` · ชื่อหมวด+จำนวนสินค้าเป็นข้อความจากโค้ดใต้ภาพ · ใช้ที่หน้าแรก (Popular Categories, 8 คอลัมน์ที่ ≥1440px) และ `/categories`
→ ภาพต้อง **อ่านออกที่ขนาดเล็ก**: วัตถุชิ้นเดียว ทรงชัด รายละเอียดน้อย

ข้อกำหนดร่วม: ขนาด 600×600 (สั่ง 1024×1024) · 1:1 · พื้นหลัง Brand gradient ตรงกับกรอบในเว็บ · นำเข้าที่ Admin `/admin/categories` → แก้ไข → "ภาพหมวดหมู่ (600×600)" → บันทึก · โค้ดแสดงภาพแบบตกแต่ง (`alt=""` เพราะมีชื่อหมวดอยู่แล้ว) — Alt ด้านล่างใช้ใน Media Library

| ID | หมวด (slug) | วัตถุในภาพ | ต้องมี / ห้ามมี เพิ่มเติม | ชื่อไฟล์ | Alt (Media Library) |
| --- | --- | --- | --- | --- | --- |
| CAT-01 | Gaming Mouse (`gaming-mouse`) — 5 สินค้า | เมาส์เกมมิ่งไร้สาย | ทรงชัด มุม 3/4 | `cat-gaming-mouse.webp` | ภาพหมวดหมู่ Gaming Mouse |
| CAT-02 | Gaming Keyboard (`gaming-keyboard`) — 5 | คีย์บอร์ดเมคานิคอล TKL | คีย์ว่าง ไม่มีตัวอักษร | `cat-gaming-keyboard.webp` | ภาพหมวดหมู่ Gaming Keyboard |
| CAT-03 | Gaming Headset (`gaming-headset`) — 5 | หูฟังครอบหูมีไมค์ | สมมาตร | `cat-gaming-headset.webp` | ภาพหมวดหมู่ Gaming Headset |
| CAT-04 | Mouse Pad (`mouse-pad`) — 1 | แผ่นรองเมาส์ขอบเรืองแสง (มีเมาส์ตัวเล็กวางบนแผ่นเพื่อบอกขนาด) | ไม่มีลวดลายบนแผ่น | `cat-mouse-pad.webp` | ภาพหมวดหมู่ Mouse Pad |
| CAT-05 | Gaming Chair (`gaming-chair`) — 2 | เก้าอี้เกมมิ่ง | ขาดาว 5 แฉก | `cat-gaming-chair.webp` | ภาพหมวดหมู่ Gaming Chair |
| CAT-06 | Racing Wheel (`racing-wheel`) — 1 | พวงมาลัยเกมแข่งรถ (ไม่ต้องมีแป้น) | สมมาตร | `cat-racing-wheel.webp` | ภาพหมวดหมู่ Racing Wheel |
| CAT-07 | Streaming Equipment (`streaming-equipment`) — 1 | ไมโครโฟนคอนเดนเซอร์บนขาบูม + แผงปุ่มเล็กด้านหน้า | ไม่มีไอคอนแอปจริง | `cat-streaming-equipment.webp` | ภาพหมวดหมู่ Streaming Equipment |
| CAT-08 | Computer Accessories (`computer-accessories`) — 0 (ป้าย "เร็ว ๆ นี้") | USB-C Hub หลายพอร์ต + สายถัก + ตัวรับสัญญาณไร้สายเล็ก | พอร์ตเรียงสวย | `cat-computer-accessories.webp` | ภาพหมวดหมู่ Computer Accessories |

> CAT-07 ใช้ไมโครโฟนเป็นสัญลักษณ์ (อ่านออกที่ 144px ดีกว่าแผงปุ่ม) — ถ้าต้องการให้ตรงกับสินค้าเดียวในหมวด (Stream Deck) เปลี่ยนวัตถุเป็น `a compact stream controller with a grid of glowing square keys`

**Prompt แม่แบบหมวดหมู่** (แทน `{OBJECT}` ด้วยข้อความในตารางถัดไป)

```text
Create a square 1:1 image (1024×1024 px) for a product-category tile on a gaming-gear website. It will be displayed very small (about 144×144 px), so it must read instantly.
Subject: {OBJECT}, as a single bold hero object, centered, filling about 65% of the frame, three-quarter view, clean recognizable silhouette, minimal fine detail.
Style: polished photorealistic 3D render, soft studio lighting, dark graphite and black materials with bright cool-blue (#5882E8) edge highlights and one small lime (#E3EF4F) accent.
Background: smooth diagonal gradient from deep royal indigo #1F06AC (top-left) through #0F42C0 to #5882E8 (bottom-right), a soft glow behind the object and a gentle shadow below it; no horizon line.
Rules: generic unbranded design; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

| ID | `{OBJECT}` (คัดลอกไปแทนที่) |
| --- | --- |
| CAT-01 | `a wireless gaming mouse with a glowing blue underside` |
| CAT-02 | `a tenkeyless mechanical keyboard with blank keycaps and blue backlighting, placed diagonally` |
| CAT-03 | `an over-ear gaming headset with a boom microphone, symmetrical front three-quarter view` |
| CAT-04 | `a rectangular gaming mouse pad with a glowing blue edge, seen from a high angle, with a small mouse resting on it` |
| CAT-05 | `a racing-style gaming chair with a five-star base and casters` |
| CAT-06 | `a sim-racing steering wheel with a round leather rim and metal spokes, front three-quarter view` |
| CAT-07 | `a studio condenser microphone on a short boom arm with a small glowing control pad in front of it` |
| CAT-08 | `a compact aluminium multi-port USB-C hub with a short braided cable and a tiny wireless receiver beside it` |

ฉบับเต็มของ **CAT-01** (ภาพทดลองชุดแรก — คัดลอกได้ทันที):

```text
Create a square 1:1 image (1024×1024 px) for a product-category tile on a gaming-gear website. It will be displayed very small (about 144×144 px), so it must read instantly.
Subject: a wireless gaming mouse with a glowing blue underside, as a single bold hero object, centered, filling about 65% of the frame, three-quarter view, clean recognizable silhouette, minimal fine detail.
Style: polished photorealistic 3D render, soft studio lighting, dark graphite and black materials with bright cool-blue (#5882E8) edge highlights and one small lime (#E3EF4F) accent.
Background: smooth diagonal gradient from deep royal indigo #1F06AC (top-left) through #0F42C0 to #5882E8 (bottom-right), a soft glow behind the object and a gentle shadow below it; no horizon line.
Rules: generic unbranded design; no logos, no brand names, no text, letters or numbers anywhere; no watermark; no people or hands; no other objects.
```

หมายเหตุหมวดหมู่ (ข้อ 12): ทดสอบโดยย่อภาพเหลือ 144px — ถ้ายังจำได้ว่าเป็นอะไรถือว่าผ่าน

---

## 8. D — Promotion Banner: Headset Week (P1)

**ข้อมูลจริง:** โปรโมชั่นเดียวที่มี = **Headset Week (Demo)** (`headset-week`) ลด 10% หูฟังที่ร่วมรายการ, เปิดใช้งาน, สิ้นสุด 11 ธ.ค. 2026, ยังไม่มีภาพทั้ง 2 ขนาด

**ตรวจจากโค้ด** `components/promotions/promotion-card.tsx`: ภาพเป็นพื้นหลังการ์ด `object-fit: cover` **ทึบ 60%** · มุมซ้ายบน = ไอคอนโทรโข่ง · **มุมขวาบน = ป้าย "ลด 10%"** · ซ้ายล่าง = ชื่อ/คำอธิบาย/วันสิ้นสุด (+ นับถอยหลังที่ `/deals`)
- หน้าแรก: การ์ดกว้าง ~450×220 (3 คอลัมน์) → ใกล้ 2:1 · `/deals`: การ์ดกว้างสูงสุด 576×220 → เห็นแถบกลาง ~77% ของความสูง
- มือถือ (<768px): ใช้ภาพ Mobile 750×1000 แต่การ์ดยังเป็นแนวนอน ~343×220 → **เห็นเฉพาะแถบกลาง y ≈ 26–74%**
- นำเข้า: Admin `/admin/promotions` → Headset Week → Banner Desktop (1200×600) / Banner Mobile (750×1000) → บันทึก (คงสถานะเปิดใช้งาน)
- Alt: ภาพตกแต่ง (`alt=""`) — Media Library ใช้ Alt ด้านล่าง

### PRO-01 · Headset Week — Desktop

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRO-01 |
| 2 ชื่อภาพ | Promotion Banner Headset Week — Desktop |
| 3 ใช้ที่ | หน้าแรก Section Promotions · `/deals#headset-week` · Admin `/admin/promotions/[id]` → Banner Desktop |
| 4 ขนาด | 1200×600 · สั่ง 1536×1024 → ครอป 1536×768 |
| 5 Ratio | 2:1 |
| 6 คำอธิบาย | หูฟังพรีเมียมลอยอยู่ฝั่งขวา มีวงคลื่นเสียงเรืองแสงแผ่ออกจากครอบหู ฝั่งซ้ายมืดสำหรับข้อความ |
| 7 ต้องมี | วัตถุ x 55–90%, y 25–80% · ซ้ายครึ่งหนึ่งมืด · มุมขวาบนว่าง (ป้ายส่วนลด) |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ตัวเลข/เครื่องหมาย % · คำว่า SALE |
| 10 ชื่อไฟล์ | ต้นฉบับ `promo-headset-week-desktop-master.png` → `promo-headset-week-desktop-1200x600.webp` |
| 11 Alt | Media Library: `แบนเนอร์โปรโมชั่น Headset Week` |
| 12 หมายเหตุ | ทึบ 60% ใต้ข้อความสีขาว จึงควรมีความสว่างพอสมควร |

**9 Prompt**

```text
Create a wide landscape 3:2 image (1536×1024 px) as the background of a promotion banner for a "headset week" sale at an online gaming-gear store (do not write any words). It will be cropped to 2:1 and shown at 60% opacity inside a card: white text sits at the bottom-left, a small discount badge sits in the top-right corner, and a small icon sits in the top-left corner.

Layout (very important):
- The subject sits on the right side, between about 55% and 90% of the width, vertically between 25% and 80% of the height.
- The left half and the top-right corner stay dark and simple.
- Top 15% and bottom 15%: background only (may be cropped).

Subject: one premium over-ear wireless gaming headset floating at a three-quarter angle, with soft concentric sound-wave light rings radiating outward from the ear cups.

Colors: deep navy #0A0B1E background with a royal indigo #1F06AC glow, cool-blue #5882E8 sound-wave rings, and a lime #E3EF4F accent only on the cushion edge or microphone tip.

Style: photorealistic 3D render, high detail, dynamic but clean, premium tech advertising look.

Do not include: any text, words, numbers or percent signs; logos or brand names; people or hands; watermarks.
```

### PRO-02 · Headset Week — Mobile

| ข้อ | รายละเอียด |
| --- | --- |
| 1 Image ID | PRO-02 |
| 2 ชื่อภาพ | Promotion Banner Headset Week — Mobile |
| 3 ใช้ที่ | การ์ดโปรโมชั่นบนมือถือ (หน้าแรก, `/deals`) · Admin → Banner Mobile |
| 4 ขนาด | 750×1000 · สั่ง 1024×1536 → ครอป 1024×1365 |
| 5 Ratio | 3:4 |
| 6 คำอธิบาย | หูฟังชุดเดียวกับ PRO-01 วางในแถบกลางภาพ ส่วนบน/ล่างเป็นพื้นหลังและวงคลื่นเสียง |
| 7 ต้องมี | วัตถุทั้งหมดอยู่ใน y 30–70% กึ่งกลางค่อนขวา กว้าง ~60% ของภาพ |
| 8 ห้ามมี | ข้อห้ามมาตรฐาน · ตัวเลข/% · วัตถุที่ขอบบน/ล่าง |
| 10 ชื่อไฟล์ | ต้นฉบับ `promo-headset-week-mobile-master.png` → `promo-headset-week-mobile-750x1000.webp` |
| 11 Alt | Media Library: `แบนเนอร์โปรโมชั่น Headset Week (มือถือ)` |
| 12 หมายเหตุ | ดูข้อสังเกต 0.2 ข้อ 4 — ถ้าภายหลังปรับโค้ดการ์ดมือถือให้เป็นแนวตั้ง ภาพนี้ก็ยังใช้ได้ |

**9 Prompt**

```text
Create a tall portrait 2:3 image (1024×1536 px) as the mobile version of a promotion banner for a "headset week" sale at an online gaming-gear store (do not write any words). Important: on phones this image is shown inside a short, wide card, so only the central horizontal band, from about 30% to 70% of the height, is visible.

Layout (very important):
- Place the whole subject inside that central band, horizontally centered and slightly to the right, about 60% of the image width.
- Above and below the band: dark background only, with soft sound-wave light rings fading outward.
- Keep the area just left of center fairly dark for white text.

Subject: one premium over-ear wireless gaming headset at a three-quarter angle, with concentric sound-wave light rings around it — the same headset style as the desktop banner.

Colors: deep navy #0A0B1E background, royal indigo #1F06AC glow, cool-blue #5882E8 rings, lime #E3EF4F only on a small accent.

Style: photorealistic 3D render, high detail, premium tech advertising look.

Do not include: any text, words, numbers or percent signs; logos or brand names; people or hands; watermarks.
```

---

## 9. E — ภาพของรางวัล (P1)

**ข้อมูลจริง:** ของรางวัล 4 รายการ (ของที่จับต้องได้ — D-06) ยังไม่มีภาพ
**ตรวจจากโค้ด** `components/dashboard/reward-card.tsx`: กรอบจัตุรัสเต็มความกว้างการ์ด (~240–330px) `object-fit: cover` พื้น Brand gradient · Alt = ชื่อรางวัล · หน้า `/dashboard/rewards` (สมาชิกเท่านั้น)
**นำเข้า:** Admin `/admin/rewards` → แก้ไข → "ภาพ (600×600)" → บันทึก
**ขนาด:** 600×600 (สั่ง 1024×1024) · 1:1

> สินค้าที่ระลึกจริงจะมีโลโก้ร้าน แต่ **AI ห้ามสร้างตัวอักษร/โลโก้** — Prompt จึงเว้นพื้นที่ว่างบนสินค้าไว้ หากต้องการให้มีคำว่า GEARAWAI Claude สามารถวางตัวอักษรจากฟอนต์จริงของเว็บลงบนพื้นที่ว่างภายหลังได้ (ไม่บังคับ — ต้องอนุมัติแยก)

| ID | ชื่อรางวัล (DB) | คะแนน | คำอธิบายภาพ | ชื่อไฟล์ | Alt |
| --- | --- | ---: | --- | --- | --- |
| RWD-01 | สติกเกอร์ GEARAWAI (Demo) | 20 | ชุดสติกเกอร์ไดคัท 5 ชิ้น ลายนามธรรม | `reward-sticker.webp` | สติกเกอร์ GEARAWAI (Demo) |
| RWD-02 | พวงกุญแจ GEARAWAI (Demo) | 50 | พวงกุญแจอะคริลิก/โลหะ ป้ายสี่เหลี่ยมมุมมน | `reward-keychain.webp` | พวงกุญแจ GEARAWAI (Demo) |
| RWD-03 | แก้วน้ำ GEARAWAI (Demo) | 100 | แก้วเซรามิกสีดำด้าน ด้านในน้ำเงิน | `reward-mug.webp` | แก้วน้ำ GEARAWAI (Demo) |
| RWD-04 | แผ่นรองเมาส์ขนาดเล็กลาย GEARAWAI (Demo) | 300 | แผ่นรองเมาส์ผ้าขนาดเล็ก ลายเส้นวงจรนามธรรม | `reward-mousepad-small.webp` | แผ่นรองเมาส์ขนาดเล็กลาย GEARAWAI (Demo) |

ข้อ 3–8, 12 ร่วม: ใช้ที่ `/dashboard/rewards` · 600×600 · 1:1 · ต้องมี: ของชิ้นเดียว/ชุดเดียว กลางภาพ ~65% · ห้ามมี: ข้อห้ามมาตรฐาน + ตัวอักษรบนของที่ระลึก · หมายเหตุ: สไตล์ "ภาพสินค้าจริง" เข้าชุดกับภาพสินค้า แต่พื้นหลังเป็น Brand gradient ให้ตรงกับกรอบการ์ด

**RWD-01 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) of a promotional merchandise item for a gaming-gear store's reward program.
Subject: a small set of five glossy die-cut vinyl stickers lying slightly overlapping, with simple abstract gaming-inspired shapes — a lightning bolt, a pixel heart, a chevron emblem, a hexagon and a directional-pad cross — in royal indigo, cool blue, white and one lime (#E3EF4F) sticker, each with a white die-cut border.
View: high three-quarter view from above, group centered, filling about 65% of the frame with even empty margin.
Style: photorealistic studio product photo, crisp details, soft shadows, subtle gloss highlights.
Background: smooth diagonal gradient from deep royal indigo #1F06AC (top-left) through #0F42C0 to #5882E8 (bottom-right), with a soft shadow beneath the items.
Rules: no text, letters, numbers or logos anywhere; no brand names; no watermark; no people or hands; no other objects.
```

**RWD-02 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) of a promotional merchandise item for a gaming-gear store's reward program.
Subject: a keychain with a rounded-square tag made of thick clear acrylic with a dark navy inner layer and a simple abstract chevron emblem in cool blue and lime (#E3EF4F), attached by a short metal chain to a silver split ring; the tag front has a plain blank area.
View: three-quarter front view, keychain centered and hanging slightly diagonally, filling about 60% of the frame with even empty margin.
Style: photorealistic studio product photo, crisp details, realistic acrylic and metal reflections.
Background: smooth diagonal gradient from deep royal indigo #1F06AC (top-left) through #0F42C0 to #5882E8 (bottom-right), with a soft shadow.
Rules: no text, letters, numbers or logos anywhere; no brand names; no watermark; no people or hands; no other objects.
```

**RWD-03 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) of a promotional merchandise item for a gaming-gear store's reward program.
Subject: a matte black ceramic coffee mug with a glossy royal-blue (#1F06AC) interior and handle, and one thin lime (#E3EF4F) stripe around the base; the front of the mug is plain and blank.
View: three-quarter front view with the handle on the right, mug centered, filling about 60% of the frame with even empty margin.
Style: photorealistic studio product photo, crisp details, soft reflections on the glaze.
Background: smooth diagonal gradient from deep royal indigo #1F06AC (top-left) through #0F42C0 to #5882E8 (bottom-right), with a soft shadow under the mug.
Rules: no text, letters, numbers or logos anywhere; no brand names; no watermark; no steam; no people or hands; no other objects.
```

**RWD-04 Prompt**

```text
Create a square 1:1 product image (1024×1024 px) of a promotional merchandise item for a gaming-gear store's reward program.
Subject: a small rectangular cloth gaming mouse pad (roughly 25 by 21 cm) with neat stitched edges and a subtle abstract circuit-line pattern in royal indigo and cool blue on a dark navy surface, with one small lime (#E3EF4F) dot in the pattern; nothing placed on the pad.
View: high three-quarter view from above, pad centered and slightly rotated, filling about 70% of the frame with even empty margin.
Style: photorealistic studio product photo, crisp fabric texture, soft shadow.
Background: smooth diagonal gradient from deep royal indigo #1F06AC (top-left) through #0F42C0 to #5882E8 (bottom-right).
Rules: no text, letters, numbers or logos anywhere; no brand names; no watermark; no people or hands; no other objects.
```

---

## 10. F — Team Avatar (P1)

**ข้อมูลจริง:** สมาชิกทีม 4 คน เป็นข้อมูลตัวอย่าง (`is_demo = true`) ชื่อ "Team Member 1–4 (Demo)" ยังไม่มีภาพ — หน้าเว็บตอนนี้แสดงอักษรย่อในวงกลม
**ตรวจจากโค้ด** `app/(store)/about/page.tsx` → `Team`: **วงกลม 112×112px** `object-fit: cover` พื้น Brand gradient · Alt = ชื่อสมาชิก
**นำเข้า:** Admin `/admin/settings` แท็บ About → Team → แก้ไข → "รูป (600×600)" → บันทึก
**แนวทาง:** Avatar เป็น **ไอคอน 3D ตามบทบาท — ไม่มีใบหน้าคน** (SPEC: ห้ามแต่งข้อมูลบุคคลจริง) · วัตถุอยู่ใน **วงกลมกลาง 65%** ของภาพ เพราะถูกครอปเป็นวงกลม

| ID | สมาชิก / ตำแหน่ง (DB) | สัญลักษณ์ | ชื่อไฟล์ | Alt |
| --- | --- | --- | --- | --- |
| TEAM-01 | Team Member 1 (Demo) · Project Manager | กระดานงาน Kanban + เครื่องหมายถูก + ธงเล็ก | `team-avatar-01-pm.webp` | Team Member 1 (Demo) |
| TEAM-02 | Team Member 2 (Demo) · Frontend Developer | หน้าต่างเบราว์เซอร์ที่มีบล็อก Layout + เคอร์เซอร์ | `team-avatar-02-frontend.webp` | Team Member 2 (Demo) |
| TEAM-03 | Team Member 3 (Demo) · Backend / Database | ฐานข้อมูลทรงกระบอกซ้อนกัน เชื่อมเส้นแสงกับเซิร์ฟเวอร์เล็ก | `team-avatar-03-backend.webp` | Team Member 3 (Demo) |
| TEAM-04 | Team Member 4 (Demo) · UI/UX Designer | ปลายปากกา Pen tool + เส้นโค้ง Bezier + แถบสี + โครงหน้าจอมือถือ | `team-avatar-04-uiux.webp` | Team Member 4 (Demo) |

ข้อ 4–5, 8, 12 ร่วม: 600×600 (สั่ง 1024×1024) · 1:1 · ห้าม: ใบหน้า/ร่างกายคน, ตัวอักษร, โลโก้ · หมายเหตุ: ถ้าภายหลังมีรูปจริงของสมาชิกทีม (ได้รับอนุญาต) สามารถแทนที่ได้ที่ช่องเดียวกัน

**Prompt แม่แบบ Avatar** (แทน `{ICON}`)

```text
Create a square 1:1 avatar image (1024×1024 px) for a team-member profile on a gaming-gear website. It will be cropped to a circle and shown at about 112×112 px.
Subject: {ICON}, as a glossy stylized 3D icon, centered and kept entirely inside the central circle (within the middle 65% of the frame), bold simple shapes that stay readable at small size.
Style: modern 3D icon render, soft studio lighting, white and cool-blue (#5882E8) materials with one small lime (#E3EF4F) accent.
Background: smooth diagonal gradient from deep royal indigo #1F06AC (top-left) through #0F42C0 to #5882E8 (bottom-right), with a soft glow behind the icon.
Rules: no human face, no person, no body parts, no characters; no text, letters, numbers or logos; no watermark.
```

| ID | `{ICON}` |
| --- | --- |
| TEAM-01 | `a small floating kanban task board with three columns of cards, a check-mark badge and a tiny flag` |
| TEAM-02 | `a floating web-browser window showing colorful abstract layout blocks, with a mouse cursor pointing at one block` |
| TEAM-03 | `a stack of three database cylinders connected by glowing lines to a small server rack` |
| TEAM-04 | `a vector pen-tool nib drawing a smooth bezier curve, with a fan of color swatches and a small phone wireframe` |

---

## 11. G — Gallery หน้า About (P2)

**ตรวจจากโค้ด** `app/(store)/about/page.tsx` → `Gallery`: ดึงภาพหมวด `gallery` จาก RPC `get_public_gallery()` · กรอบ **3:2** `object-fit: cover` · 3 คอลัมน์ (Desktop) / 2 (Tablet) / 1 (Mobile) · **ไม่มีภาพ = ซ่อนทั้ง Section** (ตอนนี้ถูกซ่อนอยู่) · Alt มาจาก `media_files.alt_text`
**นำเข้า:** Admin `/admin/images` → อัปโหลด เลือกหมวด **gallery** (จะแสดงทันที)
**ข้อห้ามสำคัญ:** ห้ามภาพหน้าร้าน/โชว์รูม/คลังสินค้า — ใช้ภาพบรรยากาศ "การใช้งานอุปกรณ์" แทน · ขนาด 1200×800 (สั่ง 1536×1024 ไม่ต้องครอป) · จำนวนแนะนำ 3 ภาพ (เต็ม 1 แถว)

| ID | เนื้อหา | ชื่อไฟล์ | Alt |
| --- | --- | --- | --- |
| GAL-01 | โต๊ะเกมมิ่งยามค่ำ (ภาพรวมสินค้าหลายหมวด) | `gallery-01-gaming-setup.webp` | ภาพบรรยากาศโต๊ะเกมมิ่ง (ภาพประกอบ) |
| GAL-02 | Flat-lay อุปกรณ์มุมบน | `gallery-02-gear-flatlay.webp` | อุปกรณ์เกมมิ่งจัดวางมุมบน (ภาพประกอบ) |
| GAL-03 | โต๊ะประกอบคอมพิวเตอร์ (สอดคล้องบริการประกอบคอม) | `gallery-03-pc-build.webp` | โต๊ะประกอบคอมพิวเตอร์ (ภาพประกอบ) |

**GAL-01 Prompt**

```text
Create a landscape 3:2 image (1536×1024 px) for the gallery of an online gaming-gear store's About page.
Subject: a clean, modern gaming desk setup at night in a home room — a mechanical keyboard, a wireless mouse on a large desk mat, an over-ear headset on a stand, a stream controller and the backrest of a gaming chair; the monitor shows only a soft abstract blue gradient.
Lighting and color: deep navy #0A0B1E ambience, royal-blue #1F06AC and cool-blue #5882E8 accent lighting, one small lime #E3EF4F highlight.
Style: photorealistic, high detail, cinematic, tidy and premium.
Rules: not a shop, showroom or warehouse; no people or hands; no text, letters, numbers, logos or brand names; no on-screen UI; no watermark.
```

**GAL-02 Prompt**

```text
Create a landscape 3:2 image (1536×1024 px) for the gallery of an online gaming-gear store's About page.
Subject: a neat top-down flat-lay of gaming gear on a dark desk mat — a tenkeyless keyboard with blank keycaps, a wireless mouse, an over-ear headset, a coiled braided cable and a few spare keycaps — arranged with even spacing.
Lighting and color: soft even top light, dark navy #0A0B1E and #12143A surfaces, cool-blue #5882E8 rim glow, one lime #E3EF4F keycap.
Style: photorealistic, high detail, crisp, editorial product photography.
Rules: no people or hands; no text, letters, numbers, logos or brand names; no watermark.
```

**GAL-03 Prompt**

```text
Create a landscape 3:2 image (1536×1024 px) for the gallery of an online gaming-gear store's About page, representing its PC-building service.
Subject: a tidy workbench with an open mid-tower PC case being assembled — motherboard, graphics card and RAM installed, a few components and a precision screwdriver set laid out on a blue anti-static mat.
Lighting and color: deep navy #0A0B1E ambience, cool-blue #5882E8 and royal-blue #1F06AC lighting inside the case, one small lime #E3EF4F accent.
Style: photorealistic, high detail, clean and professional.
Rules: not a shop, showroom or warehouse; no people or hands; no text, letters, numbers, logos or brand names on any component; no watermark.
```

---

## 12. H — โลโก้ร้าน / Favicon (แยกจากภาพประกอบ)

| รายการ | สถานะปัจจุบัน | ข้อเสนอ | ใช้ AI? |
| --- | --- | --- | --- |
| **โลโก้ร้าน** (SPEC 180×60) | `components/layout/logo.tsx` เป็นโลโก้ตัวอักษร "GEAR**AWAI**" + "LEVEL UP YOUR GEAR" จากฟอนต์ของเว็บ (คมทุกขนาด, ไม่มีช่องอัปโหลดโลโก้ในฐานข้อมูล) | **คงไว้ตามเดิม** — ไม่ต้องสร้างภาพ ถ้าภายหลังต้องการโลโก้กราฟิก ควรออกแบบเป็น SVG ในโปรแกรมเวกเตอร์ และต้องแก้โค้ด | ❌ ไม่ใช้ (AI สร้างตัวอักษร/โลโก้ได้ไม่แม่นและเสี่ยงลิขสิทธิ์) |
| **ICON-01 Favicon / App icon** | `app/favicon.ico` = ไอคอนเริ่มต้นของ Next.js (ยังไม่ใช่ของร้าน) | โมโนแกรม "G" สีขาว + จุด Lime บนสี่เหลี่ยมมุมมน Brand gradient | ❌ Claude ทำเป็น SVG จากโค้ด (ต้องแก้โค้ด → รออนุมัติ) |

**ICON-01 สเปก**

| ไฟล์ | ขนาด | ตำแหน่ง | หมายเหตุ |
| --- | --- | --- | --- |
| `app/icon.svg` | เวกเตอร์ (viewBox 64×64) | แท็บเบราว์เซอร์ทุกขนาด | Next.js สร้าง `<link rel="icon">` ให้อัตโนมัติ |
| `app/apple-icon.png` | 180×180 | Bookmark บน iOS | ไม่บังคับ |
| `app/favicon.ico` | 32×32 + 16×16 | เบราว์เซอร์เก่า | แทนที่ไฟล์ของ Next.js หรือลบทิ้งเพื่อใช้ `icon.svg` อย่างเดียว |

ดีไซน์: พื้น `#1F06AC → #5882E8` (135°) มุมมน 22% · ตัว "G" หนา สีขาว (ฟอนต์ Display ของเว็บ) · จุด/ขีด `#E3EF4F` เล็ก 1 จุด · ต้องอ่านออกที่ 16×16

---

## 13. I — ภาพอื่น ๆ

### 13.1 ภาพบริการ (P2 — หน้าร้านยังไม่แสดง)

**ตรวจจากโค้ด:** Admin `/admin/services/[id]` มีช่อง "ภาพบริการ (600×400)" แต่ **หน้า `/booking` และ Dashboard ไม่ได้แสดงภาพบริการ** → สร้างแล้วจะยังไม่เห็นบนเว็บ จนกว่าจะแก้โค้ดให้แสดง (ไม่อยู่ในขอบเขตตอนนี้)
ขนาด 600×400 (สั่ง 1536×1024 ไม่ต้องครอป) · 3:2 · Alt = ชื่อบริการ

| ID | บริการ (DB) | ชื่อไฟล์ | Prompt (คัดลอกได้ทันที) |
| --- | --- | --- | --- |
| SRV-01 | บริการประกอบคอมพิวเตอร์ (Demo) | `service-pc-build.webp` | ใช้ Prompt GAL-03 แล้วเปลี่ยนประโยคแรกเป็น `Create a landscape 3:2 image (1536×1024 px) illustrating a PC-building service for an online gaming-gear store.` |
| SRV-02 | บริการตรวจเช็กอุปกรณ์เกมมิ่ง (Demo) | `service-gear-check.webp` | ดูด้านล่าง |
| SRV-03 | บริการติดตั้งและตั้งค่าซอฟต์แวร์อุปกรณ์ (Demo) | `service-software-setup.webp` | ดูด้านล่าง |

**SRV-02 Prompt**

```text
Create a landscape 3:2 image (1536×1024 px) illustrating a gaming-gear inspection service for an online store.
Subject: a gaming mouse, a mechanical keyboard with blank keycaps and an over-ear headset neatly arranged on a blue anti-static mat, next to a precision screwdriver set, a soft brush and a small magnifier lamp, as if being carefully checked.
Lighting and color: deep navy #0A0B1E background, cool-blue #5882E8 and royal-blue #1F06AC light, one small lime #E3EF4F accent.
Style: photorealistic, high detail, clean and professional.
Rules: no people or hands; no text, letters, numbers, logos or brand names; no watermark.
```

**SRV-03 Prompt**

```text
Create a landscape 3:2 image (1536×1024 px) illustrating a device software setup and configuration service for an online gaming-gear store.
Subject: a mechanical keyboard and a wireless gaming mouse with glowing RGB lighting on a dark desk, with abstract floating holographic sliders, toggles and color wheels (no words) above them, suggesting lighting and button configuration.
Lighting and color: deep navy #0A0B1E background, royal-blue #1F06AC and cool-blue #5882E8 glow, one lime #E3EF4F toggle.
Style: photorealistic with subtle holographic UI shapes, high detail, premium tech look.
Rules: no people or hands; no readable text, letters, numbers, logos or brand names; no watermark.
```

### 13.2 ภาพที่ไม่ต้องสร้าง (ระบบแสดงแทนได้ / ไม่มีช่องใช้งาน / ไม่ควรสร้าง)

| รายการ | SPEC | สถานะจริง | สรุป |
| --- | --- | --- | --- |
| QR ชำระเงิน | 250×250 | `components/checkout/demo-qr.tsx` วาด QR จำลอง (สแกนไม่ได้) + ลายน้ำ DEMO อัตโนมัติ · ช่อง `qr_image_url` ใน Settings มีแต่ **หน้า Payment ไม่ได้ใช้** | ❌ ไม่สร้าง — ระบบแสดงแทนแล้ว และภาพ QR ที่ดูเหมือนจริงอาจทำให้เข้าใจผิด |
| โลโก้แบรนด์ 7 แบรนด์ | (ไม่บังคับ) | ช่อง `logo_url` ใน Admin Brands มี แต่ **หน้าร้านไม่แสดง** | ❌ ห้ามสร้าง — เป็นเครื่องหมายการค้าของจริง |
| โลโก้ช่องทางชำระเงิน | 48×48 | ใช้ไอคอน Lucide (UI_UX: ห้ามใช้โลโก้ธนาคารจริง) | ❌ ไม่สร้าง |
| โลโก้ร้าน | 180×60 | โลโก้ตัวอักษรจากโค้ด | ❌ ไม่สร้าง (หัวข้อ 12) |
| Contact Banner / ภาพประกอบ Contact | 1920×300 / 1200×800 | `PageHeader` ใช้ Brand gradient · ไม่มีช่องภาพ | ⏸ ไม่ต้องตอนนี้ (ต้องแก้โค้ดก่อน) |
| ภาพประวัติร้าน (About) | 1200×800 | แสดงแผงโลโก้บน Gradient · `about_content` ไม่มีฟิลด์ภาพ | ⏸ ไม่ต้องตอนนี้ (ต้องแก้โค้ด) — ถ้าต้องการ ใช้ Prompt GAL-01 ได้ |
| ภาพประกอบวันเกิด | 800×500 | `birthday-card.tsx` ใช้ไอคอน Gift · ไม่มีช่องภาพ | ⏸ ไม่ต้องตอนนี้ |
| ภาพหน้า Login/Register | — | แผงซ้ายเป็น Gradient | ⏸ ไม่ต้อง |
| Avatar สมาชิก | 100×100 | สมาชิกอัปโหลดเองที่ `/dashboard/profile` | ❌ ไม่สร้าง |
| Open Graph / Social share | — | ไม่อยู่ใน SPEC | ⏸ ไม่ต้อง |

---

## 14. ข้อสังเกตจากการตรวจ (ไม่ได้แก้ไข — รายงานเพื่อตัดสินใจ)

1. **อย่าลบไฟล์ SVG Placeholder** ใน `public/images/products/` แม้เปลี่ยนภาพหลักแล้ว — คำสั่งซื้อเดิมเก็บ URL ภาพ ณ เวลาสั่งซื้อ (`order_items.product_image_url`) ถ้าลบไฟล์ ประวัติคำสั่งซื้อจะเห็นภาพเสีย
2. **ภาพสินค้าเป็นภาพประกอบ ไม่ใช่ภาพสินค้าจริง** แต่หน้าเว็บแสดงชื่อรุ่นจริง — แนะนำ (ภายหลัง, ต้องแก้โค้ด) ให้เพิ่มข้อความเล็ก "ภาพประกอบเพื่อการศึกษา" ใต้ภาพในหน้า Detail ตามแนวทาง PRODUCT_DATA §1 ข้อ 6
3. การ์ดโปรโมชั่นบนมือถือครอปภาพ 750×1000 เป็นแนวนอน (0.2 ข้อ 4) — Prompt PRO-02 รองรับแล้ว
4. Hero แสดงภาพที่ทึบ 50% และ Promotion ที่ 60% — ภาพที่มืดมากจะดูจมหายไป ให้ภาพมีความสว่างระดับกลาง
5. `upload_rule.max_bytes` ใน Settings ยังไม่ถูกบังคับใช้ (ระบบใช้ 2 MB คงที่) — ไม่กระทบงานนี้เพราะทุกไฟล์เล็กกว่ามาก
6. การลบภาพสินค้าใน Admin ลบเฉพาะแถว `product_images` ไม่ลบไฟล์ใน Storage — ถ้าอัปโหลดผิดแล้วลบ จะมีไฟล์ค้าง (จัดการได้ที่ `/admin/images`)
7. ไฟล์จากแผนเดิม (ตัวสร้างภาพเวกเตอร์) ยังอยู่ในเครื่องและยังไม่ Commit: `scripts/illustrations/` และ `public/_tmp/` — ไม่ได้ใช้แล้วตามแผนใหม่ (รอคำสั่งว่าจะลบหรือเก็บ)
