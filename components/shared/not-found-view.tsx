import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/** 404 content (UI §14.6) — used by both the root and the storefront not-found boundaries. */
export function NotFoundView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <SearchX className="size-16 text-brand-accent" aria-hidden strokeWidth={1.5} />
      <p className="font-display text-sm font-semibold tracking-[0.3em] text-brand-accent">ERROR 404</p>
      <h1 className="font-display text-3xl font-bold">ไม่พบหน้าที่คุณต้องการ</h1>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/" size="lg">
          กลับหน้าแรก
        </ButtonLink>
        <ButtonLink href="/shop" size="lg" variant="outline">
          ไปที่ร้านค้า
        </ButtonLink>
      </div>
    </div>
  );
}
