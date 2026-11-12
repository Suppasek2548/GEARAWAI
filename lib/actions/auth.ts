"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRecoverySession, RECOVERY_COOKIE } from "@/lib/auth/recovery";
import { resolveSiteUrl } from "@/lib/auth/site-url";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type FieldErrors,
} from "@/lib/validation/auth";
import { safeRedirectPath } from "@/lib/utils/redirect";
import { GENERIC_ERROR } from "@/lib/errors";

export type AuthFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

/** S05-F01/F02/F03 — sign up. Never sends `role` (the DB trigger ignores metadata roles anyway, R-07). */
export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
  };
  const values = { fullName: raw.fullName, email: raw.email, birthDate: raw.birthDate };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { fullName, email, password, birthDate } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, ...(birthDate ? { birth_date: birthDate } : {}) } },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return { fieldErrors: { email: "อีเมลนี้ถูกใช้สมัครแล้ว" }, values };
    }
    if (/password/i.test(error.message)) {
      return { fieldErrors: { password: "รหัสผ่านไม่ผ่านเงื่อนไขความปลอดภัย กรุณาตั้งใหม่" }, values };
    }
    return { error: GENERIC_ERROR, values };
  }

  // With "Confirm email" OFF (D-02) Supabase returns a session → signed in immediately.
  // Supabase hides duplicate e-mails when confirmation is ON by returning a user without identities.
  if (data.user && data.user.identities?.length === 0) {
    return { fieldErrors: { email: "อีเมลนี้ถูกใช้สมัครแล้ว" }, values };
  }
  if (!data.session) {
    return {
      error: "สมัครสมาชิกแล้ว แต่ระบบยังเปิดการยืนยันอีเมลอยู่ — ผู้ดูแลต้องปิด Confirm email ใน Supabase (D-02)",
      values,
    };
  }

  redirect("/dashboard?welcome=1");
}

/** S05-F04/F08 — sign in, then go back to ?redirect= (same-site only) or the right home for the role. */
export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { email: raw.email };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    // Supabase rate limit (HTTP 429 / over_request_rate_limit) is not a wrong password — say so,
    // otherwise users keep retrying a correct password (Phase 6, BUG-06).
    if (error?.status === 429 || error?.code === "over_request_rate_limit") {
      return { error: "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่", values };
    }
    // Do not reveal which field was wrong (UI §10.2)
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", values };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", data.user.id)
    .maybeSingle();

  const requested = formData.get("redirect");
  const isAdmin = profile?.role === "admin" && profile?.account_status === "active";
  const fallback = isAdmin ? "/admin" : "/dashboard";
  redirect(safeRedirectPath(requested, fallback));
}

/** S05-F05 / S14-F09 — sign out and clear the session cookie. */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/* ------------------------------------------------------------------ */
/* Forgot / reset password (Supabase Auth only — no password storage)   */
/* ------------------------------------------------------------------ */

export type ForgotPasswordResult =
  { ok: true; message: string } | { ok: false; message: string; field?: string };

/** Same answer whether or not an account exists, so the form cannot be used to probe e-mails. */
const RESET_SENT =
  "ถ้ามีบัญชีที่ใช้อีเมลนี้ ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปแล้ว กรุณาตรวจกล่องจดหมาย (รวมถึงโฟลเดอร์สแปม) ลิงก์ใช้ได้ครั้งเดียวและมีอายุจำกัด";

/**
 * Login-page modal → Supabase `resetPasswordForEmail()`. The e-mail link returns to /auth/callback,
 * which exchanges the PKCE code (verifier cookie written here, so open the link in this same browser).
 * The link's base URL comes only from resolveSiteUrl() (D-25) — never from the request's Host headers.
 * When it refuses (Preview, missing or disallowed URL) no e-mail is sent at all.
 */
export async function requestPasswordResetAction(rawEmail: string): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return { ok: false, field: "email", message: parsed.error.issues[0]?.message ?? "รูปแบบอีเมลไม่ถูกต้อง" };
  }

  const site = resolveSiteUrl(process.env);
  if (!site.ok) {
    // reason code only — never the e-mail address
    console.error(`[forgot-password] reset e-mail not sent: ${site.reason}`);
    return {
      ok: false,
      message:
        site.reason === "PREVIEW_DISABLED"
          ? "การรีเซ็ตรหัสผ่านปิดใช้งานในเวอร์ชันทดสอบนี้"
          : "ระบบรีเซ็ตรหัสผ่านยังไม่พร้อมใช้งาน กรุณาติดต่อร้าน",
    };
  }
  const redirectTo = `${site.url}/auth/callback?next=/reset-password`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  if (error) {
    if (error.status === 429 || /rate limit/i.test(error.message)) {
      return { ok: false, message: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" };
    }
    return { ok: false, message: "ส่งอีเมลไม่สำเร็จในขณะนี้ กรุณาลองใหม่ภายหลัง" };
  }
  return { ok: true, message: RESET_SENT };
}

/**
 * /reset-password → Supabase `updateUser({ password })`, allowed only with a recovery session
 * (see lib/auth/recovery.ts). Afterwards the recovery session is closed and the user logs in again.
 */
export async function updatePasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  if (!(await hasRecoverySession())) {
    return { error: "ลิงก์ตั้งรหัสผ่านหมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password" || /different from the old/i.test(error.message)) {
      return { fieldErrors: { password: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" } };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "รหัสผ่านไม่ผ่านเงื่อนไขความปลอดภัย กรุณาตั้งใหม่" } };
    }
    if (error.status === 401 || error.code === "session_not_found" || error.code === "session_expired") {
      return { error: "ลิงก์ตั้งรหัสผ่านหมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ" };
    }
    return { error: GENERIC_ERROR };
  }

  (await cookies()).delete(RECOVERY_COOKIE);
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?reset=success");
}
