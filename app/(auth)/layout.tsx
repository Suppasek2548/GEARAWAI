import Link from "next/link";
import { ArrowLeft, Cake, Coins, Gift } from "lucide-react";
import { Logo } from "@/components/layout/logo";

/** Login / Register split layout (UI §10.1, §10.4): brand panel left on ≥1024px, form centered otherwise. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgb(227_239_79/0.18),transparent_45%)]"
        />
        <Logo className="relative" />
        <div className="relative flex flex-col gap-6">
          <h2 className="font-display text-5xl leading-tight font-bold tracking-[0.04em] uppercase">
            Level up
            <br />
            your gear
          </h2>
          <ul className="flex flex-col gap-3 text-ink-soft">
            <li className="flex items-center gap-3">
              <Coins className="size-5 text-brand-lime" aria-hidden /> สะสมคะแนนทุกคำสั่งซื้อ
            </li>
            <li className="flex items-center gap-3">
              <Gift className="size-5 text-brand-lime" aria-hidden /> แลกของรางวัลด้วยคะแนน
            </li>
            <li className="flex items-center gap-3">
              <Cake className="size-5 text-brand-lime" aria-hidden /> สิทธิพิเศษวันเกิด
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-ink-soft">โครงงานเพื่อการศึกษา · ระบบชำระเงินเป็นระบบจำลอง</p>
      </aside>

      <div className="flex flex-col bg-canvas md:bg-brand-gradient lg:bg-canvas lg:bg-none">
        <div className="flex items-center justify-between p-4 md:p-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden /> กลับหน้าร้าน
          </Link>
          <Logo className="lg:hidden" />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center px-4 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
