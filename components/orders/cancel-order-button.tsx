"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelMyOrderAction } from "@/lib/actions/checkout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** S14-F10 — member cancels while pending_payment; a reason is required (cancel_order). */
export function CancelOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => setOpen(true)}>
        ยกเลิกคำสั่งซื้อ
      </Button>
      <ConfirmDialog
        open={open}
        title={`ยกเลิกคำสั่งซื้อ ${orderNumber}?`}
        danger
        confirmLabel="ยืนยันการยกเลิก"
        cancelLabel="ไม่ยกเลิก"
        loading={pending}
        onCancel={() => {
          setOpen(false);
          setError(null);
        }}
        onConfirm={() =>
          start(async () => {
            const res = await cancelMyOrderAction(orderId, reason);
            if (!res.ok) {
              setError(res.message);
              return;
            }
            setOpen(false);
            toast.success("ยกเลิกคำสั่งซื้อแล้ว — คืนสต็อกและคูปองเรียบร้อย");
            router.refresh();
          })
        }
        description={
          <div className="flex flex-col gap-2">
            <p>สินค้าจะถูกคืนเข้าสต็อก และคูปองที่ใช้จะได้รับสิทธิ์คืน</p>
            <label htmlFor="cancel-reason" className="text-sm text-ink-soft">
              เหตุผลในการยกเลิก <span className="text-danger">*</span>
            </label>
            <input
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              className="h-11 rounded-btn border border-line bg-canvas px-3 text-ink"
              aria-invalid={Boolean(error) || undefined}
            />
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        }
      />
    </>
  );
}
