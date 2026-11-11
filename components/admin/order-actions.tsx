"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  adminCancelOrderAction,
  updateOrderStatusAction,
  type AdminResult,
} from "@/lib/actions/admin-orders";
import { ButtonLink, Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { OrderStatus } from "@/lib/data/member";

type Dialog = "ship" | "complete" | "cancel" | null;

/** Buttons depend on the current status (ADMIN_DESIGN §4.7). Every action has a confirmation. */
export function AdminOrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<AdminResult>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message);
        setDialog(null);
        setText("");
        setError(null);
      } else setError(res.message);
    });

  const canCancel = status === "pending_payment" || status === "payment_submitted" || status === "paid";
  if (status === "completed" || status === "cancelled") {
    return <p className="text-sm text-ink-muted">คำสั่งซื้อนี้ปิดแล้ว (อ่านอย่างเดียว)</p>;
  }

  const input = (label: string, required: boolean) => (
    <div className="flex flex-col gap-2">
      <label htmlFor="admin-order-input" className="text-sm text-ink-soft">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        id="admin-order-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        className="h-11 rounded-btn border border-line bg-canvas px-3 text-ink"
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {status === "payment_submitted" && (
        <ButtonLink href="/admin/payments?status=submitted" variant="secondary">
          ไปตรวจสอบการชำระ
        </ButtonLink>
      )}
      {status === "paid" && <Button onClick={() => setDialog("ship")}>บันทึกการจัดส่ง</Button>}
      {status === "shipped" && <Button onClick={() => setDialog("complete")}>ปิดงาน — สำเร็จ</Button>}
      {canCancel && (
        <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => setDialog("cancel")}>
          ยกเลิกคำสั่งซื้อ
        </Button>
      )}

      <ConfirmDialog
        open={dialog === "ship"}
        title="บันทึกการจัดส่ง?"
        description={input("Tracking Number (ไม่บังคับ)", false)}
        confirmLabel="บันทึก → จัดส่งแล้ว"
        loading={pending}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => updateOrderStatusAction(orderId, "shipped", text))}
      />
      <ConfirmDialog
        open={dialog === "complete"}
        title="ปิดงานคำสั่งซื้อนี้?"
        description="สถานะจะเป็น 'สำเร็จ' และระบบจะให้คะแนนสะสมแก่สมาชิกอัตโนมัติ (ย้อนกลับไม่ได้)"
        confirmLabel="ปิดงาน"
        loading={pending}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => updateOrderStatusAction(orderId, "completed"))}
      />
      <ConfirmDialog
        open={dialog === "cancel"}
        title="ยกเลิกคำสั่งซื้อ?"
        description={
          <div className="flex flex-col gap-3">
            <p>
              คืนสต็อกและคูปอง
              {status === "paid" ? " · ลดยอดขาย · การชำระจะเป็น 'voided' (Demo — ไม่มีการคืนเงินจริง)" : ""}
            </p>
            {input("เหตุผลในการยกเลิก", true)}
          </div>
        }
        confirmLabel="ยืนยันการยกเลิก"
        danger
        loading={pending}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => adminCancelOrderAction(orderId, text))}
      />
    </div>
  );
}
