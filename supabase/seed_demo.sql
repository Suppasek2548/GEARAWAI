-- =====================================================================
-- GEARAWAI — Demo Data (seed_demo.sql)
-- Source: docs/GEARAWAI_PRODUCT_DATA.md §1–§6 and docs/GEARAWAI_DATABASE_DESIGN.md §4.24 (values approved in D-05)
-- ALL rows are DEMO DATA (is_demo = true). Prices/stock are simulated — not real Thai market prices.
-- Run AFTER migrations, as the project owner (SQL Editor or psql). Re-running is safe (skips existing rows).
-- Test accounts are NOT created here — sign up through the website (PRODUCT_DATA §6.7).
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1. Categories (PRODUCT_DATA §1)
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, sort_order, is_demo) values
  ('Gaming Mouse',         'gaming-mouse',         1, true),
  ('Gaming Keyboard',      'gaming-keyboard',      2, true),
  ('Gaming Headset',       'gaming-headset',       3, true),
  ('Mouse Pad',            'mouse-pad',            4, true),
  ('Gaming Chair',         'gaming-chair',         5, true),
  ('Racing Wheel',         'racing-wheel',         6, true),
  ('Streaming Equipment',  'streaming-equipment',  7, true),
  ('Computer Accessories', 'computer-accessories', 8, true)   -- 0 products (M16) — shows Empty State
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Brands (PRODUCT_DATA §2)
-- ---------------------------------------------------------------------
insert into public.brands (name, slug, is_demo) values
  ('Razer', 'razer', true), ('Logitech', 'logitech', true), ('SteelSeries', 'steelseries', true),
  ('HyperX', 'hyperx', true), ('Keychron', 'keychron', true), ('Secretlab', 'secretlab', true),
  ('Elgato', 'elgato', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 3. Products — 20 items (PRODUCT_DATA §3–§4) · stock_movements('initial') is written by trigger
-- ---------------------------------------------------------------------
with src (sku, name, slug, brand_slug, category_slug, short_description, description, specifications,
          price, sale_price, stock_quantity, is_featured) as (values
  ('GA-MS-001', 'Razer DeathAdder V3 Pro', 'razer-deathadder-v3-pro', 'razer', 'gaming-mouse',
   'เมาส์ไร้สายทรงจับถนัดขวาน้ำหนักเบา เหมาะกับเกม FPS ที่ต้องการความแม่นยำ',
   'เมาส์เกมมิ่งไร้สายทรง Ergonomic สำหรับมือขวา ออกแบบให้น้ำหนักเบาแต่จับได้มั่นคง ใช้เซนเซอร์ออปติคอลความละเอียดสูงและสวิตช์ออปติคอลที่ตอบสนองเร็ว เหมาะกับผู้เล่นสาย Competitive ที่ต้องการเมาส์สำหรับเล่นต่อเนื่องเป็นเวลานาน',
   '{"Connectivity":"Razer HyperSpeed Wireless (2.4 GHz), USB-C (สาย)","Sensor":"Razer Focus Pro 30K Optical","Shape":"Ergonomic (ถนัดขวา)","Weight":"ประมาณ 63 g","Switches":"Razer Optical Mouse Switches Gen-3","Battery":"สูงสุดประมาณ 90 ชั่วโมง"}',
   5490.00, 4990.00, 12, true),
  ('GA-MS-002', 'Logitech G Pro X Superlight 2', 'logitech-g-pro-x-superlight-2', 'logitech', 'gaming-mouse',
   'เมาส์ไร้สายทรงสมมาตรน้ำหนักเบามาก ออกแบบสำหรับนักกีฬาอีสปอร์ต',
   'เมาส์ไร้สายทรงสมมาตรที่เน้นน้ำหนักเบาเป็นพิเศษ ใช้การเชื่อมต่อไร้สาย LIGHTSPEED ที่มีความหน่วงต่ำ และสวิตช์แบบไฮบริด เหมาะกับผู้เล่นที่ใช้การจับแบบ Claw หรือ Fingertip และต้องการเมาส์ที่ขยับได้คล่องตัว',
   '{"Connectivity":"LIGHTSPEED Wireless, USB-C (ชาร์จ/สาย)","Sensor":"HERO 2","Shape":"Symmetrical","Weight":"ประมาณ 60 g","Switches":"LIGHTFORCE Hybrid Optical-Mechanical","Battery":"สูงสุดประมาณ 95 ชั่วโมง"}',
   5290.00, null, 15, true),
  ('GA-MS-003', 'Logitech G502 X Plus', 'logitech-g502-x-plus', 'logitech', 'gaming-mouse',
   'เมาส์ไร้สายรุ่นยอดนิยมที่มีปุ่มมากและไฟ RGB เหมาะทั้งเกมและงานทั่วไป',
   'เมาส์ไร้สายตระกูล G502 ที่มีปุ่มตั้งค่าได้จำนวนมาก เหมาะกับเกม MMO/MOBA และการตั้ง Macro สำหรับงานทั่วไป มาพร้อมไฟ LIGHTSYNC RGB และล้อเลื่อนที่สลับโหมดได้',
   '{"Connectivity":"LIGHTSPEED Wireless, USB-C","Sensor":"HERO 25K","Shape":"Ergonomic (ถนัดขวา)","Weight":"ประมาณ 106 g","Switches":"LIGHTFORCE Hybrid Optical-Mechanical","Programmable Controls":"13 ปุ่ม","Lighting":"LIGHTSYNC RGB"}',
   5690.00, null, 8, false),
  ('GA-MS-004', 'Razer Viper V3 Pro', 'razer-viper-v3-pro', 'razer', 'gaming-mouse',
   'เมาส์ไร้สายทรงสมมาตรน้ำหนักเบา รองรับ Polling Rate สูง สำหรับการแข่งขัน',
   'เมาส์ไร้สายทรงสมมาตรสำหรับสายแข่งขัน เน้นน้ำหนักเบาและการตอบสนองที่รวดเร็ว รองรับ Polling Rate สูงเมื่อใช้กับตัวรับสัญญาณที่รองรับ เหมาะกับเกม FPS ที่ต้องเล็งเร็ว',
   '{"Connectivity":"Razer HyperSpeed Wireless, USB-C","Sensor":"Razer Focus Pro 35K Optical Gen-2","Polling Rate":"สูงสุด 8000 Hz (เมื่อใช้ตัวรับสัญญาณที่รองรับ)","Shape":"Symmetrical","Weight":"ประมาณ 54 g","Battery":"สูงสุดประมาณ 95 ชั่วโมง"}',
   5990.00, null, 6, true),
  ('GA-MS-005', 'SteelSeries Aerox 3 Wireless', 'steelseries-aerox-3-wireless', 'steelseries', 'gaming-mouse',
   'เมาส์ไร้สายเชลล์รังผึ้งน้ำหนักเบา เชื่อมต่อได้ทั้ง 2.4 GHz และ Bluetooth',
   'เมาส์ไร้สายดีไซน์เชลล์รูพรุนเพื่อลดน้ำหนัก เชื่อมต่อได้สองแบบ ใช้ 2.4 GHz สำหรับเล่นเกม และ Bluetooth สำหรับงานทั่วไป มีการป้องกันฝุ่นและน้ำระดับหนึ่ง เหมาะเป็นเมาส์ไร้สายรุ่นเริ่มต้นที่คุ้มค่า',
   '{"Connectivity":"Quantum 2.0 Wireless (2.4 GHz), Bluetooth, USB-C","Sensor":"TrueMove Air","Shape":"Ergonomic (ถนัดขวา) ทรงเล็ก","Weight":"ประมาณ 66–68 g (ขึ้นกับรุ่นปีผลิต)","Protection":"IP54 (กันฝุ่น/กันละอองน้ำ)","Battery":"สูงสุดประมาณ 200 ชั่วโมง (โหมด Bluetooth)"}',
   3290.00, 2790.00, 20, false),
  ('GA-KB-001', 'Razer BlackWidow V4', 'razer-blackwidow-v4', 'razer', 'gaming-keyboard',
   'คีย์บอร์ดเมคานิคอลขนาดเต็ม มีปุ่ม Macro และปุ่มควบคุมมีเดีย พร้อมไฟ Chroma RGB',
   'คีย์บอร์ดเมคานิคอลขนาดเต็ม (Full-size) สำหรับเกมเมอร์ที่ต้องการปุ่มลัดและ Macro เพิ่มเติม มีปุ่มควบคุมมีเดียและวงล้อปรับค่า พร้อมที่พักข้อมือ และไฟ Razer Chroma RGB ที่ปรับแต่งได้',
   '{"Layout":"Full-size","Switches":"Razer Mechanical Switches (Green — Clicky / Yellow — Linear ตามรุ่น)","Macro Keys":"6 ปุ่มเฉพาะ","Media Controls":"ปุ่มมีเดีย + วงล้ออเนกประสงค์","Lighting":"Razer Chroma RGB","Connectivity":"USB (สาย)","Accessory":"ที่พักข้อมือ"}',
   6490.00, null, 7, false),
  ('GA-KB-002', 'Logitech G Pro X TKL', 'logitech-g-pro-x-tkl', 'logitech', 'gaming-keyboard',
   'คีย์บอร์ดไร้สายขนาด TKL สำหรับอีสปอร์ต เชื่อมต่อได้หลายช่องทาง',
   'คีย์บอร์ดเมคานิคอลขนาด Tenkeyless ตัดแป้นตัวเลขออกเพื่อเพิ่มพื้นที่ขยับเมาส์ รองรับการเชื่อมต่อไร้สาย LIGHTSPEED, Bluetooth และสาย USB-C เลือกสวิตช์ได้หลายแบบ เหมาะกับการพกไปแข่งขัน',
   '{"Layout":"Tenkeyless (TKL)","Switches":"GX Switches (Tactile / Linear / Clicky ตามรุ่น)","Connectivity":"LIGHTSPEED Wireless, Bluetooth, USB-C","Lighting":"LIGHTSYNC RGB","Battery":"สูงสุดประมาณ 50 ชั่วโมง"}',
   7490.00, null, 5, true),
  ('GA-KB-003', 'HyperX Alloy Origins', 'hyperx-alloy-origins', 'hyperx', 'gaming-keyboard',
   'คีย์บอร์ดเมคานิคอลบอดี้อะลูมิเนียม ไฟ RGB รายปุ่ม สาย USB-C ถอดได้',
   'คีย์บอร์ดเมคานิคอลขนาดเต็มที่มีโครงอะลูมิเนียมแข็งแรง ใช้สวิตช์ของ HyperX เอง ไฟ RGB แยกรายปุ่ม และสาย USB-C ถอดได้ เหมาะกับผู้ที่ต้องการคีย์บอร์ดเมคานิคอลคุณภาพดีในราคาระดับกลาง',
   '{"Layout":"Full-size","Switches":"HyperX Mechanical (Red / Aqua / Blue ตามรุ่น)","Body":"อะลูมิเนียม","Lighting":"RGB รายปุ่ม","Connectivity":"USB-C (สายถอดได้)","Adjustable Feet":"ปรับความชันได้ 3 ระดับ"}',
   3690.00, 3190.00, 18, false),
  ('GA-KB-004', 'SteelSeries Apex Pro TKL', 'steelseries-apex-pro-tkl', 'steelseries', 'gaming-keyboard',
   'คีย์บอร์ด TKL ที่ปรับระยะกดของสวิตช์ได้ พร้อมจอ OLED และ Rapid Trigger',
   'คีย์บอร์ดขนาด TKL ที่ใช้สวิตช์แบบปรับระยะ Actuation ได้รายปุ่ม ทำให้ตั้งค่าให้ไวมากสำหรับเกมหรือลึกขึ้นสำหรับการพิมพ์ มีจอ OLED ขนาดเล็กแสดงข้อมูลและโปรไฟล์ เหมาะกับผู้เล่นที่ชอบปรับแต่งละเอียด',
   '{"Layout":"Tenkeyless (TKL)","Switches":"OmniPoint Adjustable (Hall Effect) — ปรับระยะ Actuation ได้","Features":"Rapid Trigger (รุ่นปี 2023 ขึ้นไป)","Display":"OLED Smart Display","Connectivity":"USB (สาย) — มีรุ่นไร้สายแยก","Accessory":"ที่พักข้อมือแม่เหล็ก"}',
   7990.00, null, 4, false),
  ('GA-KB-005', 'Keychron K8 Pro', 'keychron-k8-pro', 'keychron', 'gaming-keyboard',
   'คีย์บอร์ด TKL ไร้สาย รองรับ QMK/VIA และเปลี่ยนสวิตช์ได้ (Hot-swap) ใช้ได้ทั้ง Mac และ Windows',
   'คีย์บอร์ดเมคานิคอลขนาด TKL ที่เน้นการปรับแต่ง รองรับเฟิร์มแวร์ QMK และโปรแกรม VIA สำหรับ Remap ปุ่ม เปลี่ยนสวิตช์ได้โดยไม่ต้องบัดกรี เชื่อมต่อผ่าน Bluetooth หรือสาย และมีปุ่มสำหรับทั้ง macOS และ Windows',
   '{"Layout":"Tenkeyless (87 keys)","Firmware":"QMK / VIA","Hot-swappable":"รองรับ","Switches":"Gateron G Pro (ตามรุ่น)","Connectivity":"Bluetooth 5.1, USB-C","OS":"macOS / Windows","Battery":"4000 mAh"}',
   3990.00, null, 10, false),
  ('GA-HS-001', 'Logitech G733 Lightspeed', 'logitech-g733-lightspeed', 'logitech', 'gaming-headset',
   'หูฟังไร้สายน้ำหนักเบา ไฟ RGB ด้านข้าง ไมค์ถอดได้ ใส่สบายสำหรับเล่นนาน',
   'หูฟังเกมมิ่งไร้สายที่ออกแบบให้น้ำหนักเบาและใส่สบาย มีไฟ RGB ด้านหน้าและไมโครโฟนที่ถอดได้ รองรับการปรับเสียงไมโครโฟนด้วยเทคโนโลยี Blue VO!CE ผ่านซอฟต์แวร์ของผู้ผลิต',
   '{"Connectivity":"LIGHTSPEED Wireless (2.4 GHz)","Driver":"PRO-G 40 mm","Microphone":"ถอดได้, รองรับ Blue VO!CE","Lighting":"LIGHTSYNC RGB","Weight":"ประมาณ 278 g","Battery":"สูงสุดประมาณ 29 ชั่วโมง (ปิดไฟ)"}',
   5290.00, 4590.00, 9, false),
  ('GA-HS-002', 'Razer BlackShark V2 Pro', 'razer-blackshark-v2-pro', 'razer', 'gaming-headset',
   'หูฟังไร้สายสำหรับอีสปอร์ต ไดรเวอร์ 50 mm ไมค์ย่านความถี่กว้าง',
   'หูฟังไร้สายที่ออกแบบสำหรับการแข่งขัน เน้นเสียงตำแหน่งที่ชัดเจนและไมโครโฟนที่ให้เสียงพูดใส รองรับการเชื่อมต่อไร้สายความหน่วงต่ำและ Bluetooth ใส่สบายสำหรับเล่นเป็นเวลานาน',
   '{"Connectivity":"Razer HyperSpeed Wireless, Bluetooth (รุ่นปี 2023)","Driver":"Razer TriForce Titanium 50 mm","Microphone":"Razer HyperClear Super Wideband (ถอดได้)","Audio":"THX Spatial Audio","Battery":"สูงสุดประมาณ 70 ชั่วโมง"}',
   6990.00, null, 0, false),   -- out of stock on purpose (test case)
  ('GA-HS-003', 'SteelSeries Arctis Nova 7', 'steelseries-arctis-nova-7', 'steelseries', 'gaming-headset',
   'หูฟังไร้สายเชื่อมต่อ 2.4 GHz และ Bluetooth พร้อมกันได้ แบตเตอรี่ใช้งานยาว',
   'หูฟังไร้สายที่เชื่อมต่อแบบ 2.4 GHz และ Bluetooth ได้พร้อมกัน จึงฟังเสียงเกมและรับสายโทรศัพท์ได้ในเวลาเดียวกัน ไมโครโฟนพับเก็บเข้าตัวหูฟังได้ รองรับเสียงรอบทิศทาง',
   '{"Connectivity":"2.4 GHz + Bluetooth (ใช้พร้อมกันได้)","Microphone":"ClearCast Gen 2 (พับเก็บได้)","Audio":"360° Spatial Audio","Charging":"USB-C (รองรับชาร์จเร็ว)","Battery":"สูงสุดประมาณ 38 ชั่วโมง"}',
   6990.00, null, 11, true),
  ('GA-HS-004', 'HyperX Cloud III', 'hyperx-cloud-iii', 'hyperx', 'gaming-headset',
   'หูฟังแบบสายรุ่นยอดนิยม ใส่สบาย ไมค์ถอดได้ ใช้ได้กับหลายอุปกรณ์',
   'หูฟังเกมมิ่งแบบมีสายที่เน้นความสบายด้วยฟองน้ำ Memory Foam รองรับเสียงรอบทิศทาง DTS Headphone:X ไมโครโฟนถอดได้พร้อมไฟแสดงสถานะปิดเสียง ใช้ได้ทั้ง PC คอนโซล และมือถือผ่านช่องต่อหลายแบบ',
   '{"Connectivity":"สาย 3.5 mm, USB-C / USB-A (ผ่านอะแดปเตอร์)","Driver":"53 mm (แบบเอียงมุม)","Audio":"DTS Headphone:X Spatial Audio","Microphone":"ถอดได้ พร้อมไฟแสดงสถานะ Mute","Comfort":"Memory Foam"}',
   3490.00, null, 25, false),
  ('GA-HS-005', 'Logitech G Pro X 2 Lightspeed', 'logitech-g-pro-x-2-lightspeed', 'logitech', 'gaming-headset',
   'หูฟังไร้สายระดับโปร ไดรเวอร์กราฟีน 50 mm เชื่อมต่อได้ 3 แบบ',
   'หูฟังเกมมิ่งระดับสูงสำหรับสายแข่งขัน ใช้ไดรเวอร์ที่มีส่วนประกอบของกราฟีนเพื่อเสียงที่ชัดและแม่นยำ เชื่อมต่อได้ทั้งไร้สาย LIGHTSPEED, Bluetooth และสาย 3.5 mm ไมโครโฟนถอดได้',
   '{"Connectivity":"LIGHTSPEED Wireless, Bluetooth, 3.5 mm","Driver":"PRO-G GRAPHENE 50 mm","Audio":"DTS Headphone:X 2.0","Microphone":"ถอดได้, รองรับ Blue VO!CE (ผ่าน G HUB)","Battery":"สูงสุดประมาณ 50 ชั่วโมงขึ้นไป"}',
   8990.00, null, 3, false),
  ('GA-CH-001', 'Razer Iskur V2', 'razer-iskur-v2', 'razer', 'gaming-chair',
   'เก้าอี้เกมมิ่งพร้อมระบบรองรับหลังส่วนล่างที่ปรับตามสรีระ',
   'เก้าอี้เกมมิ่งที่ออกแบบโดยเน้นการรองรับหลังส่วนล่าง มีพนักพิงที่ปรับตามการเคลื่อนไหวของผู้นั่ง ที่วางแขนปรับได้หลายทิศทาง ปรับเอนได้ และมีหมอนรองศีรษะ เหมาะกับการนั่งเล่นเกมหรือทำงานเป็นเวลานาน',
   '{"Lumbar Support":"ระบบรองรับหลังส่วนล่างแบบปรับตามสรีระ (Built-in)","Armrests":"ปรับได้หลายทิศทาง","Recline":"ปรับเอนได้","Upholstery":"หนังสังเคราะห์ หรือ ผ้า (ตามรุ่น)","Head Cushion":"มี"}',
   19900.00, null, 3, false),
  ('GA-CH-002', 'Secretlab TITAN Evo', 'secretlab-titan-evo', 'secretlab', 'gaming-chair',
   'เก้าอี้เกมมิ่งมีหลายขนาด พร้อมระบบรองรับหลังปรับได้ในตัวและหมอนรองศีรษะแม่เหล็ก',
   'เก้าอี้เกมมิ่งที่มีให้เลือกหลายขนาดตามรูปร่างผู้ใช้ มีระบบรองรับหลังส่วนล่างที่ปรับได้ในตัวพนักพิง หมอนรองศีรษะแบบแม่เหล็ก และที่วางแขนที่ปรับได้หลายทิศทาง เหมาะกับการนั่งเป็นเวลานาน',
   '{"Sizes":"S / R / XL","Lumbar Support":"ระบบปรับในตัว 4 ทิศทาง","Head Pillow":"Memory Foam แบบแม่เหล็ก","Armrests":"4D (แม่เหล็ก)","Foam":"Cold-cure Foam","Upholstery":"ผ้า SoftWeave Plus หรือ หนังสังเคราะห์ (ตามรุ่น)"}',
   19900.00, null, 2, true),
  ('GA-RW-001', 'Logitech G923 Racing Wheel', 'logitech-g923-racing-wheel', 'logitech', 'racing-wheel',
   'พวงมาลัยเกมแข่งรถพร้อมแป้นเหยียบ มีระบบ Force Feedback TRUEFORCE',
   'ชุดพวงมาลัยและแป้นเหยียบสำหรับเกมแข่งรถ ใช้ระบบ Force Feedback ที่ส่งแรงสะท้อนตามสภาพถนนและเครื่องยนต์ในเกมที่รองรับ แป้นเบรกให้ความรู้สึกใกล้เคียงรถจริง มีรุ่นสำหรับ PlayStation/PC และ Xbox/PC',
   '{"Force Feedback":"TRUEFORCE","Rotation":"900°","Pedals":"ชุดแป้นเหยียบ 3 แป้น (รวมในกล่อง)","Platform":"PlayStation / PC หรือ Xbox / PC (แยกรุ่น)","Features":"Dual Clutch Launch Control"}',
   12900.00, 10900.00, 5, true),
  ('GA-MP-001', 'Razer Strider Chroma', 'razer-strider-chroma', 'razer', 'mouse-pad',
   'แผ่นรองเมาส์ไฮบริดขนาดใหญ่ ผิวลื่นแต่ควบคุมง่าย มีไฟ Chroma RGB',
   'แผ่นรองเมาส์แบบไฮบริดที่ผสานผิวหน้าความเร็วสูงเข้ากับฐานนุ่มที่ม้วนเก็บได้ ขนาดใหญ่คลุมทั้งคีย์บอร์ดและเมาส์ ขอบเย็บกันลุ่ย ผิวหน้ากันน้ำ และมีแถบไฟ RGB รอบขอบ',
   '{"Surface":"Hybrid (ผิวหน้าความเร็ว + ฐานนุ่ม)","Size":"ขนาดใหญ่ (ประมาณ 900 × 370 mm)","Lighting":"Razer Chroma RGB","Features":"กันน้ำ, ขอบเย็บกันลุ่ย","Connectivity":"USB (สำหรับไฟ)"}',
   3290.00, null, 14, false),
  ('GA-ST-001', 'Elgato Stream Deck MK.2', 'elgato-stream-deck-mk-2', 'elgato', 'streaming-equipment',
   'แผงควบคุมไลฟ์สตรีม 15 ปุ่มจอ LCD ตั้งค่าคำสั่งได้ไม่จำกัด',
   'อุปกรณ์ควบคุมสำหรับสตรีมเมอร์และนักสร้างคอนเทนต์ มีปุ่ม LCD 15 ปุ่มที่แสดงไอคอนได้ ใช้สั่งงานโปรแกรมไลฟ์ สลับฉาก เปิดเสียง หรือทำงานลัดต่าง ๆ ผ่านซอฟต์แวร์และปลั๊กอิน',
   '{"Keys":"15 ปุ่ม LCD ตั้งค่าได้","Connectivity":"USB-C (สายถอดได้)","Faceplate":"เปลี่ยนหน้ากากได้","Stand":"ขาตั้งถอดได้","Software":"Stream Deck (Windows / macOS) + Plugins"}',
   5490.00, null, 8, true)
)
insert into public.products (sku, name, slug, brand_id, category_id, short_description, description,
                             specifications, price, sale_price, stock_quantity, low_stock_threshold,
                             status, is_featured, is_demo)
select s.sku, s.name, s.slug, b.id, c.id, s.short_description, s.description,
       s.specifications::jsonb, s.price::numeric, s.sale_price::numeric, s.stock_quantity, 5,
       'active', s.is_featured, true
  from src s
  join public.brands b on b.slug = s.brand_slug
  join public.categories c on c.slug = s.category_slug
on conflict (sku) do nothing;

-- Primary image = store placeholder (PRODUCT_DATA warning #6: no manufacturer photos)
insert into public.product_images (product_id, image_url, alt_text, sort_order, is_primary)
select p.id, '/images/products/placeholder-' || lower(p.sku) || '.svg', p.name, 0, true
  from public.products p
 where p.is_demo
   and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

-- ---------------------------------------------------------------------
-- 4. Coupons (PRODUCT_DATA §6.3) — WELCOME10 + birthday template (code is per member)
-- ---------------------------------------------------------------------
insert into public.coupons (code, name, description, coupon_type, discount_type, discount_value,
                            max_discount_amount, min_order_amount, usage_limit, per_user_limit, is_active, is_demo)
values ('WELCOME10', 'ส่วนลดสมาชิกใหม่ (Demo)', 'ลด 10% สูงสุด 300 บาท เมื่อซื้อครบ 1,000 บาท ใช้ได้ 1 ครั้งต่อคน',
        'general', 'percentage', 10, 300, 1000, null, 1, true, true)
on conflict (code) do nothing;

insert into public.coupons (code, name, description, coupon_type, discount_type, discount_value,
                            max_discount_amount, min_order_amount, per_user_limit, is_active, is_demo)
select null, 'สิทธิพิเศษวันเกิด (Demo)', 'ลด 10% สูงสุด 500 บาท ใช้ได้ในเดือนเกิด (เวลาไทย) 1 ครั้งต่อปี',
       'birthday', 'percentage', 10, 500, 0, 1, true, true
 where not exists (select 1 from public.coupons where coupon_type = 'birthday');

-- ---------------------------------------------------------------------
-- 5. site_settings — 11 keys (DATABASE_DESIGN §4.24, approved D-05)
-- ---------------------------------------------------------------------
insert into public.site_settings (key, value, description, is_public) values
  ('store_info', '{"name":"GEARAWAI","slogan":"LEVEL UP YOUR GEAR","tagline":"Upgrade your setup with premium gaming gear and IT accessories."}',
   'ชื่อร้าน / Slogan / Tagline', true),
  ('hero_banner', '{"desktop_url":"","tablet_url":"","mobile_url":"","cta_label":"SHOP NOW","cta_href":"/shop"}',
   'Hero Banner หน้าแรก', true),
  ('store_contact', '{"phone":"000-000-0000","email":"contact@example.com","address":null,"map_embed_url":null,"is_sample":true}',
   'ข้อมูลติดต่อ (ข้อมูลตัวอย่าง — M07)', true),
  ('social_links', '{"facebook":null,"instagram":null,"tiktok":null,"youtube":null}',
   'ลิงก์ Social Media', true),
  ('about_content', jsonb_build_object(
     'history', 'GEARAWAI เป็นร้านค้าออนไลน์ที่จัดทำขึ้นเพื่อเป็นช่องทางในการนำเสนอและจำหน่ายอุปกรณ์ Gaming Gear และอุปกรณ์เทคโนโลยีสารสนเทศผ่านระบบพาณิชย์อิเล็กทรอนิกส์ โดยมีแนวคิดในการพัฒนาเว็บไซต์ให้ผู้ใช้งานสามารถค้นหาสินค้า ตรวจสอบราคา และศึกษารายละเอียดสินค้าได้อย่างสะดวก พร้อมนำเทคโนโลยีเว็บไซต์มาประยุกต์ใช้ในการจัดการข้อมูลสินค้าและการให้บริการลูกค้า',
     'highlights', jsonb_build_array('จัดหมวดหมู่สินค้าอย่างชัดเจน', 'มีข้อมูลสินค้าและรายละเอียดประกอบ',
                                     'ค้นหาสินค้าได้สะดวก', 'มีระบบตะกร้าสินค้า',
                                     'มีระบบหลังบ้านสำหรับจัดการสินค้าและสต็อก')),
   'เนื้อหาหน้า About (ข้อความจาก SPEC ระบบที่ 2)', true),
  ('points_rule', '{"baht_per_point":100,"earn_on_status":"completed","base":"subtotal_minus_discount"}',
   '100 บาท = 1 คะแนน · ได้เมื่อ completed · ไม่รวมค่าส่ง (D-04)', true),
  ('shipping_rule', '{"flat_fee":50,"free_shipping_min":1000}',
   'ค่าส่ง 50 บาท · ส่งฟรีเมื่อยอดสินค้าก่อนหักคูปอง ≥ 1,000 บาท', true),
  ('birthday_rule', jsonb_build_object(
     'coupon_id', (select id from public.coupons where coupon_type = 'birthday' order by created_at limit 1),
     'window', 'birth_month'),
   'ผูกกับคูปองแม่แบบวันเกิด · ใช้ได้ทั้งเดือนเกิด', true),
  ('payment_mode', '{"mode":"demo","qr_image_url":"","bank_sample":{"bank":"ธนาคารตัวอย่าง","account_name":"GEARAWAI (DEMO)","account_no":"XXX-X-XXXXX-X"}}',
   'ระบบชำระเงินจำลอง (Demo) — ไม่มีการตัดเงินจริง', true),
  ('booking_rule', '{"time_slots":["10:00","13:00","15:00"],"max_days_ahead":30,"closed_weekdays":[]}',
   'ช่วงเวลาจอง · จองล่วงหน้า 30 วัน · closed_weekdays ใช้ ISO 1=จันทร์…7=อาทิตย์', true),
  ('upload_rule', '{"max_bytes":2097152,"mime":["image/jpeg","image/png","image/webp"]}',
   'ข้อจำกัดไฟล์อัปโหลด', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 6. Services (PRODUCT_DATA §6.1 — M02)
-- ---------------------------------------------------------------------
insert into public.services (name, slug, description, price, duration_minutes, sort_order, is_demo) values
  ('บริการประกอบคอมพิวเตอร์ (Demo)', 'pc-assembly', 'ประกอบเครื่องจากอุปกรณ์ที่ลูกค้าเตรียมมา', 500.00, 120, 1, true),
  ('บริการตรวจเช็กอุปกรณ์เกมมิ่ง (Demo)', 'gear-checkup', 'ตรวจสอบการทำงานเมาส์ คีย์บอร์ด หูฟัง', 200.00, 60, 2, true),
  ('บริการติดตั้งและตั้งค่าซอฟต์แวร์อุปกรณ์ (Demo)', 'software-setup', 'ติดตั้งไดรเวอร์/ซอฟต์แวร์และตั้งค่าเบื้องต้น', 300.00, 60, 3, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 7. Rewards (PRODUCT_DATA §6.2 — physical items only, D-06)
-- ---------------------------------------------------------------------
insert into public.rewards (name, points_required, stock_quantity, sort_order, is_demo)
select v.name, v.pts, v.qty, v.ord, true
  from (values ('สติกเกอร์ GEARAWAI (Demo)', 20, 100, 1),
               ('พวงกุญแจ GEARAWAI (Demo)', 50, 50, 2),
               ('แก้วน้ำ GEARAWAI (Demo)', 100, 30, 3),
               ('แผ่นรองเมาส์ขนาดเล็กลาย GEARAWAI (Demo)', 300, 10, 4)) as v(name, pts, qty, ord)
 where not exists (select 1 from public.rewards r where r.name = v.name);

-- ---------------------------------------------------------------------
-- 8. Promotion "Headset Week (Demo)" — 10% on #13, #14 (PRODUCT_DATA §6.4)
--    Period must cover the testing dates: starts yesterday, ends in 30 days (adjust in Admin later)
-- ---------------------------------------------------------------------
insert into public.promotions (name, slug, description, discount_type, discount_value, start_at, end_at,
                               is_active, show_on_homepage, sort_order, is_demo)
values ('Headset Week (Demo)', 'headset-week', 'ลด 10% หูฟังที่ร่วมรายการ (ข้อมูลตัวอย่าง)', 'percentage', 10,
        now() - interval '1 day', now() + interval '30 days', true, true, 1, true)
on conflict (slug) do nothing;

insert into public.promotion_products (promotion_id, product_id)
select pr.id, p.id
  from public.promotions pr
  join public.products p on p.sku in ('GA-HS-003', 'GA-HS-004')
 where pr.slug = 'headset-week'
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 9. Team members (PRODUCT_DATA §6.5 — M08, no real names)
-- ---------------------------------------------------------------------
insert into public.team_members (full_name, position, description, sort_order, is_demo)
select v.n, v.p, v.d, v.o, true
  from (values ('Team Member 1 (Demo)', 'Project Manager', 'วางแผนและติดตามงาน', 1),
               ('Team Member 2 (Demo)', 'Frontend Developer', 'พัฒนาหน้าเว็บไซต์', 2),
               ('Team Member 3 (Demo)', 'Backend / Database', 'ออกแบบฐานข้อมูลและระบบหลังบ้าน', 3),
               ('Team Member 4 (Demo)', 'UI/UX Designer', 'ออกแบบหน้าตาและประสบการณ์ใช้งาน', 4)) as v(n, p, d, o)
 where not exists (select 1 from public.team_members t where t.full_name = v.n);

commit;

-- Quick check (expected: 8 categories · 7 brands · 20 products · 19 initial stock movements (GA-HS-002 starts at 0) · 11 settings)
select (select count(*) from public.categories) as categories,
       (select count(*) from public.brands) as brands,
       (select count(*) from public.products) as products,
       (select count(*) from public.stock_movements where movement_type = 'initial') as initial_stock_rows,
       (select count(*) from public.site_settings) as settings,
       (select value->>'coupon_id' is not null from public.site_settings where key = 'birthday_rule') as birthday_rule_linked;
