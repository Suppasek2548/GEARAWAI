"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { useFocusFirstError } from "@/hooks/use-focus-first-error";
import { ForgotPasswordDialog } from "./forgot-password-dialog";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(loginAction, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useFocusFirstError(state);
  // "ลืมรหัสผ่าน?" modal — also opened by /login?forgot=1 (the "ขอลิงก์ใหม่" button on an expired reset link)
  const [forgotOpen, setForgotOpen] = useState(searchParams.get("forgot") === "1");
  const [forgotEmail, setForgotEmail] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const resetDone = searchParams.get("reset") === "success";

  return (
    <>
      <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirectTo} />

        {resetDone && !state.error && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-btn border border-success/40 bg-success/10 p-3 text-sm text-success"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            ตั้งรหัสผ่านใหม่เรียบร้อย กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
          </div>
        )}

        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.error}
          </div>
        )}

        <Field id="email" label="อีเมล" error={fe.email} required>
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            invalid={Boolean(fe.email)}
            required
          />
        </Field>

        <Field id="password" label="รหัสผ่าน" error={fe.password} required>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            invalid={Boolean(fe.password)}
            required
          />
        </Field>
        <button
          type="button"
          onClick={() => {
            setForgotEmail(emailRef.current?.value ?? ""); // pre-fill with what was typed on the login form
            setForgotOpen(true);
          }}
          className="-mt-2 self-end text-sm font-medium text-brand-accent hover:underline"
        >
          ลืมรหัสผ่าน?
        </button>

        <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
          LOGIN
        </Button>

        <p className="text-center text-sm text-ink-soft">
          ยังไม่มีบัญชี?{" "}
          <Link
            href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
            className="font-semibold text-brand-accent hover:underline"
          >
            Register
          </Link>
        </p>
      </form>

      {/* outside the login <form>: the dialog has its own form, and forms must not nest */}
      <ForgotPasswordDialog
        open={forgotOpen}
        initialEmail={forgotEmail}
        onClose={() => setForgotOpen(false)}
      />
    </>
  );
}
