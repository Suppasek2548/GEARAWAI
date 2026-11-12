import { z } from "zod";

/** Shipping address (D-24) — manual text fields only; limits mirror the member_addresses CHECKs. */
const text = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `กรุณากรอก${label}`)
    .min(min, `${label}ต้องมีอย่างน้อย ${min} ตัวอักษร`)
    .max(max, `${label}ต้องไม่เกิน ${max} ตัวอักษร`);

export const addressSchema = z.object({
  fullName: text("ชื่อ-นามสกุล", 2, 100),
  phone: z
    .string()
    .trim()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์")
    .regex(/^[0-9+ -]{9,15}$/, "เบอร์โทรศัพท์ไม่ถูกต้อง (ตัวเลข 9–15 หลัก)"),
  addressLine: text("ที่อยู่", 5, 300),
  subdistrict: text("ตำบล / แขวง", 1, 100),
  district: text("อำเภอ / เขต", 1, 100),
  postalCode: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัสไปรษณีย์")
    .regex(/^[0-9]{5}$/, "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก"),
  province: text("จังหวัด", 1, 100),
});

export type AddressInput = z.infer<typeof addressSchema>;

/** Most addresses one member may keep. */
export const MAX_ADDRESSES = 10;
