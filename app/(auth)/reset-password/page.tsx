import type { Metadata } from "next";
import { Suspense } from "react";
import { LinkIcon } from "lucide-react";
import { hasRecoverySession } from "@/lib/auth/recovery";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่", robots: { index: false } };

/**
 * Reached only from the password-reset e-mail (via /auth/callback). Without a recovery session it
 * shows "link expired / invalid" instead of the form — there is no other way into this page.
 */
export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <div className="w-full max-w-[420px] rounded-card border border-line bg-surface p-6 shadow-2xl sm:p-8">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/reset-password">["searchParams"] }) {
  const sp = await searchParams;
  const linkError = typeof sp.error === "string" ? sp.error : null;
  const allowed = !linkError && (await hasRecoverySession());

  if (!allowed) {
    const expired = linkError === "expired";
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <LinkIcon className="size-12 text-warning" aria-hidden strokeWidth={1.5} />
        <h1 className="font-display text-2xl font-bold">
          {expired ? "ลิงก์หมดอายุแล้ว" : "ลิงก์ไม่ถูกต้องหรือใช้ไปแล้ว"}
        </h1>
        <p className="text-ink-soft">
          {expired
            ? "ลิงก์ตั้งรหัสผ่านใหม่มีอายุจำกัดและใช้ได้ครั้งเดียว กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ"
            : "กรุณาเปิดลิงก์ล่าสุดจากอีเมลในเบราว์เซอร์เดียวกับที่กดขอรีเซ็ตรหัสผ่าน หรือขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ"}
        </p>
        <ButtonLink href="/login?forgot=1" className="w-full">
          ขอลิงก์ใหม่
        </ButtonLink>
        <ButtonLink href="/login" variant="ghost" className="w-full">
          กลับไปหน้าเข้าสู่ระบบ
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold">ตั้งรหัสผ่านใหม่</h1>
      <p className="mt-1 mb-6 text-ink-soft">กรอกรหัสผ่านใหม่ แล้วเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านนี้</p>
      <ResetPasswordForm />
    </>
  );
}
