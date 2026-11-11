import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/** 403 (UI §14.6) — shown in place of the protected page, so the URL stays the same. */
export function ForbiddenView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <ShieldAlert className="size-16 text-danger" aria-hidden strokeWidth={1.5} />
      <p className="font-display text-sm font-semibold tracking-[0.3em] text-danger">ERROR 403</p>
      <h1 className="font-display text-3xl font-bold">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
      <p className="max-w-md text-ink-soft">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อร้าน</p>
      <ButtonLink href="/" size="lg" className="mt-2">
        กลับหน้าแรก
      </ButtonLink>
    </div>
  );
}
