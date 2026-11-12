"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, MailCheck } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/**
 * Login-page only: e-mail form in a native <dialog> (focus trap + Esc), styled like ConfirmDialog.
 * The reply never says whether the e-mail has an account.
 */
export function ForgotPasswordDialog({
  open,
  initialEmail,
  onClose,
}: {
  open: boolean;
  initialEmail?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setEmail(initialEmail ?? "");
      setFieldError(null);
      setError(null);
      setSent(null);
      d.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open, initialEmail]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setError(null);
    start(async () => {
      const res = await requestPasswordResetAction(email);
      if (res.ok) setSent(res.message);
      else if (res.field === "email") setFieldError(res.message);
      else setError(res.message);
    });
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !pending) onClose(); // click on backdrop
      }}
      aria-labelledby="forgot-title"
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-canvas/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div>
          <h2 id="forgot-title" className="font-display text-2xl font-bold">
            ลืมรหัสผ่าน?
          </h2>
          <p className="mt-1 text-sm text-ink-soft">กรอกอีเมลที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>
        </div>

        {sent ? (
          <>
            <div
              role="status"
              className="flex items-start gap-2 rounded-btn border border-success/40 bg-success/10 p-3 text-sm text-success"
            >
              <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              {sent}
            </div>
            <p className="text-xs text-ink-muted">เปิดลิงก์ในอีเมลด้วยเบราว์เซอร์เดียวกับหน้านี้</p>
            <Button size="lg" className="w-full" onClick={onClose}>
              กลับไปเข้าสู่ระบบ
            </Button>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </div>
            )}
            <Field id="forgot-email" label="อีเมล" error={fieldError ?? undefined} required>
              <Input
                ref={inputRef}
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={Boolean(fieldError)}
                required
              />
            </Field>
            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
                ยกเลิก
              </Button>
              <Button type="submit" loading={pending}>
                ส่งลิงก์รีเซ็ตรหัสผ่าน
              </Button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
