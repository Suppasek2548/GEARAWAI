"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils/cn";

function strength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  const labels = ["", "อ่อน", "พอใช้", "ดี", "แข็งแรง"];
  return { score, label: labels[score] };
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(registerAction, {});
  const [password, setPassword] = useState("");
  const fe = state.fieldErrors ?? {};
  const s = strength(password);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </div>
      )}

      <Field id="fullName" label="ชื่อ-นามสกุล" error={fe.fullName} required>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          maxLength={100}
          defaultValue={state.values?.fullName}
          invalid={Boolean(fe.fullName)}
          required
        />
      </Field>

      <Field id="email" label="อีเมล" error={fe.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          invalid={Boolean(fe.email)}
          required
        />
      </Field>

      <Field
        id="password"
        label="รหัสผ่าน"
        error={fe.password}
        hint="อย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข"
        required
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          invalid={Boolean(fe.password)}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {password && (
          <div className="flex items-center gap-2" aria-live="polite">
            <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full",
                    i <= s.score
                      ? s.score <= 1
                        ? "bg-danger"
                        : s.score === 2
                          ? "bg-warning"
                          : "bg-success"
                      : "bg-elevated",
                  )}
                />
              ))}
            </div>
            <span className="w-14 text-right text-xs text-ink-muted">{s.label}</span>
          </div>
        )}
      </Field>

      <Field id="confirmPassword" label="ยืนยันรหัสผ่าน" error={fe.confirmPassword} required>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          invalid={Boolean(fe.confirmPassword)}
          required
        />
      </Field>

      <Field
        id="birthDate"
        label="วันเกิด (ไม่บังคับ)"
        error={fe.birthDate}
        hint="กรอกเพื่อรับสิทธิ์วันเกิด — ตั้งครั้งแรกแล้วแก้ไขได้อีก 1 ครั้ง"
      >
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          min="1900-01-02"
          defaultValue={state.values?.birthDate}
          invalid={Boolean(fe.birthDate)}
        />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        CREATE ACCOUNT
      </Button>

      <p className="text-center text-sm text-ink-soft">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="font-semibold text-brand-accent hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
