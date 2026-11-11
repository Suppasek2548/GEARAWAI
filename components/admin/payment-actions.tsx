"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { verifyPaymentAction } from "@/lib/actions/admin-orders";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** ADMIN §4.8 — approve (→ paid, sold_count +) or reject with a reason (→ order back to pending_payment). */
export function PaymentActions({ paymentId, orderNumber }: { paymentId: string; orderNumber: string }) {
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (approve: boolean) =>
    start(async () => {
      const res = await verifyPaymentAction(paymentId, approve, reason);
      if (res.ok) {
        toast.success(res.message);
        setDialog(null);
        setReason("");
        setError(null);
      } else setError(res.message);
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => setDialog("approve")}>
        ยืนยันการชำระ
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-danger hover:text-danger"
        onClick={() => setDialog("reject")}
      >
        ปฏิเสธ
      </Button>
      <ConfirmDialog
        open={dialog === "approve"}
        title={`ยืนยันการชำระของ ${orderNumber}?`}
        description={
          <div className="flex flex-col gap-2">
            <p>คำสั่งซื้อจะเปลี่ยนเป็น “ชำระแล้ว” และนับเป็นยอดขาย</p>
            <p className="text-warning">ระบบจำลอง — การยืนยันนี้ไม่ได้หมายถึงการได้รับเงินจริง</p>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </div>
        }
        confirmLabel="ยืนยัน"
        loading={pending}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(true)}
      />
      <ConfirmDialog
        open={dialog === "reject"}
        title={`ปฏิเสธการแจ้งชำระของ ${orderNumber}?`}
        description={
          <div className="flex flex-col gap-2">
            <p>คำสั่งซื้อจะกลับเป็น “รอชำระเงิน” ให้ลูกค้าแจ้งใหม่</p>
            <label htmlFor="reject-reason" className="text-sm text-ink-soft">
              เหตุผล <span className="text-danger">*</span>
            </label>
            <input
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              className="h-11 rounded-btn border border-line bg-canvas px-3 text-ink"
            />
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        }
        confirmLabel="ปฏิเสธ"
        danger
        loading={pending}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(false)}
      />
    </div>
  );
}
