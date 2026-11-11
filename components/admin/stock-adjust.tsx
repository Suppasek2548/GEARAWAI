"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adjustStockAction } from "@/lib/actions/admin-catalog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Adjust stock modal: restock (+) or adjustment (±, reason required), preview "after = X", never below 0. */
export function StockAdjustButton({
  productId,
  name,
  current,
}: {
  productId: string;
  name: string;
  current: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"restock" | "adjustment">("restock");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const n = Number(amount);
  const valid = Number.isInteger(n) && n !== 0 && (type === "adjustment" || n > 0);
  const after = valid ? current + n : current;

  const submit = () =>
    start(async () => {
      if (!valid) return setError(type === "restock" ? "กรอกจำนวนเต็มบวก" : "กรอกจำนวนเต็มที่ไม่ใช่ 0 (ติดลบได้)");
      if (after < 0) return setError("สต็อกหลังปรับต้องไม่ติดลบ");
      if (type === "adjustment" && !note.trim()) return setError("กรุณาระบุเหตุผลการปรับสต็อก");
      const res = await adjustStockAction(productId, type, n, note);
      if (!res.ok) return setError(res.message);
      toast.success(res.message);
      setOpen(false);
      setAmount("");
      setNote("");
      setError(null);
      router.refresh();
    });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        ปรับสต็อก
      </Button>
      <ConfirmDialog
        open={open}
        title={`ปรับสต็อก: ${name}`}
        confirmLabel="บันทึก"
        loading={pending}
        onCancel={() => {
          setOpen(false);
          setError(null);
        }}
        onConfirm={submit}
        description={
          <div className="flex flex-col gap-3 text-sm">
            <p>
              คงเหลือปัจจุบัน <strong>{current}</strong> ชิ้น
            </p>
            <fieldset className="flex gap-4">
              <legend className="sr-only">ประเภท</legend>
              {(
                [
                  ["restock", "รับเข้า (+)"],
                  ["adjustment", "ปรับปรุง (±)"],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="stock-type"
                    checked={type === v}
                    onChange={() => setType(v)}
                    className="accent-brand-lime"
                  />
                  {l}
                </label>
              ))}
            </fieldset>
            <label htmlFor="stock-amount" className="text-ink-soft">
              จำนวน {type === "adjustment" && "(ใส่ − เพื่อลด)"}
            </label>
            <input
              id="stock-amount"
              type="number"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 rounded-btn border border-line bg-canvas px-3 text-ink"
            />
            <label htmlFor="stock-note" className="text-ink-soft">
              หมายเหตุ {type === "adjustment" && <span className="text-danger">*</span>}
            </label>
            <input
              id="stock-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              className="h-11 rounded-btn border border-line bg-canvas px-3 text-ink"
            />
            <p className={after < 0 ? "text-danger" : "text-ink-soft"}>
              คงเหลือหลังปรับ = <strong>{after}</strong>
            </p>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </div>
        }
      />
    </>
  );
}
