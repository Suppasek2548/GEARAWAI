import { UserRoundX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/**
 * Shown to an ADMIN who opens a customer's member-only order page (payment / order detail) — e.g. after
 * switching accounts in the same browser. Members still get a 404 so another customer's order number
 * reveals nothing. The order itself is intact; admins manage it in Admin → Orders.
 */
export function OtherOwnerNotice({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-card border border-line bg-surface p-8 text-center">
      <UserRoundX className="size-12 text-brand-accent" aria-hidden strokeWidth={1.5} />
      <h2 className="font-display text-xl font-bold">คำสั่งซื้อนี้เป็นของบัญชีอื่น</h2>
      <p className="text-ink-soft">
        คุณเข้าสู่ระบบด้วยบัญชีผู้ดูแล จึงเปิดหน้าของลูกค้าสำหรับคำสั่งซื้อ{" "}
        <span className="font-mono font-semibold text-ink">{orderNumber}</span> ไม่ได้ — คำสั่งซื้อยังอยู่ครบ
        จัดการได้ที่หลังบ้าน หรือเข้าสู่ระบบด้วยบัญชีลูกค้าเพื่อชำระเงิน
      </p>
      <ButtonLink href={`/admin/orders/${orderId}`}>เปิดใน Admin → Orders</ButtonLink>
    </section>
  );
}
