import { z } from "zod";

// S20-F02 — matches the contact_messages CHECK constraints (DATABASE_DESIGN §4.22)
export const contactSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100, "ชื่อยาวเกิน 100 ตัวอักษร"),
  email: z.string().trim().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง").max(254),
  subject: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(150, "หัวข้อยาวเกิน 150 ตัวอักษร"),
  message: z.string().trim().min(10, "ข้อความต้องมีอย่างน้อย 10 ตัวอักษร").max(2000, "ข้อความยาวเกิน 2,000 ตัวอักษร"),
});

export const MESSAGE_MAX = 2000;
