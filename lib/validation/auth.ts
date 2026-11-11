import { z } from "zod";
import { thTodayISO } from "@/lib/utils/format";

// UI_UX_DESIGN §10.2 — validation rules and Thai messages
const email = z.string().trim().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง").max(254);

export const passwordRule = z
  .string()
  .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข")
  .max(72, "รหัสผ่านยาวเกินไป")
  .regex(/[A-Za-z]/, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข")
  .regex(/[0-9]/, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข");

/** Birth date is optional (D-08). If given: YYYY-MM-DD, after 1900, not in the future (Thai time). */
const birthDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine(
    (v) => {
      if (!v) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
      const d = new Date(`${v}T00:00:00Z`);
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return false;
      return v > "1900-01-01" && v <= thTodayISO();
    },
    { message: "วันเกิดไม่ถูกต้อง" },
  );

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "กรุณากรอกชื่อ-นามสกุล")
      .min(2, "ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร")
      .max(100, "ชื่อ-นามสกุลยาวเกิน 100 ตัวอักษร"),
    email,
    password: passwordRule,
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
    birthDate,
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "รหัสผ่านไม่ตรงกัน",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
