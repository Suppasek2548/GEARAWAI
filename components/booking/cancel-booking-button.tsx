"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelBookingAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function CancelBookingButton({
  bookingId,
  bookingNumber,
}: {
  bookingId: string;
  bookingNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger hover:text-danger"
        onClick={() => setOpen(true)}
      >
        ยกเลิก
      </Button>
      <ConfirmDialog
        open={open}
        title={`ยกเลิกการจอง ${bookingNumber}?`}
        description="ช่วงเวลานี้จะกลับมาว่างให้ผู้อื่นจองได้"
        confirmLabel="ยืนยันการยกเลิก"
        cancelLabel="ไม่ยกเลิก"
        danger
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          start(async () => {
            const res = await cancelBookingAction(bookingId);
            if (res.ok) toast.success(res.message);
            else toast.error(res.message);
            setOpen(false);
          })
        }
      />
    </>
  );
}
