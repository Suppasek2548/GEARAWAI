# GEARAWAI — Product Data (ข้อมูลสินค้าตัวอย่าง 20 รายการ)

> | รายการ | รายละเอียด |
> |---|---|
> | เอกสาร | 4 / 6 — GEARAWAI_PRODUCT_DATA.md |
> | Revision | **Rev.1 (11 พ.ย. 2026)** — เปลี่ยนของรางวัลประเภทคูปองเป็นของจับต้องได้ (D-06, R-17) · ยืนยันค่าตัวอย่าง (D-05) |
> | สถานะ | **Demo Data เพื่อการศึกษาเท่านั้น** (`is_demo = true`) |
> | อ้างอิง | SPEC ระบบที่ 3 (รายชื่อสินค้า 20 รายการ + ฟิลด์ที่ต้องมี), DATABASE_DESIGN ตาราง `products`, `categories`, `brands` |

---

## ⚠️ ข้อกำหนดการใช้ข้อมูล

1. **ราคาทั้งหมดเป็นราคาจำลอง (Demo Price)** — ตั้งขึ้นให้อยู่ในช่วงใกล้เคียงตลาดเพื่อให้ระบบดูสมจริง **ยังไม่ได้ตรวจสอบกับราคาขายจริงในประเทศไทย** ณ วันที่จัดทำ ห้ามนำไปอ้างอิงเป็นราคาจริง
2. **จำนวนสต็อกเป็นข้อมูลจำลอง** — ตั้งค่าให้ครอบคลุมกรณีทดสอบ (มีสินค้า / เหลือน้อย / หมด)
3. **คุณสมบัติ (Specifications)** เรียบเรียงจากข้อมูลทั่วไปของผู้ผลิตเท่าที่ทราบ **ยังไม่ได้ตรวจสอบซ้ำกับเว็บไซต์ผู้ผลิต** — สินค้าหลายรุ่นมีหลายเวอร์ชัน/ปรับเฟิร์มแวร์ภายหลัง ค่าที่มีคำว่า "ประมาณ" หรือ ⓥ ควรตรวจสอบก่อนนำเสนอ
4. **คำอธิบายสินค้า** เขียนขึ้นใหม่สำหรับโครงงาน ไม่ได้คัดลอกจากผู้ผลิต
5. **ชื่อสินค้าและแบรนด์** เป็นเครื่องหมายการค้าของเจ้าของ ใช้เพื่อการศึกษาเท่านั้น
6. **รูปภาพสินค้า:** ภาพจากเว็บไซต์ผู้ผลิตมีลิขสิทธิ์ — แนะนำให้ใช้ภาพ Placeholder ของร้านเอง (800×800, พื้นเข้ม + ชื่อสินค้า) หรือภาพที่ได้รับอนุญาต และระบุแหล่งที่มา
7. เว็บไซต์ต้องแสดงข้อความในหน้า Shop/Footer ว่า **"ราคาและข้อมูลสินค้าเป็นข้อมูลตัวอย่างสำหรับโครงงานการศึกษา"**

---

## 1. หมวดหมู่สินค้า (`categories`)

| sort | name | slug | รหัสใน SKU | จำนวนสินค้าใน 20 รายการ |
|---:|---|---|---|---:|
| 1 | Gaming Mouse | `gaming-mouse` | `MS` | 5 |
| 2 | Gaming Keyboard | `gaming-keyboard` | `KB` | 5 |
| 3 | Gaming Headset | `gaming-headset` | `HS` | 5 |
| 4 | Mouse Pad | `mouse-pad` | `MP` | 1 |
| 5 | Gaming Chair | `gaming-chair` | `CH` | 2 |
| 6 | Racing Wheel | `racing-wheel` | `RW` | 1 |
| 7 | Streaming Equipment | `streaming-equipment` | `ST` | 1 |
| 8 | Computer Accessories | `computer-accessories` | `AC` | **0** ⚠️ |

> ⚠️ **Computer Accessories** อยู่ในกลุ่มสินค้าของ CONTEXT แต่ไม่มีสินค้าใดใน 20 รายการของ SPEC (M16) — **ไม่ได้เพิ่มสินค้าเอง** หมวดนี้จะแสดง Empty State จนกว่าจะเพิ่มสินค้าผ่าน Admin

## 2. แบรนด์ (`brands`)

| name | slug | สินค้า (ลำดับตาม SPEC) | จำนวน |
|---|---|---|---:|
| Razer | `razer` | 1, 4, 6, 12, 16, 19 | 6 |
| Logitech | `logitech` | 2, 3, 7, 11, 15, 18 | 6 |
| SteelSeries | `steelseries` | 5, 9, 13 | 3 |
| HyperX | `hyperx` | 8, 14 | 2 |
| Keychron | `keychron` | 10 | 1 |
| Secretlab | `secretlab` | 17 | 1 |
| Elgato | `elgato` | 20 | 1 |
| **รวม** | | | **20** ✅ |

---

## 3. สรุปสินค้า 20 รายการ

> ราคาเป็นบาท (THB) · **ทุกราคาเป็นราคาจำลอง** · `sale_price` ว่าง = ไม่มีราคาลด · ⭐ = `is_featured`
> สต็อก: 🟢 ปกติ · 🟡 เหลือน้อย (≤ 5 = `low_stock_threshold`) · 🔴 หมด

| # | SKU | Product Name | Brand | Category | Price (Demo) | Sale Price (Demo) | Stock (Demo) | ⭐ |
|---:|---|---|---|---|---:|---:|---:|:---:|
| 1 | GA-MS-001 | Razer DeathAdder V3 Pro | Razer | Gaming Mouse | 5,490.00 | 4,990.00 | 12 🟢 | ⭐ |
| 2 | GA-MS-002 | Logitech G Pro X Superlight 2 | Logitech | Gaming Mouse | 5,290.00 | — | 15 🟢 | ⭐ |
| 3 | GA-MS-003 | Logitech G502 X Plus | Logitech | Gaming Mouse | 5,690.00 | — | 8 🟢 | |
| 4 | GA-MS-004 | Razer Viper V3 Pro | Razer | Gaming Mouse | 5,990.00 | — | 6 🟢 | ⭐ |
| 5 | GA-MS-005 | SteelSeries Aerox 3 Wireless | SteelSeries | Gaming Mouse | 3,290.00 | 2,790.00 | 20 🟢 | |
| 6 | GA-KB-001 | Razer BlackWidow V4 | Razer | Gaming Keyboard | 6,490.00 | — | 7 🟢 | |
| 7 | GA-KB-002 | Logitech G Pro X TKL | Logitech | Gaming Keyboard | 7,490.00 | — | 5 🟡 | ⭐ |
| 8 | GA-KB-003 | HyperX Alloy Origins | HyperX | Gaming Keyboard | 3,690.00 | 3,190.00 | 18 🟢 | |
| 9 | GA-KB-004 | SteelSeries Apex Pro TKL | SteelSeries | Gaming Keyboard | 7,990.00 | — | 4 🟡 | |
| 10 | GA-KB-005 | Keychron K8 Pro | Keychron | Gaming Keyboard | 3,990.00 | — | 10 🟢 | |
| 11 | GA-HS-001 | Logitech G733 Lightspeed | Logitech | Gaming Headset | 5,290.00 | 4,590.00 | 9 🟢 | |
| 12 | GA-HS-002 | Razer BlackShark V2 Pro | Razer | Gaming Headset | 6,990.00 | — | **0** 🔴 | |
| 13 | GA-HS-003 | SteelSeries Arctis Nova 7 | SteelSeries | Gaming Headset | 6,990.00 | — | 11 🟢 | ⭐ |
| 14 | GA-HS-004 | HyperX Cloud III | HyperX | Gaming Headset | 3,490.00 | — | 25 🟢 | |
| 15 | GA-HS-005 | Logitech G Pro X 2 Lightspeed | Logitech | Gaming Headset | 8,990.00 | — | 3 🟡 | |
| 16 | GA-CH-001 | Razer Iskur V2 | Razer | Gaming Chair | 19,900.00 | — | 3 🟡 | |
| 17 | GA-CH-002 | Secretlab TITAN Evo | Secretlab | Gaming Chair | 19,900.00 | — | 2 🟡 | ⭐ |
| 18 | GA-RW-001 | Logitech G923 Racing Wheel | Logitech | Racing Wheel | 12,900.00 | 10,900.00 | 5 🟡 | ⭐ |
| 19 | GA-MP-001 | Razer Strider Chroma | Razer | Mouse Pad | 3,290.00 | — | 14 🟢 | |
| 20 | GA-ST-001 | Elgato Stream Deck MK.2 | Elgato | Streaming Equipment | 5,490.00 | — | 8 🟢 | ⭐ |

**ค่าทั่วไปของทุกรายการ:** `status = 'active'` · `low_stock_threshold = 5` · `sold_count = 0` (เพิ่มเมื่อ Order ยืนยันชำระแล้ว — D-07) · `is_demo = true` · ระบบบันทึก `stock_movements('initial')` อัตโนมัติตอน Seed

### 3.1 กรณีทดสอบที่ข้อมูลชุดนี้รองรับ (เชื่อม TEST_CASES)

| กรณี | สินค้าที่ใช้ |
|---|---|
| สินค้าหมด → ปุ่ม Add to Cart ถูกปิด | #12 BlackShark V2 Pro (stock 0) |
| สต็อกเหลือน้อย → ป้าย "เหลือน้อย" และจำกัดจำนวนในตะกร้า | #17 TITAN Evo (2), #15 G Pro X 2 (3) |
| แสดงราคาลด (sale_price) | #1, #5, #8, #11, #18 |
| ค้นหาจากแบรนด์ "razer" ได้ 6 รายการ | แบรนด์ Razer |
| กรองหมวด Gaming Mouse ได้ 5 รายการ | #1–#5 |
| กรองราคา 3,000–4,000 บาท (`effective_price`) | #5 (2,790 ❌ ไม่อยู่ในช่วง), #8 (3,190), #10 (3,990), #14 (3,490), #19 (3,290) → **4 รายการ** |
| เรียง Name A–Z รายการแรก | "Elgato Stream Deck MK.2" |
| เรียง Price Low→High รายการแรก | #5 Aerox 3 Wireless (2,790) |
| เรียง Price High→Low รายการแรก | #16 / #17 (19,900 เท่ากัน — เรียงรองด้วยชื่อ: Razer Iskur V2 ก่อน) |
| หมวดว่าง | Computer Accessories |

---

## 4. รายละเอียดสินค้ารายตัว

> รูปแบบ: **Short Description** (≤ 200 ตัวอักษร, ใช้บน Card) · **Description** (หน้า Detail) · **Specifications** (เก็บใน `specifications jsonb`)
> ⓥ = ควรตรวจสอบกับเว็บไซต์ผู้ผลิต (ค่ามีหลายเวอร์ชันหรือไม่แน่ใจ)

### #1 Razer DeathAdder V3 Pro — `GA-MS-001`

- **Brand / Category:** Razer · Gaming Mouse
- **Price / Sale / Stock (Demo):** 5,490 / 4,990 / 12
- **Short Description:** เมาส์ไร้สายทรงจับถนัดขวาน้ำหนักเบา เหมาะกับเกม FPS ที่ต้องการความแม่นยำ
- **Description:** เมาส์เกมมิ่งไร้สายทรง Ergonomic สำหรับมือขวา ออกแบบให้น้ำหนักเบาแต่จับได้มั่นคง ใช้เซนเซอร์ออปติคอลความละเอียดสูงและสวิตช์ออปติคอลที่ตอบสนองเร็ว เหมาะกับผู้เล่นสาย Competitive ที่ต้องการเมาส์สำหรับเล่นต่อเนื่องเป็นเวลานาน
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | Razer HyperSpeed Wireless (2.4 GHz), USB-C (สาย) |
| Sensor | Razer Focus Pro 30K Optical |
| Shape | Ergonomic (ถนัดขวา) |
| Weight | ประมาณ 63 g ⓥ |
| Switches | Razer Optical Mouse Switches Gen-3 |
| Battery | สูงสุดประมาณ 90 ชั่วโมง ⓥ |

### #2 Logitech G Pro X Superlight 2 — `GA-MS-002`

- **Brand / Category:** Logitech · Gaming Mouse
- **Price / Sale / Stock (Demo):** 5,290 / — / 15
- **Short Description:** เมาส์ไร้สายทรงสมมาตรน้ำหนักเบามาก ออกแบบสำหรับนักกีฬาอีสปอร์ต
- **Description:** เมาส์ไร้สายทรงสมมาตรที่เน้นน้ำหนักเบาเป็นพิเศษ ใช้การเชื่อมต่อไร้สาย LIGHTSPEED ที่มีความหน่วงต่ำ และสวิตช์แบบไฮบริด เหมาะกับผู้เล่นที่ใช้การจับแบบ Claw หรือ Fingertip และต้องการเมาส์ที่ขยับได้คล่องตัว
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | LIGHTSPEED Wireless, USB-C (ชาร์จ/สาย) |
| Sensor | HERO 2 |
| Shape | Symmetrical |
| Weight | ประมาณ 60 g ⓥ |
| Switches | LIGHTFORCE Hybrid Optical-Mechanical |
| Battery | สูงสุดประมาณ 95 ชั่วโมง ⓥ |

### #3 Logitech G502 X Plus — `GA-MS-003`

- **Brand / Category:** Logitech · Gaming Mouse
- **Price / Sale / Stock (Demo):** 5,690 / — / 8
- **Short Description:** เมาส์ไร้สายรุ่นยอดนิยมที่มีปุ่มมากและไฟ RGB เหมาะทั้งเกมและงานทั่วไป
- **Description:** เมาส์ไร้สายตระกูล G502 ที่มีปุ่มตั้งค่าได้จำนวนมาก เหมาะกับเกม MMO/MOBA และการตั้ง Macro สำหรับงานทั่วไป มาพร้อมไฟ LIGHTSYNC RGB และล้อเลื่อนที่สลับโหมดได้
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | LIGHTSPEED Wireless, USB-C |
| Sensor | HERO 25K |
| Shape | Ergonomic (ถนัดขวา) |
| Weight | ประมาณ 106 g ⓥ |
| Switches | LIGHTFORCE Hybrid Optical-Mechanical |
| Programmable Controls | 13 ปุ่ม ⓥ |
| Lighting | LIGHTSYNC RGB |

### #4 Razer Viper V3 Pro — `GA-MS-004`

- **Brand / Category:** Razer · Gaming Mouse
- **Price / Sale / Stock (Demo):** 5,990 / — / 6
- **Short Description:** เมาส์ไร้สายทรงสมมาตรน้ำหนักเบา รองรับ Polling Rate สูง สำหรับการแข่งขัน
- **Description:** เมาส์ไร้สายทรงสมมาตรสำหรับสายแข่งขัน เน้นน้ำหนักเบาและการตอบสนองที่รวดเร็ว รองรับ Polling Rate สูงเมื่อใช้กับตัวรับสัญญาณที่รองรับ เหมาะกับเกม FPS ที่ต้องเล็งเร็ว
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | Razer HyperSpeed Wireless, USB-C |
| Sensor | Razer Focus Pro 35K Optical Gen-2 |
| Polling Rate | สูงสุด 8000 Hz (เมื่อใช้ตัวรับสัญญาณที่รองรับ) ⓥ |
| Shape | Symmetrical |
| Weight | ประมาณ 54 g ⓥ |
| Battery | สูงสุดประมาณ 95 ชั่วโมง ⓥ |

### #5 SteelSeries Aerox 3 Wireless — `GA-MS-005`

- **Brand / Category:** SteelSeries · Gaming Mouse
- **Price / Sale / Stock (Demo):** 3,290 / 2,790 / 20
- **Short Description:** เมาส์ไร้สายเชลล์รังผึ้งน้ำหนักเบา เชื่อมต่อได้ทั้ง 2.4 GHz และ Bluetooth
- **Description:** เมาส์ไร้สายดีไซน์เชลล์รูพรุนเพื่อลดน้ำหนัก เชื่อมต่อได้สองแบบ ใช้ 2.4 GHz สำหรับเล่นเกม และ Bluetooth สำหรับงานทั่วไป มีการป้องกันฝุ่นและน้ำระดับหนึ่ง เหมาะเป็นเมาส์ไร้สายรุ่นเริ่มต้นที่คุ้มค่า
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | Quantum 2.0 Wireless (2.4 GHz), Bluetooth, USB-C |
| Sensor | TrueMove Air |
| Shape | Ergonomic (ถนัดขวา) ทรงเล็ก |
| Weight | ประมาณ 66–68 g (ขึ้นกับรุ่นปีผลิต) ⓥ |
| Protection | IP54 (กันฝุ่น/กันละอองน้ำ) ⓥ |
| Battery | สูงสุดประมาณ 200 ชั่วโมง (โหมด Bluetooth) ⓥ |

### #6 Razer BlackWidow V4 — `GA-KB-001`

- **Brand / Category:** Razer · Gaming Keyboard
- **Price / Sale / Stock (Demo):** 6,490 / — / 7
- **Short Description:** คีย์บอร์ดเมคานิคอลขนาดเต็ม มีปุ่ม Macro และปุ่มควบคุมมีเดีย พร้อมไฟ Chroma RGB
- **Description:** คีย์บอร์ดเมคานิคอลขนาดเต็ม (Full-size) สำหรับเกมเมอร์ที่ต้องการปุ่มลัดและ Macro เพิ่มเติม มีปุ่มควบคุมมีเดียและวงล้อปรับค่า พร้อมที่พักข้อมือ และไฟ Razer Chroma RGB ที่ปรับแต่งได้
- **Specifications:**

| Key | Value |
|---|---|
| Layout | Full-size |
| Switches | Razer Mechanical Switches (Green — Clicky / Yellow — Linear ตามรุ่น) ⓥ |
| Macro Keys | 6 ปุ่มเฉพาะ ⓥ |
| Media Controls | ปุ่มมีเดีย + วงล้ออเนกประสงค์ |
| Lighting | Razer Chroma RGB |
| Connectivity | USB (สาย) |
| Accessory | ที่พักข้อมือ |

### #7 Logitech G Pro X TKL — `GA-KB-002`

- **Brand / Category:** Logitech · Gaming Keyboard
- **Price / Sale / Stock (Demo):** 7,490 / — / 5
- **Short Description:** คีย์บอร์ดไร้สายขนาด TKL สำหรับอีสปอร์ต เชื่อมต่อได้หลายช่องทาง
- **Description:** คีย์บอร์ดเมคานิคอลขนาด Tenkeyless ตัดแป้นตัวเลขออกเพื่อเพิ่มพื้นที่ขยับเมาส์ รองรับการเชื่อมต่อไร้สาย LIGHTSPEED, Bluetooth และสาย USB-C เลือกสวิตช์ได้หลายแบบ เหมาะกับการพกไปแข่งขัน
- **Specifications:**

| Key | Value |
|---|---|
| Layout | Tenkeyless (TKL) |
| Switches | GX Switches (Tactile / Linear / Clicky ตามรุ่น) |
| Connectivity | LIGHTSPEED Wireless, Bluetooth, USB-C |
| Lighting | LIGHTSYNC RGB |
| Battery | สูงสุดประมาณ 50 ชั่วโมง ⓥ |

### #8 HyperX Alloy Origins — `GA-KB-003`

- **Brand / Category:** HyperX · Gaming Keyboard
- **Price / Sale / Stock (Demo):** 3,690 / 3,190 / 18
- **Short Description:** คีย์บอร์ดเมคานิคอลบอดี้อะลูมิเนียม ไฟ RGB รายปุ่ม สาย USB-C ถอดได้
- **Description:** คีย์บอร์ดเมคานิคอลขนาดเต็มที่มีโครงอะลูมิเนียมแข็งแรง ใช้สวิตช์ของ HyperX เอง ไฟ RGB แยกรายปุ่ม และสาย USB-C ถอดได้ เหมาะกับผู้ที่ต้องการคีย์บอร์ดเมคานิคอลคุณภาพดีในราคาระดับกลาง
- **Specifications:**

| Key | Value |
|---|---|
| Layout | Full-size |
| Switches | HyperX Mechanical (Red / Aqua / Blue ตามรุ่น) |
| Body | อะลูมิเนียม |
| Lighting | RGB รายปุ่ม |
| Connectivity | USB-C (สายถอดได้) |
| Adjustable Feet | ปรับความชันได้ 3 ระดับ ⓥ |

### #9 SteelSeries Apex Pro TKL — `GA-KB-004`

- **Brand / Category:** SteelSeries · Gaming Keyboard
- **Price / Sale / Stock (Demo):** 7,990 / — / 4
- **Short Description:** คีย์บอร์ด TKL ที่ปรับระยะกดของสวิตช์ได้ พร้อมจอ OLED และ Rapid Trigger
- **Description:** คีย์บอร์ดขนาด TKL ที่ใช้สวิตช์แบบปรับระยะ Actuation ได้รายปุ่ม ทำให้ตั้งค่าให้ไวมากสำหรับเกมหรือลึกขึ้นสำหรับการพิมพ์ มีจอ OLED ขนาดเล็กแสดงข้อมูลและโปรไฟล์ เหมาะกับผู้เล่นที่ชอบปรับแต่งละเอียด
- **Specifications:**

| Key | Value |
|---|---|
| Layout | Tenkeyless (TKL) |
| Switches | OmniPoint Adjustable (Hall Effect) — ปรับระยะ Actuation ได้ ⓥ |
| Features | Rapid Trigger (รุ่นปี 2023 ขึ้นไป) ⓥ |
| Display | OLED Smart Display |
| Connectivity | USB (สาย) — มีรุ่นไร้สายแยก ⓥ |
| Accessory | ที่พักข้อมือแม่เหล็ก ⓥ |

### #10 Keychron K8 Pro — `GA-KB-005`

- **Brand / Category:** Keychron · Gaming Keyboard
- **Price / Sale / Stock (Demo):** 3,990 / — / 10
- **Short Description:** คีย์บอร์ด TKL ไร้สาย รองรับ QMK/VIA และเปลี่ยนสวิตช์ได้ (Hot-swap) ใช้ได้ทั้ง Mac และ Windows
- **Description:** คีย์บอร์ดเมคานิคอลขนาด TKL ที่เน้นการปรับแต่ง รองรับเฟิร์มแวร์ QMK และโปรแกรม VIA สำหรับ Remap ปุ่ม เปลี่ยนสวิตช์ได้โดยไม่ต้องบัดกรี เชื่อมต่อผ่าน Bluetooth หรือสาย และมีปุ่มสำหรับทั้ง macOS และ Windows
- **Specifications:**

| Key | Value |
|---|---|
| Layout | Tenkeyless (87 keys) |
| Firmware | QMK / VIA |
| Hot-swappable | รองรับ |
| Switches | Gateron G Pro (ตามรุ่น) ⓥ |
| Connectivity | Bluetooth 5.1, USB-C ⓥ |
| OS | macOS / Windows |
| Battery | 4000 mAh ⓥ |

### #11 Logitech G733 Lightspeed — `GA-HS-001`

- **Brand / Category:** Logitech · Gaming Headset
- **Price / Sale / Stock (Demo):** 5,290 / 4,590 / 9
- **Short Description:** หูฟังไร้สายน้ำหนักเบา ไฟ RGB ด้านข้าง ไมค์ถอดได้ ใส่สบายสำหรับเล่นนาน
- **Description:** หูฟังเกมมิ่งไร้สายที่ออกแบบให้น้ำหนักเบาและใส่สบาย มีไฟ RGB ด้านหน้าและไมโครโฟนที่ถอดได้ รองรับการปรับเสียงไมโครโฟนด้วยเทคโนโลยี Blue VO!CE ผ่านซอฟต์แวร์ของผู้ผลิต
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | LIGHTSPEED Wireless (2.4 GHz) |
| Driver | PRO-G 40 mm |
| Microphone | ถอดได้, รองรับ Blue VO!CE |
| Lighting | LIGHTSYNC RGB |
| Weight | ประมาณ 278 g ⓥ |
| Battery | สูงสุดประมาณ 29 ชั่วโมง (ปิดไฟ) ⓥ |

### #12 Razer BlackShark V2 Pro — `GA-HS-002`

- **Brand / Category:** Razer · Gaming Headset
- **Price / Sale / Stock (Demo):** 6,990 / — / **0 (สินค้าหมด — ใช้ทดสอบ)**
- **Short Description:** หูฟังไร้สายสำหรับอีสปอร์ต ไดรเวอร์ 50 mm ไมค์ย่านความถี่กว้าง
- **Description:** หูฟังไร้สายที่ออกแบบสำหรับการแข่งขัน เน้นเสียงตำแหน่งที่ชัดเจนและไมโครโฟนที่ให้เสียงพูดใส รองรับการเชื่อมต่อไร้สายความหน่วงต่ำและ Bluetooth ใส่สบายสำหรับเล่นเป็นเวลานาน
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | Razer HyperSpeed Wireless, Bluetooth (รุ่นปี 2023) ⓥ |
| Driver | Razer TriForce Titanium 50 mm |
| Microphone | Razer HyperClear Super Wideband (ถอดได้) ⓥ |
| Audio | THX Spatial Audio |
| Battery | สูงสุดประมาณ 70 ชั่วโมง ⓥ |

### #13 SteelSeries Arctis Nova 7 — `GA-HS-003`

- **Brand / Category:** SteelSeries · Gaming Headset
- **Price / Sale / Stock (Demo):** 6,990 / — / 11
- **Short Description:** หูฟังไร้สายเชื่อมต่อ 2.4 GHz และ Bluetooth พร้อมกันได้ แบตเตอรี่ใช้งานยาว
- **Description:** หูฟังไร้สายที่เชื่อมต่อแบบ 2.4 GHz และ Bluetooth ได้พร้อมกัน จึงฟังเสียงเกมและรับสายโทรศัพท์ได้ในเวลาเดียวกัน ไมโครโฟนพับเก็บเข้าตัวหูฟังได้ รองรับเสียงรอบทิศทาง
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | 2.4 GHz + Bluetooth (ใช้พร้อมกันได้) |
| Microphone | ClearCast Gen 2 (พับเก็บได้) |
| Audio | 360° Spatial Audio |
| Charging | USB-C (รองรับชาร์จเร็ว) ⓥ |
| Battery | สูงสุดประมาณ 38 ชั่วโมง ⓥ |

### #14 HyperX Cloud III — `GA-HS-004`

- **Brand / Category:** HyperX · Gaming Headset
- **Price / Sale / Stock (Demo):** 3,490 / — / 25
- **Short Description:** หูฟังแบบสายรุ่นยอดนิยม ใส่สบาย ไมค์ถอดได้ ใช้ได้กับหลายอุปกรณ์
- **Description:** หูฟังเกมมิ่งแบบมีสายที่เน้นความสบายด้วยฟองน้ำ Memory Foam รองรับเสียงรอบทิศทาง DTS Headphone:X ไมโครโฟนถอดได้พร้อมไฟแสดงสถานะปิดเสียง ใช้ได้ทั้ง PC คอนโซล และมือถือผ่านช่องต่อหลายแบบ
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | สาย 3.5 mm, USB-C / USB-A (ผ่านอะแดปเตอร์) ⓥ |
| Driver | 53 mm (แบบเอียงมุม) ⓥ |
| Audio | DTS Headphone:X Spatial Audio |
| Microphone | ถอดได้ พร้อมไฟแสดงสถานะ Mute |
| Comfort | Memory Foam |

### #15 Logitech G Pro X 2 Lightspeed — `GA-HS-005`

- **Brand / Category:** Logitech · Gaming Headset
- **Price / Sale / Stock (Demo):** 8,990 / — / 3
- **Short Description:** หูฟังไร้สายระดับโปร ไดรเวอร์กราฟีน 50 mm เชื่อมต่อได้ 3 แบบ
- **Description:** หูฟังเกมมิ่งระดับสูงสำหรับสายแข่งขัน ใช้ไดรเวอร์ที่มีส่วนประกอบของกราฟีนเพื่อเสียงที่ชัดและแม่นยำ เชื่อมต่อได้ทั้งไร้สาย LIGHTSPEED, Bluetooth และสาย 3.5 mm ไมโครโฟนถอดได้
- **Specifications:**

| Key | Value |
|---|---|
| Connectivity | LIGHTSPEED Wireless, Bluetooth, 3.5 mm |
| Driver | PRO-G GRAPHENE 50 mm |
| Audio | DTS Headphone:X 2.0 ⓥ |
| Microphone | ถอดได้, รองรับ Blue VO!CE (ผ่าน G HUB) |
| Battery | สูงสุดประมาณ 50 ชั่วโมงขึ้นไป ⓥ |

### #16 Razer Iskur V2 — `GA-CH-001`

- **Brand / Category:** Razer · Gaming Chair
- **Price / Sale / Stock (Demo):** 19,900 / — / 3
- **Short Description:** เก้าอี้เกมมิ่งพร้อมระบบรองรับหลังส่วนล่างที่ปรับตามสรีระ
- **Description:** เก้าอี้เกมมิ่งที่ออกแบบโดยเน้นการรองรับหลังส่วนล่าง มีพนักพิงที่ปรับตามการเคลื่อนไหวของผู้นั่ง ที่วางแขนปรับได้หลายทิศทาง ปรับเอนได้ และมีหมอนรองศีรษะ เหมาะกับการนั่งเล่นเกมหรือทำงานเป็นเวลานาน
- **Specifications:**

| Key | Value |
|---|---|
| Lumbar Support | ระบบรองรับหลังส่วนล่างแบบปรับตามสรีระ (Built-in) ⓥ |
| Armrests | ปรับได้หลายทิศทาง ⓥ |
| Recline | ปรับเอนได้ ⓥ |
| Upholstery | หนังสังเคราะห์ หรือ ผ้า (ตามรุ่น) ⓥ |
| Head Cushion | มี |

### #17 Secretlab TITAN Evo — `GA-CH-002`

- **Brand / Category:** Secretlab · Gaming Chair
- **Price / Sale / Stock (Demo):** 19,900 / — / 2
- **Short Description:** เก้าอี้เกมมิ่งมีหลายขนาด พร้อมระบบรองรับหลังปรับได้ในตัวและหมอนรองศีรษะแม่เหล็ก
- **Description:** เก้าอี้เกมมิ่งที่มีให้เลือกหลายขนาดตามรูปร่างผู้ใช้ มีระบบรองรับหลังส่วนล่างที่ปรับได้ในตัวพนักพิง หมอนรองศีรษะแบบแม่เหล็ก และที่วางแขนที่ปรับได้หลายทิศทาง เหมาะกับการนั่งเป็นเวลานาน
- **Specifications:**

| Key | Value |
|---|---|
| Sizes | S / R / XL |
| Lumbar Support | ระบบปรับในตัว 4 ทิศทาง ⓥ |
| Head Pillow | Memory Foam แบบแม่เหล็ก |
| Armrests | 4D (แม่เหล็ก) ⓥ |
| Foam | Cold-cure Foam ⓥ |
| Upholstery | ผ้า SoftWeave Plus หรือ หนังสังเคราะห์ (ตามรุ่น) ⓥ |

### #18 Logitech G923 Racing Wheel — `GA-RW-001`

- **Brand / Category:** Logitech · Racing Wheel
- **Price / Sale / Stock (Demo):** 12,900 / 10,900 / 5
- **Short Description:** พวงมาลัยเกมแข่งรถพร้อมแป้นเหยียบ มีระบบ Force Feedback TRUEFORCE
- **Description:** ชุดพวงมาลัยและแป้นเหยียบสำหรับเกมแข่งรถ ใช้ระบบ Force Feedback ที่ส่งแรงสะท้อนตามสภาพถนนและเครื่องยนต์ในเกมที่รองรับ แป้นเบรกให้ความรู้สึกใกล้เคียงรถจริง มีรุ่นสำหรับ PlayStation/PC และ Xbox/PC
- **Specifications:**

| Key | Value |
|---|---|
| Force Feedback | TRUEFORCE |
| Rotation | 900° |
| Pedals | ชุดแป้นเหยียบ 3 แป้น (รวมในกล่อง) ⓥ |
| Platform | PlayStation / PC หรือ Xbox / PC (แยกรุ่น) |
| Features | Dual Clutch Launch Control ⓥ |

### #19 Razer Strider Chroma — `GA-MP-001`

- **Brand / Category:** Razer · Mouse Pad
- **Price / Sale / Stock (Demo):** 3,290 / — / 14
- **Short Description:** แผ่นรองเมาส์ไฮบริดขนาดใหญ่ ผิวลื่นแต่ควบคุมง่าย มีไฟ Chroma RGB
- **Description:** แผ่นรองเมาส์แบบไฮบริดที่ผสานผิวหน้าความเร็วสูงเข้ากับฐานนุ่มที่ม้วนเก็บได้ ขนาดใหญ่คลุมทั้งคีย์บอร์ดและเมาส์ ขอบเย็บกันลุ่ย ผิวหน้ากันน้ำ และมีแถบไฟ RGB รอบขอบ
- **Specifications:**

| Key | Value |
|---|---|
| Surface | Hybrid (ผิวหน้าความเร็ว + ฐานนุ่ม) |
| Size | ขนาดใหญ่ (ประมาณ 900 × 370 mm) ⓥ |
| Lighting | Razer Chroma RGB |
| Features | กันน้ำ, ขอบเย็บกันลุ่ย ⓥ |
| Connectivity | USB (สำหรับไฟ) |

### #20 Elgato Stream Deck MK.2 — `GA-ST-001`

- **Brand / Category:** Elgato · Streaming Equipment
- **Price / Sale / Stock (Demo):** 5,490 / — / 8
- **Short Description:** แผงควบคุมไลฟ์สตรีม 15 ปุ่มจอ LCD ตั้งค่าคำสั่งได้ไม่จำกัด
- **Description:** อุปกรณ์ควบคุมสำหรับสตรีมเมอร์และนักสร้างคอนเทนต์ มีปุ่ม LCD 15 ปุ่มที่แสดงไอคอนได้ ใช้สั่งงานโปรแกรมไลฟ์ สลับฉาก เปิดเสียง หรือทำงานลัดต่าง ๆ ผ่านซอฟต์แวร์และปลั๊กอิน
- **Specifications:**

| Key | Value |
|---|---|
| Keys | 15 ปุ่ม LCD ตั้งค่าได้ |
| Connectivity | USB-C (สายถอดได้) ⓥ |
| Faceplate | เปลี่ยนหน้ากากได้ |
| Stand | ขาตั้งถอดได้ |
| Software | Stream Deck (Windows / macOS) + Plugins |

---

## 5. ตัวอย่างโครงสร้างข้อมูลสำหรับ Seed (JSON)

> ใช้เป็นแม่แบบเขียน `seed_demo.sql` (DATABASE_DESIGN หัวข้อ 12) — `brand_id`/`category_id` ให้ค้นจาก `slug` ตอน Insert

```json
{
  "sku": "GA-MS-001",
  "name": "Razer DeathAdder V3 Pro",
  "slug": "razer-deathadder-v3-pro",
  "brand_slug": "razer",
  "category_slug": "gaming-mouse",
  "short_description": "เมาส์ไร้สายทรงจับถนัดขวาน้ำหนักเบา เหมาะกับเกม FPS ที่ต้องการความแม่นยำ",
  "description": "เมาส์เกมมิ่งไร้สายทรง Ergonomic สำหรับมือขวา ...",
  "specifications": {
    "Connectivity": "Razer HyperSpeed Wireless (2.4 GHz), USB-C (สาย)",
    "Sensor": "Razer Focus Pro 30K Optical",
    "Shape": "Ergonomic (ถนัดขวา)",
    "Weight": "ประมาณ 63 g",
    "Switches": "Razer Optical Mouse Switches Gen-3",
    "Battery": "สูงสุดประมาณ 90 ชั่วโมง"
  },
  "price": 5490.00,
  "sale_price": 4990.00,
  "stock_quantity": 12,
  "low_stock_threshold": 5,
  "status": "active",
  "is_featured": true,
  "is_demo": true,
  "images": [
    { "image_url": "/images/products/placeholder-ga-ms-001.webp", "alt_text": "Razer DeathAdder V3 Pro", "is_primary": true, "sort_order": 0 }
  ]
}
```

**slug ของสินค้าทั้ง 20 รายการ:** สร้างจากชื่อสินค้าเป็นตัวพิมพ์เล็ก แทนช่องว่างด้วย `-` และตัดอักขระพิเศษ เช่น `logitech-g-pro-x-superlight-2`, `elgato-stream-deck-mk-2`, `secretlab-titan-evo`

---

## 6. Demo Data อื่นที่เอกสารชุดนี้อ้างถึง

> ทุกรายการเป็น **ข้อมูลตัวอย่าง** (`is_demo = true`) ใช้แทนข้อมูลที่ขาดหาย (M02, M04, M08, M10) — **ค่า M02–M05, M09 ได้รับอนุมัติให้ใช้แล้ว (D-05)** · ต้องแทนที่เมื่อได้ข้อมูลจริง

### 6.1 บริการ (`services`) — M02

| name | price (Demo) | duration_minutes | description |
|---|---:|---:|---|
| บริการประกอบคอมพิวเตอร์ (Demo) | 500.00 | 120 | ประกอบเครื่องจากอุปกรณ์ที่ลูกค้าเตรียมมา |
| บริการตรวจเช็กอุปกรณ์เกมมิ่ง (Demo) | 200.00 | 60 | ตรวจสอบการทำงานเมาส์ คีย์บอร์ด หูฟัง |
| บริการติดตั้งและตั้งค่าซอฟต์แวร์อุปกรณ์ (Demo) | 300.00 | 60 | ติดตั้งไดรเวอร์/ซอฟต์แวร์และตั้งค่าเบื้องต้น |

### 6.2 ของรางวัล (`rewards`) — M10

> Rev.1: ของรางวัลทั้งหมดเป็น **ของที่จับต้องได้** (D-06) — ยกเลิก "คูปองส่วนลด 100 บาท (Demo)" เพราะระบบแลกรางวัลไม่มีขั้นตอนออกคูปอง (R-17)

| name | points_required | stock_quantity |
|---|---:|---:|
| สติกเกอร์ GEARAWAI (Demo) | 20 | 100 |
| พวงกุญแจ GEARAWAI (Demo) | 50 | 50 |
| แก้วน้ำ GEARAWAI (Demo) | 100 | 30 |
| แผ่นรองเมาส์ขนาดเล็กลาย GEARAWAI (Demo) | 300 | 10 |

### 6.3 คูปอง (`coupons`) — M04

| code | name | type | discount | เงื่อนไข |
|---|---|---|---|---|
| `WELCOME10` | ส่วนลดสมาชิกใหม่ (Demo) | general | 10% สูงสุด 300 บาท | ขั้นต่ำ 1,000 บาท, ใช้ได้ 1 ครั้ง/คน |
| *(ไม่มี — รหัสอยู่ที่ member_coupons)* | สิทธิพิเศษวันเกิด (Demo) | birthday | 10% สูงสุด 500 บาท | ใช้ได้ในเดือนเกิด (เวลาไทย), 1 ครั้ง/ปี, หมดอายุต้นเดือนถัดไป |

> ยอดขั้นต่ำของคูปองเทียบกับยอดสินค้า **ก่อนหักคูปอง** (D-04) · ใช้ได้ 1 ใบต่อคำสั่งซื้อ (D-03)

### 6.4 โปรโมชั่น (`promotions`)

| name | discount | ช่วงเวลา | สินค้าที่เข้าร่วม | show_on_homepage |
|---|---|---|---|:---:|
| Headset Week (Demo) | 10% | กำหนดตอน Seed ให้ครอบคลุมวันที่ทดสอบ | #13, #14 | ✅ |

> ตัวอย่างการคำนวณ `effective_price` ตาม SYSTEM_ANALYSIS 6.2: #14 HyperX Cloud III ราคา 3,490 → โปรโมชั่น 10% = 3,141.00 → `effective_price = 3,141.00` · #11 G733 ไม่อยู่ในโปรโมชั่น → ใช้ `sale_price` 4,590
> ⚠️ เมื่อโปรโมชั่นนี้ Active ผลการกรองราคาในหัวข้อ 3.1 จะเปลี่ยน (#14 ยังอยู่ในช่วง 3,000–4,000) — ให้ทดสอบ Filter ก่อนเปิดโปรโมชั่น หรือปรับ Expected Result ตามนั้น

### 6.5 ทีมงาน (`team_members`) — M08

| full_name | position | description |
|---|---|---|
| Team Member 1 (Demo) | Project Manager | วางแผนและติดตามงาน |
| Team Member 2 (Demo) | Frontend Developer | พัฒนาหน้าเว็บไซต์ |
| Team Member 3 (Demo) | Backend / Database | ออกแบบฐานข้อมูลและระบบหลังบ้าน |
| Team Member 4 (Demo) | UI/UX Designer | ออกแบบหน้าตาและประสบการณ์ใช้งาน |

### 6.6 ค่าตั้งต้นของ `site_settings` (อนุมัติ D-05)

| key | ค่า |
|---|---|
| `shipping_rule` | ค่าส่ง 50 บาท · ส่งฟรีเมื่อยอดสินค้า (ก่อนหักคูปอง) ≥ 1,000 บาท |
| `points_rule` | 100 บาท = 1 คะแนน · ได้เมื่อ `completed` · คิดจาก (ยอดสินค้า − ส่วนลด) ไม่รวมค่าส่ง |
| `booking_rule` | 10:00 / 13:00 / 15:00 · 1 คิวต่อช่วง · จองล่วงหน้าได้ 30 วัน · ไม่มีวันปิด |
| `birthday_rule` | ผูกกับคูปองแม่แบบวันเกิด · ใช้ได้ทั้งเดือนเกิด |

### 6.7 บัญชีทดสอบ (สร้างผ่าน Supabase Auth — ห้ามใช้อีเมลจริงของบุคคลอื่น)

| Role | อีเมล (ตัวอย่าง) | หมายเหตุ |
|---|---|---|
| Member | `member.demo@example.com` | รหัสผ่านตั้งเองตอนสร้าง — **ไม่บันทึกรหัสผ่านลงเอกสารหรือ Git** |
| Member (วันเกิดเดือนปัจจุบัน) | `birthday.demo@example.com` | ใช้ทดสอบ S11 |
| Admin | `admin.demo@example.com` | เปลี่ยน `role = 'admin'` ด้วย SQL หลังสมัคร |

> ชุดทดสอบ SQL (`GEARAWAI_DB_TESTS.sql`) ใช้ข้อมูลของตัวเองใน `01_seed_test.sql` (สินค้า 11 รายการ + ผู้ใช้ทดสอบ 5 บัญชี) — ไม่ใช่ Seed สำหรับเว็บไซต์จริง
