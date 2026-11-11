import { Badge } from "@/components/ui/misc";
import type { OrderStatus, PaymentStatus } from "@/lib/data/member";

// UI §11.2 order status badges (text + color)
const ORDER: Record<OrderStatus, { label: string; tone: "warning" | "info" | "success" | "danger" }> = {
  pending_payment: { label: "รอชำระเงิน", tone: "warning" },
  payment_submitted: { label: "รอตรวจสอบการชำระ", tone: "info" },
  paid: { label: "ชำระแล้ว / กำลังเตรียมจัดส่ง", tone: "success" },
  shipped: { label: "จัดส่งแล้ว", tone: "info" },
  completed: { label: "สำเร็จ", tone: "success" },
  cancelled: { label: "ยกเลิก", tone: "danger" },
};

const PAYMENT: Record<
  PaymentStatus,
  { label: string; tone: "warning" | "info" | "success" | "danger" | "neutral" }
> = {
  pending: { label: "ยังไม่แจ้งชำระ", tone: "neutral" },
  submitted: { label: "แจ้งชำระแล้ว รอตรวจสอบ", tone: "info" },
  verified: { label: "ยืนยันการชำระแล้ว", tone: "success" },
  rejected: { label: "ถูกปฏิเสธ", tone: "danger" },
  voided: { label: "ยกเลิกหลังแจ้งชำระ (Demo)", tone: "neutral" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function orderStatusLabel(status: OrderStatus) {
  return ORDER[status].label;
}
