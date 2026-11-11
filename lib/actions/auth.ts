"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, loginSchema, registerSchema, type FieldErrors } from "@/lib/validation/auth";
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
