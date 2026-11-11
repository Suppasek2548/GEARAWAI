"use server";

import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validation/contact";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { toThaiError } from "@/lib/errors";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
  /** changes on every success so the client can reset the form */
  sentAt?: number;
};

/**
 * S20-F03 — saves through RPC submit_contact_message() (rate limited in the DB, R-14).
 * Guests and members cannot INSERT into contact_messages directly. user_id comes from auth.uid() in the RPC.
 */
export async function submitContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  // Honeypot (S20-F06): real users never see or fill this field. Pretend success, store nothing.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success", message: "ส่งข้อความเรียบร้อยแล้ว ทีมงานจะติดต่อกลับ", sentAt: Date.now() };
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_subject: parsed.data.subject,
    p_message: parsed.data.message,
  });

  if (error) {
    const text = error.message.startsWith("RATE_LIMITED") ? toThaiError(error) : "ส่งไม่สำเร็จ กรุณาลองใหม่";
    return { status: "error", message: text, values: raw };
  }
  return { status: "success", message: "ส่งข้อความเรียบร้อยแล้ว ทีมงานจะติดต่อกลับ", sentAt: Date.now() };
}
