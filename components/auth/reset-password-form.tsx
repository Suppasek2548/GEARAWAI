"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { updatePasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { useFocusFirstError } from "@/hooks/use-focus-first-error";

/** New password + confirmation → updatePasswordAction (Supabase updateUser, recovery session only). */
export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(updatePasswordAction, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useFocusFirstError(state);

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </div>
      )}

      <Field
        id="password"
        label="รหัสผ่านใหม่"
        error={fe.password}
        hint="อย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข"
        required
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          invalid={Boolean(fe.password)}
          required
        />
      </Field>

      <Field id="confirmPassword" label="ยืนยันรหัสผ่านใหม่" error={fe.confirmPassword} required>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          invalid={Boolean(fe.confirmPassword)}
          required
        />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        ตั้งรหัสผ่านใหม่
      </Button>
    </form>
  );
}
